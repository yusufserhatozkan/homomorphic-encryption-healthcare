"use client"

import { useState, useEffect } from "react"
import { BarChart, Clock, Activity, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSeal } from "@/lib/homomorphic-service"
import performanceMetrics from "@/lib/performance-metrics"
import { Button } from "@/components/ui/button"

export default function PerformanceMetricsDisplay() {
    const [activeTab, setActiveTab] = useState("summary")
    const [metrics, setMetrics] = useState<any>(null)
    const [refreshKey, setRefreshKey] = useState(0)
    const { runAdditionBenchmark } = useSeal()

    // Refresh metrics data whenever an operation completes or on component mount
    useEffect(() => {
        const metricsData = performanceMetrics.exportMetrics()
        setMetrics(metricsData)

        // Set up a periodic refresh
        const interval = setInterval(() => {
            setMetrics(performanceMetrics.exportMetrics())
        }, 1000)

        return () => clearInterval(interval)
    }, [refreshKey])

    // Force refresh the metrics
    const refreshMetrics = () => {
        setRefreshKey(prev => prev + 1)
    }

    // Run benchmark test
    const handleRunBenchmark = async () => {
        try {
            await runAdditionBenchmark(5)
            refreshMetrics()
        } catch (err) {
            console.error("Benchmark failed:", err)
        }
    }

    // Calculate summary statistics
    const getOperationStats = () => {
        if (!metrics || !metrics.operations || metrics.operations.length === 0) {
            return {
                totalOperations: 0,
                encryptionOps: 0,
                decryptionOps: 0,
                computationOps: 0,
                averageLatency: 0
            }
        }

        const operations = metrics.operations
        const encryptionOps = operations.filter((op: any) => op.operationType === 'encryption').length
        const decryptionOps = operations.filter((op: any) => op.operationType === 'decryption').length
        const computationOps = operations.filter((op: any) => op.operationType === 'computation').length

        const successfulOps = operations.filter((op: any) => op.success && op.duration)
        const totalLatency = successfulOps.reduce((sum: number, op: any) => sum + op.duration, 0)
        const averageLatency = successfulOps.length > 0 ? totalLatency / successfulOps.length : 0

        return {
            totalOperations: operations.length,
            encryptionOps,
            decryptionOps,
            computationOps,
            averageLatency: averageLatency.toFixed(2)
        }
    }

    const stats = getOperationStats()

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="w-5 h-5" />
                        Performance Metrics
                    </CardTitle>
                    <CardDescription>
                        Statistics on homomorphic encryption operations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="operations">Operations</TabsTrigger>
                            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary" className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard
                                    icon={<Activity className="w-4 h-4" />}
                                    title="Total Operations"
                                    value={stats.totalOperations}
                                />
                                <StatCard
                                    icon={<Clock className="w-4 h-4" />}
                                    title="Avg. Latency"
                                    value={`${stats.averageLatency} ms`}
                                />
                                <StatCard
                                    icon={<Database className="w-4 h-4" />}
                                    title="Encryption Ops"
                                    value={stats.encryptionOps}
                                />
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-medium mb-2">Operation Breakdown</h3>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="p-2 border rounded-md text-center">
                                        <div className="font-medium">Encryption</div>
                                        <div className="text-2xl mt-2">{stats.encryptionOps}</div>
                                    </div>
                                    <div className="p-2 border rounded-md text-center">
                                        <div className="font-medium">Decryption</div>
                                        <div className="text-2xl mt-2">{stats.decryptionOps}</div>
                                    </div>
                                    <div className="p-2 border rounded-md text-center">
                                        <div className="font-medium">Computation</div>
                                        <div className="text-2xl mt-2">{stats.computationOps}</div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="operations" className="mt-4">
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Operation</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Duration (ms)</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {metrics?.operations?.slice().reverse().slice(0, 10).map((op: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{op.operationName}</TableCell>
                                                <TableCell>{op.operationType}</TableCell>
                                                <TableCell>{op.duration?.toFixed(2) || 'N/A'}</TableCell>
                                                <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${op.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {op.success ? 'Success' : 'Failed'}
                          </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!metrics?.operations || metrics.operations.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                                    No operations recorded yet. Try adding two numbers.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button variant="outline" size="sm" onClick={refreshMetrics}>
                                    Refresh Data
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="benchmark" className="mt-4">
                            <div className="space-y-4">
                                <div className="p-4 border rounded-md">
                                    <h3 className="text-sm font-medium mb-2">Run Benchmark</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Compare homomorphic encryption with plain text operations
                                    </p>
                                    <Button onClick={handleRunBenchmark}>
                                        Run Addition Benchmark
                                    </Button>
                                </div>

                                {metrics?.benchmarks && Object.keys(metrics.benchmarks).length > 0 ? (
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Operation</TableHead>
                                                    <TableHead>Avg. Latency</TableHead>
                                                    <TableHead>Throughput</TableHead>
                                                    <TableHead>Success Rate</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Object.entries(metrics.benchmarks).map(([key, value]: [string, any]) => (
                                                    <TableRow key={key}>
                                                        <TableCell className="font-medium">{key}</TableCell>
                                                        <TableCell>{value.metrics.averageLatency.toFixed(2)} ms</TableCell>
                                                        <TableCell>{value.metrics.throughput.toFixed(2)} ops/s</TableCell>
                                                        <TableCell>
                                                            {(value.metrics.successRate * 100).toFixed(1)}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center p-8 border rounded-md text-muted-foreground">
                                        No benchmark data available. Click "Run Addition Benchmark" to start.
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) {
    return (
        <div className="p-4 border rounded-md flex flex-col items-center text-center space-y-2">
            <div className="p-2 rounded-full bg-muted">{icon}</div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-2xl">{value}</p>
        </div>
    )
}