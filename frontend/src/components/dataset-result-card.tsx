"use client"

import { Unlock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface DatasetResult {
  type: string;
  value: number;
  column: string;
}

interface DatasetResultCardProps {
  result: DatasetResult | null;
}

export default function DatasetResultCard({ result }: DatasetResultCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>The decrypted result of the homomorphic operation</CardDescription>
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
                The result is decrypted on the client side after server-side homomorphic computation
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Processed Column</h4>
              <Badge variant="secondary">{result.column}</Badge>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Unlock className="w-10 h-10 mb-2 opacity-50" />
            <p>Upload a dataset and perform a calculation to see results</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium">Process Flow</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 border rounded-md">
              <div className="font-medium mb-1">Encrypt</div>
              <div className="text-muted-foreground">Client-side</div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="font-medium mb-1">Compute</div>
              <div className="text-muted-foreground">Server-side</div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="font-medium mb-1">Decrypt</div>
              <div className="text-muted-foreground">Client-side</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
