"use client"

import { useState } from "react"
import { Database, Save } from "lucide-react"
import { useSeal } from "@/lib/homomorphic-service"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DatasetResultCard from "./dataset-result-card"

// Sample healthcare dataset columns
const healthcareColumns = [
  { id: "age", name: "Age", type: "number" },
  { id: "blood_pressure", name: "Blood Pressure", type: "number" },
  { id: "glucose_level", name: "Glucose Level", type: "number" },
  { id: "cholesterol", name: "Cholesterol", type: "number" },
  { id: "bmi", name: "BMI", type: "number" },
]

export default function DatasetAnalysis() {
  const [datasetValues, setDatasetValues] = useState<Record<string, number>>({
    age: 45,
    blood_pressure: 120,
    glucose_level: 85,
    cholesterol: 190,
    bmi: 24.5,
  })
  const [calculationType, setCalculationType] = useState<string>("sum")
  const [datasetResult, setDatasetResult] = useState<any>(null)
  const { loading, encryptNumber } = useSeal()
  const [updatingDataset, setUpdatingDataset] = useState(false)

  const handleInputChange = (columnId: string, value: string) => {
    setDatasetValues((prev) => ({
      ...prev,
      [columnId]: Number.parseFloat(value) || 0,
    }))
  }

  // This is just UI, not implementing actual functionality
  const handleDatasetCalculation = () => {
    // Simulate calculation result based on selected type
    const mockResults = {
      sum: 464.5,
      average: 92.9,
      median: 85,
      max: 190,
      min: 24.5,
    }

    setDatasetResult({
      type: calculationType,
      value: mockResults[calculationType as keyof typeof mockResults],
      encrypted: true,
      columns: Object.keys(datasetValues),
    })
  }

  // Handle updating the dataset row
  const handleUpdateDataset = () => {
    setUpdatingDataset(true)

    // Simulate encrypting and sending the dataset
    setTimeout(() => {
      // Simulate successful update
      toast({
        title: "Dataset Updated",
        description: "Your encrypted dataset row has been securely stored.",
      })
      setUpdatingDataset(false)
    }, 1000)
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <DatasetInputCard
        datasetValues={datasetValues}
        onInputChange={handleInputChange}
        onUpdateDataset={handleUpdateDataset}
        updating={updatingDataset}
      />

      <div className="space-y-6">
        <DatasetAnalysisCard
          calculationType={calculationType}
          setCalculationType={setCalculationType}
          onCalculate={handleDatasetCalculation}
          loading={loading}
        />

        <DatasetResultCard result={datasetResult} />
      </div>
    </div>
  )
}

interface DatasetInputCardProps {
  datasetValues: Record<string, number>
  onInputChange: (columnId: string, value: string) => void
  onUpdateDataset: () => void
  updating: boolean
}

function DatasetInputCard({ datasetValues, onInputChange, onUpdateDataset, updating }: DatasetInputCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Healthcare Dataset Row
        </CardTitle>
        <CardDescription>Enter values for a single row of healthcare data</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthcareColumns.map((column) => (
              <TableRow key={column.id}>
                <TableCell className="font-medium">{column.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={datasetValues[column.id]}
                    onChange={(e) => onInputChange(column.id, e.target.value)}
                    step="0.1"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button onClick={onUpdateDataset} disabled={updating} className="w-full" variant="outline">
          {updating ? (
            "Encrypting and Updating..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Update Dataset Row
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">This will encrypt your data and securely store it for analysis</p>
      </CardFooter>
    </Card>
  )
}

interface DatasetAnalysisCardProps {
  calculationType: string
  setCalculationType: (type: string) => void
  onCalculate: () => void
  loading: boolean
}

function DatasetAnalysisCard({ calculationType, setCalculationType, onCalculate, loading }: DatasetAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyze Dataset</CardTitle>
        <CardDescription>Select a calculation type to perform on the encrypted dataset</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="calculation">Calculation Type</Label>
          <Select value={calculationType} onValueChange={setCalculationType}>
            <SelectTrigger>
              <SelectValue placeholder="Select calculation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="median">Median</SelectItem>
              <SelectItem value="max">Maximum</SelectItem>
              <SelectItem value="min">Minimum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Available Homomorphic Operations</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Sum</Badge>
            <Badge variant="outline">Average</Badge>
            <Badge variant="outline">Median</Badge>
            <Badge variant="outline">Min/Max</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            These operations can be performed while data remains encrypted
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onCalculate} disabled={loading} className="w-full">
          {loading ? "Processing..." : "Process Encrypted Dataset"}
        </Button>
      </CardFooter>
    </Card>
  )
}
