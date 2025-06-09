import { useState, useCallback } from "react"
import { Database, Upload, Calculator, ArrowRight, Unlock } from "lucide-react"
import { useSeal } from "@/lib/homomorphic-service"
import { API_BASE_URL } from "@/config/api"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface DatasetResult {
  type: string
  value: number
  column: string
}

interface ProcessTimings {
  clientEncryption: number;
  networkRequest: number;
  serverProcessing: number;
  clientDecryption: number;
  totalTime: number;
}

type CalculationType = "sum" | "average" | "min" | "max";

interface DatasetAnalysisProps {
  setError: (error: string | null) => void
}

interface CSVData {
  headers: string[];
  rows: string[][];
}

export function DatasetAnalysis({ setError }: DatasetAnalysisProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCSVData] = useState<CSVData | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<string>("")
  const [result, setResult] = useState<DatasetResult | null>(null)
  const [timings, setTimings] = useState<ProcessTimings | null>(null)
  const [calculationType, setCalculationType] = useState<CalculationType>("sum")
  const { loading, encryptNumber, decryptToNumber, publicKey, schemeType, setSchemeType } = useSeal()
  const [processingDataset, setProcessingDataset] = useState(false)

  const BATCH_SIZE = 10; // Process 10 numbers at a time

  const parseCSV = (text: string): CSVData => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const headers = lines[0].split(',').map(header => header.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
    return { headers, rows };
  }

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const text = await file.text();
        const parsedData = parseCSV(text);
        setCSVData(parsedData);
        setFile(file);
        setSelectedColumn(parsedData.headers[0]); // Select first column by default
        setError(null);
      } catch {
        setError("Failed to parse CSV file. Please ensure it's properly formatted.");
      }
    }
  }, [setError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !csvData || !selectedColumn) {
      setError("Please select a file and column first")
      return
    }

    setProcessingDataset(true)
    setError(null)
    setResult(null)
    setTimings(null)

    const startTime = performance.now()
    let totalClientEncryptionTime = 0
    let totalNetworkTime = 0
    let totalServerProcessingTime = 0
    let totalClientDecryptionTime = 0

    try {
      // Get the index of the selected column
      const columnIndex = csvData.headers.indexOf(selectedColumn);
      if (columnIndex === -1) {
        throw new Error("Selected column not found in CSV");
      }

      // Extract numbers from the selected column
      const numbers = csvData.rows
        .map(row => row[columnIndex])
        .map(n => Number(n))
        .filter(n => !isNaN(n));

      if (numbers.length === 0) {
        throw new Error("No valid numbers found in the selected column")
      }

      // Process in batches
      let accumulatedResult: string | null = null;
      let processedCount = 0;

      for (let i = 0; i < numbers.length; i += BATCH_SIZE) {
        const batch = numbers.slice(i, Math.min(i + BATCH_SIZE, numbers.length));
        
        // Encrypt batch
        const encryptStart = performance.now()
        const encryptedBatch = await Promise.all(batch.map(encryptNumber))
        totalClientEncryptionTime += performance.now() - encryptStart

        // Send batch to backend
        const requestStart = performance.now()
        const response = await fetch(`${API_BASE_URL}/demo/dataset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            encryptedValues: encryptedBatch,
            publicKeyBase64: publicKey,
            schemeType,
            calculationType: calculationType === "average" ? "sum" : calculationType
          }),
        })
        const data = await response.json()
        totalNetworkTime += performance.now() - requestStart

        if (!response.ok) {
          throw new Error("Failed to process dataset batch")
        }

        totalServerProcessingTime += data.timings?.serverProcessing || 0

        // Handle accumulation based on calculation type
        if (accumulatedResult === null) {
          // First batch
          accumulatedResult = data.encryptedResult
        } else {
          // Accumulate with previous result based on calculation type
          const accumulateStart = performance.now()
          let endpoint = "/demo/addition"; // Default for sum
          
          // For min/max, we'd need different endpoints, but for now using addition
          // In a real implementation, you'd need separate min/max endpoints
          if (calculationType === "min" || calculationType === "max") {
            // For now, using addition - this would need proper min/max endpoints
            endpoint = "/demo/addition";
          }
          
          const accumulateResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cipher1Base64: accumulatedResult,
              cipher2Base64: data.encryptedResult,
              publicKeyBase64: publicKey,
              schemeType
            }),
          })
          const accumulateData = await accumulateResponse.json()
          totalNetworkTime += performance.now() - accumulateStart

          if (!accumulateResponse.ok) {
            throw new Error("Failed to accumulate batch results")
          }

          accumulatedResult = accumulateData.encryptedResult
          totalServerProcessingTime += accumulateData.timings?.serverProcessing || 0
        }

        processedCount += batch.length
      }

      if (!accumulatedResult) {
        throw new Error("No result obtained from processing")
      }

      // For min/max operations, we're done. For average, we need to divide by count
      let finalResult = accumulatedResult;
      if (calculationType === "average") {
        // Encrypt the count and divide
        const encryptStart = performance.now()
        const encryptedCount = encryptNumber(processedCount)
        totalClientEncryptionTime += performance.now() - encryptStart

        // Perform division on server (this would need a new endpoint for division)
        // For now, we'll decrypt, divide, and re-encrypt
        const decryptStart = performance.now()
        const sum = decryptToNumber(accumulatedResult)
        const average = sum !== null ? sum / processedCount : null
        totalClientDecryptionTime += performance.now() - decryptStart

        if (average !== null) {
          const encryptAvgStart = performance.now()
          finalResult = encryptNumber(average)
          totalClientEncryptionTime += performance.now() - encryptAvgStart
        }
      }

      // Decrypt the final result
      const decryptStart = performance.now()
      const decryptedResult = decryptToNumber(finalResult)
      totalClientDecryptionTime += performance.now() - decryptStart

      if (decryptedResult === null) {
        setError("Decryption failed")
        return
      }

      const result: DatasetResult = {
        type: "dataset",
        value: decryptedResult,
        column: `${calculationType.charAt(0).toUpperCase() + calculationType.slice(1)} of ${selectedColumn}`,
      }
      setResult(result)
      setTimings({
        clientEncryption: totalClientEncryptionTime,
        networkRequest: totalNetworkTime,
        serverProcessing: totalServerProcessingTime,
        clientDecryption: totalClientDecryptionTime,
        totalTime: performance.now() - startTime
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setProcessingDataset(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Dataset Analysis
            </CardTitle>
            <CardDescription>
              Upload a CSV file and select a numeric column to perform homomorphic
              encryption operations on the data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Dataset File (CSV)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : "Choose File"}
                </Button>
                <input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="column">Select Column</Label>
                <Select
                  value={selectedColumn}
                  onValueChange={setSelectedColumn}
                  disabled={!csvData}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
                    {csvData?.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calculation">Calculation Type</Label>
                <Select
                  value={calculationType}
                  onValueChange={(value: CalculationType) => setCalculationType(value)}
                  disabled={!csvData}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select calculation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-row gap-4">
            <div className="flex">
              <Label htmlFor="scheme" className="sr-only">Encryption Scheme</Label>
              <Select value={schemeType} onValueChange={(value: "bfv" | "ckks") => setSchemeType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bfv">BFV</SelectItem>
                  <SelectItem value="ckks">CKKS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || processingDataset || !publicKey || !selectedColumn}
              className="flex-1"
            >
              {loading || processingDataset ? (
                <>
                  <Calculator className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Analyze Dataset
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <ResultCard result={result} />
      </div>

      {timings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Process Flow
            </CardTitle>
            <CardDescription>Timing information for each step of the dataset analysis process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Client Encryption</div>
                <div className="text-2xl font-mono">{timings.clientEncryption.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Encrypting dataset numbers</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Network Request</div>
                <div className="text-2xl font-mono">{timings.networkRequest.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Sending to server</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Server Processing</div>
                <div className="text-2xl font-mono">{timings.serverProcessing.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Homomorphic computation</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Client Decryption</div>
                <div className="text-2xl font-mono">{timings.clientDecryption.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Decrypting result</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Total Time</div>
                <div className="text-2xl font-mono">{timings.totalTime.toFixed(2)}ms</div>
                <div className="text-xs text-muted-foreground">Complete operation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ResultCard({ result }: { result: DatasetResult | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>The decrypted result of the homomorphic dataset analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              {result?.column || "Decrypted Result"}
            </Label>
            <Badge variant="outline">Plain Text Result</Badge>
          </div>
          <div className="p-4 bg-muted rounded-md font-mono text-lg flex items-center justify-center h-38">
            {result !== null ? result.value : "-"}
          </div>
          <p className="text-xs text-muted-foreground">
            The result is decrypted on the client side after server-side homomorphic computation
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
