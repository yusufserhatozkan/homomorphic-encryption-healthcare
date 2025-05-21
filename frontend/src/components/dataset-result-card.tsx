"use client"

import { Database, Unlock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface DatasetResultCardProps {
  result: any
}

export default function DatasetResultCard({ result }: DatasetResultCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        <CardDescription>Homomorphically computed results from the encrypted dataset row</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {result ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  {result.type.charAt(0).toUpperCase() + result.type.slice(1)} Result
                </Label>
                <Badge variant="outline">Plain Text Result</Badge>
              </div>
              <div className="p-4 bg-muted rounded-md font-mono text-lg flex items-center justify-center h-16">
                {result.value}
              </div>
              <p className="text-xs text-muted-foreground">
                The result is sent back to the client as plain text after server-side homomorphic computation
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Processed Columns</h4>
              <div className="flex flex-wrap gap-2">
                {result.columns.map((col: string) => (
                  <Badge key={col} variant="secondary">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Database className="w-10 h-10 mb-2 opacity-50" />
            <p>Select a calculation type and process the dataset to see results</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
