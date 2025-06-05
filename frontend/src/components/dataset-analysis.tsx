import { useState, useCallback } from "react"
import { Database, Upload, Calculator } from "lucide-react"
import { useSeal } from "@/lib/homomorphic-service"
import { API_BASE_URL } from "@/config/api"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DatasetResultCard from "./dataset-result-card"

interface DatasetResult {
  type: string
  value: number
  column: string
}

interface DatasetAnalysisProps {
  setError: (error: string | null) => void
}

export function DatasetAnalysis({ setError }: DatasetAnalysisProps) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<DatasetResult | null>(null)
  const { loading, encryptNumber, publicKey, schemeType, setSchemeType } = useSeal()
  const [processingDataset, setProcessingDataset] = useState(false)

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFile(file)
      setError(null)
    }
  }, [setError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file first")
      return
    }

    setProcessingDataset(true)
    setError(null)
    setResult(null)

    try {
      const text = await file.text()
      const numbers = text
        .split(/[\n,]/)
        .map((n) => n.trim())
        .filter((n) => n)
        .map(Number)

      if (numbers.length === 0) {
        throw new Error("No valid numbers found in the file")
      }

      // Encrypt each number
      const encryptionStart = performance.now()
      const encryptedValues = await Promise.all(numbers.map(encryptNumber))
      const encryptionTime = performance.now() - encryptionStart

      // Send to backend for calculation
      const response = await fetch(`${API_BASE_URL}/demo/dataset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedValues,
          publicKey,
          schemeType,
          encryptionTime,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process dataset")
      }

      const data = await response.json()
      const result: DatasetResult = {
        type: "dataset",
        value: data.sum,
        column: "All Numbers",
      }
      setResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setProcessingDataset(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Analysis</CardTitle>
        <CardDescription>
          Upload a file containing numbers (comma or newline separated) to perform homomorphic
          encryption operations on the entire dataset.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheme">Encryption Scheme</Label>
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
          <div className="space-y-2">
            <Label htmlFor="file">Dataset File</Label>
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
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading || processingDataset}>
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
        </form>
      </CardContent>
      {result && <DatasetResultCard result={result} />}
    </Card>
  )
}
