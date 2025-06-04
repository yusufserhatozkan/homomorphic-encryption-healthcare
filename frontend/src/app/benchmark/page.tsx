"use client"

import { useState, useEffect } from "react"
import { BarChart, LineChart } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PerformanceMetricsDisplay from "@/lib/performance-metrics-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface BenchmarkData {
  results: {
    bfv?: Array<{
      a: number
      error: number
      totalMs: number
    }>
    ckks?: Array<{
      a: number
      error: number
      totalMs: number
    }>
  }
}

export default function BenchmarkPage() {
  const [activeTab, setActiveTab] = useState("metrics")
  const [data, setData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch benchmark data
  useEffect(() => {
    fetch("http://localhost:18080/api/addition-benchmark")
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to fetch benchmark data")
        setLoading(false)
      })
  }, [])

  return (
    <main className="min-h-screen mt-20 p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Benchmark Analysis</h1>
          <p className="text-lg text-muted-foreground">
            Performance metrics and visualization of homomorphic encryption operations
          </p>
        </div>

        <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Performance Metrics
            </TabsTrigger>

            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Visualization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <PerformanceMetricsDisplay />
          </TabsContent>

          <TabsContent value="visualization">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : !data?.results ? (
              <div className="p-8 text-center">No data available.</div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Homomorphic Addition Benchmark Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-8">
                    <h3 className="font-semibold mb-2">BFV: Error vs Value</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsLineChart data={data.results.bfv?.map((item) => ({ a: item.a, error: item.error }))}>
                        <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="error" name="BFV Error" stroke="#8884d8" dot={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mb-8">
                    <h3 className="font-semibold mb-2">CKKS: Error vs Value</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsLineChart data={data.results.ckks?.map((item) => ({ a: item.a, error: item.error }))}>
                        <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="error" name="CKKS Error" stroke="#82ca9d" dot={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mb-8">
                    <h3 className="font-semibold mb-2">BFV: Total Time vs Value</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsLineChart data={data.results.bfv?.map((item) => ({ a: item.a, time: item.totalMs }))}>
                        <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="time" name="BFV Time (ms)" stroke="#8884d8" dot={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">CKKS: Total Time vs Value</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsLineChart data={data.results.ckks?.map((item) => ({ a: item.a, time: item.totalMs }))}>
                        <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="time" name="CKKS Time (ms)" stroke="#82ca9d" dot={false} />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 