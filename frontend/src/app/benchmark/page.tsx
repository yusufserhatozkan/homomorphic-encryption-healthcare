"use client"

import { useState } from "react"
import { BarChart, LineChart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ValueSize } from "@/components/value-size"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PerformanceMetrics } from "@/components/performance-metrics-display"
import { SchemeParameters } from "@/components/scheme-parameters"

export default function BenchmarkPage() {
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("metrics")

  return (
    <main className="flex-1 mt-10 p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Benchmark Analysis</h1>
          <p className="text-lg text-muted-foreground">
            Performance metrics and visualization of homomorphic encryption operations
          </p>
        </div>

        <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab} className="w-full gap-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Performance Metrics
            </TabsTrigger>

            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Value Size
            </TabsTrigger>

            <TabsTrigger value="parameters" className="flex items-center gap-2">
              Scheme Parameters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <PerformanceMetrics setError={setError} />
          </TabsContent>

          <TabsContent value="visualization">
            <ValueSize setError={setError} />
          </TabsContent>

          <TabsContent value="parameters">
            <SchemeParameters />
          </TabsContent>
        </Tabs>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  )
} 
