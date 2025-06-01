"use client"

import { useState } from "react"
import { Calculator, Database, BarChart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import SimpleAddition from "@/components/simple-addition"
import DatasetAnalysis from "@/components/dataset-analysis"
import AboutSection from "@/components/about-section"
import PerformanceMetricsDisplay from "@/lib/performance-metrics-display";

export default function Home() {
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("addition")

  return (
    <main className="min-h-screen mt-20 p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Homomorphic Encryption Demo</h1>
          <p className="text-lg text-muted-foreground">
            Perform calculations on encrypted data without revealing the underlying values
          </p>
        </div>

        <Tabs defaultValue="addition" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="addition" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Simple Addition
            </TabsTrigger>

            <TabsTrigger value="dataset" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Dataset Analysis
            </TabsTrigger>

            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Performance Metrics
            </TabsTrigger>
          </TabsList>

          <AboutSection activeTab={activeTab} />

          <TabsContent value="addition">
            <SimpleAddition setError={setError} />
          </TabsContent>

          <TabsContent value="dataset">
            <DatasetAnalysis setError={setError} />
          </TabsContent>

          <TabsContent value="metrics">
            <PerformanceMetricsDisplay />
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
