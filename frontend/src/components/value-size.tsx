import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
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

export function ValueSize() {
  const [data, setData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = () => {
    setLoading(true)
    setError(null)
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
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={handleFetch}>Retry Fetch</Button>
      </div>
    )
  }

  if (!data?.results) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">No data available.</div>
        <Button onClick={handleFetch}>Fetch Benchmark Data</Button>
      </div>
    )
  }

  return (
    <>
      <Button className="mb-6" onClick={handleFetch} disabled={loading}>
        Refresh Data
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
      </div>
    </>
  )
}
