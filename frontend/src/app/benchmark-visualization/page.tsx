"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function BenchmarkVisualizationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:18080/api/addition-benchmark")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch benchmark data");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data?.results) return <div className="p-8 text-center">No data available.</div>;

  // Prepare chart data (example: plot error vs a for BFV and CKKS)
  const bfv = data.results.bfv || [];
  const ckks = data.results.ckks || [];
  const chartData = bfv.map((item: any, i: number) => ({
    a: item.a,
    b: item.b,
    error_bfv: item.error,
    error_ckks: ckks[i] ? ckks[i].error : null,
    time_bfv: item.totalMs,
    time_ckks: ckks[i] ? ckks[i].totalMs : null,
  }));

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Homomorphic Addition Benchmark Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <h3 className="font-semibold mb-2">BFV: Error vs Value</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bfv.map((item: any) => ({ a: item.a, error: item.error }))}>
                <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="error" name="BFV Error" stroke="#8884d8" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mb-8">
            <h3 className="font-semibold mb-2">CKKS: Error vs Value</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ckks.map((item: any) => ({ a: item.a, error: item.error }))}>
                <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="error" name="CKKS Error" stroke="#82ca9d" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mb-8">
            <h3 className="font-semibold mb-2">BFV: Total Time vs Value</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={bfv.map((item: any) => ({ a: item.a, time: item.totalMs }))}>
                <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="time" name="BFV Time (ms)" stroke="#8884d8" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="font-semibold mb-2">CKKS: Total Time vs Value</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ckks.map((item: any) => ({ a: item.a, time: item.totalMs }))}>
                <XAxis dataKey="a" tickFormatter={(v) => v.toLocaleString()} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="time" name="CKKS Time (ms)" stroke="#82ca9d" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
