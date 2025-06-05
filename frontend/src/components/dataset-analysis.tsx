import { useState, useCallback } from "react"
import { Database, Upload, Calculator } from "lucide-react"
import { useSeal } from "@/lib/homomorphic-service"
import { API_BASE_URL } from "@/config/api"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DatasetResultCard from "./dataset-result-card"
import { Input } from "@/components/ui/input"

interface DatasetAnalysisProps {
  setError: (error: string | null) => void
}

export default function DatasetAnalysis({ setError }: DatasetAnalysisProps) {
  const [dataset, setDataset] = useState<number[][]>([])
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [selectedColumn, setSelectedColumn] = useState<string>("")
  const [calculationType, setCalculationType] = useState<string>("sum")
  const [datasetResult, setDatasetResult] = useState<{ type: string; value: number; column: string } | null>(null)
  const { loading, encryptNumber, decryptToNumber, publicKey, schemeType, setSchemeType } = useSeal()
  const [processingDataset, setProcessingDataset] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loadingResult, setLoadingResult] = useState(false)
  const [errorResult, setErrorResult] = useState<string | null>(null)

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',')

        const dataRows = lines.slice(1).map(line => line.split(','))
        const numericColumnIndices = headers.map((_, i) =>
          dataRows.every(row => !isNaN(Number(row[i])))
        )

        const numericColumns = headers.filter((_, i) => numericColumnIndices[i])
        if (numericColumns.length === 0) {
          setError("No numeric columns found in the dataset")
          return
        }

        const numericData = dataRows.map(row => row.map(cell => Number(cell)))
        setColumnNames(numericColumns)
        setDataset(numericData)
        setSelectedColumn(numericColumns[0])
      } catch {
        setError("Failed to parse CSV file. Please ensure it's properly formatted.")
      }
    }
    reader.readAsText(file)
  }, [setError])

  const handleCalculate = async () => {
    if (!selectedColumn || dataset.length === 0) {
      setError("Please upload a dataset and select a column")
      return
    }

    setProcessingDataset(true)

    try {
      const columnIndex = columnNames.indexOf(selectedColumn)
      if (columnIndex === -1) {
        throw new Error("Selected column not found in dataset")
      }

      // Get all values from the selected column
      const columnValues = dataset.map(row => row[columnIndex])

      // Encrypt all values
      const encryptedValues = columnValues.map(value => encryptNumber(value))
      if (encryptedValues.some(v => v === null)) {
        throw new Error("Encryption failed for some values")
      }

      // Send to backend for calculation
      const response = await fetch(`${API_BASE_URL}/dataset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedValues,
          publicKey,
          schemeType,
        }),
      })

      if (!response.ok) {
        throw new Error("Server error during dataset calculation")
      }

      const data = await response.json()

      // Decrypt the result
      const decryptedResult = decryptToNumber(data.encryptedResult)
      if (decryptedResult === null) {
        throw new Error("Decryption failed")
      }

      setDatasetResult({
        type: calculationType,
        value: decryptedResult,
        column: selectedColumn
      })
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setProcessingDataset(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingResult(true)
    setErrorResult(null)
    try {
      const response = await fetch(`${API_BASE_URL}/demo/dataset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numbers: numbers.split(",").map(Number) }),
      })
      if (!response.ok) {
        throw new Error("Failed to analyze dataset")
      }
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setErrorResult(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoadingResult(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Dataset Analysis
          </CardTitle>
          <CardDescription>Upload a CSV file and perform calculations on encrypted data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Dataset (CSV)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file')?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose CSV File
              </Button>
            </div>
            {dataset.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Loaded {dataset.length} rows with {columnNames.length} columns
              </p>
            )}
          </div>

          {dataset.length > 0 && (
            <div className="flex flex-row gap-4 mt-8">
              <div className="space-y-2 w-full">
                <Label htmlFor="column">Select Column</Label>
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="calculation">Calculation Type</Label>
                <Select value={calculationType} onValueChange={setCalculationType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select calculation" />
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
          )}
        </CardContent>
        <CardFooter className="flex flex-row gap-4">
          <div className="flex">
            <Label htmlFor="scheme" className="sr-only">Encryption Scheme</Label>
            <Select value={schemeType} onValueChange={(value: 'bfv' | 'ckks') => setSchemeType(value)}>
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
            onClick={handleCalculate}
            disabled={loading || !publicKey || !selectedColumn || dataset.length === 0 || processingDataset}
            className="flex-1"
          >
            {processingDataset ? (
              "Processing..."
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <DatasetResultCard result={datasetResult} />
    </div>
  )
}
