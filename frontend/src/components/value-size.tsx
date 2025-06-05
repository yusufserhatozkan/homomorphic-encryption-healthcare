"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { API_BASE_URL } from "@/config/api"

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

interface ValueSizeProps {
  setError: (error: string | null) => void
}

export function ValueSize({ setError }: ValueSizeProps) {
  const [data, setData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(false)
  const [maxNumber, setMaxNumber] = useState("500000")
  const [stepSize, setStepSize] = useState("500")

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/benchmark/value-size?max=${maxNumber}&step=${stepSize}`)
      if (!response.ok) {
        throw new Error('Failed to fetch benchmark data')
      }
      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Value Size Analysis</CardTitle>
          <CardDescription>Configure and run benchmark analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="maxNumber">Max Number</Label>
              <Input
                id="maxNumber"
                type="number"
                value={maxNumber}
                onChange={(e) => setMaxNumber(e.target.value)}
                placeholder="Enter maximum number"
                disabled={loading}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="stepSize">Step Size</Label>
              <Input
                id="stepSize"
                type="number"
                value={stepSize}
                onChange={(e) => setStepSize(e.target.value)}
                placeholder="Enter step size"
                disabled={loading}
              />
            </div>
            <Button onClick={fetchData} disabled={loading} className="h-10">
              {loading ? "Loading..." : "Fetch Benchmark Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data?.results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>BFV Error Analysis</CardTitle>
              <CardDescription>Error rate vs input value size for BFV scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={data.results.bfv?.map((item) => ({ a: item.a, error: item.error }))}>
                    <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="error" name="BFV Error" stroke="#8884d8" dot={false} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CKKS Error Analysis</CardTitle>
              <CardDescription>Error rate vs input value size for CKKS scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={data.results.ckks?.map((item) => ({ a: item.a, error: item.error }))}>
                    <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="error" name="CKKS Error" stroke="#82ca9d" dot={false} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>BFV Performance</CardTitle>
              <CardDescription>Computation time vs input value size for BFV scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={data.results.bfv?.map((item) => ({ a: item.a, time: item.totalMs }))}>
                    <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="time" name="BFV Time (ms)" stroke="#8884d8" dot={false} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CKKS Performance</CardTitle>
              <CardDescription>Computation time vs input value size for CKKS scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
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
        </>
      )}
    </div>
  )
}
