// src/lib/performance-metrics.ts

export interface OperationMetrics {
    operationName: string;
    operationType: 'encryption' | 'decryption' | 'computation' | 'network';
    startTime: number;
    endTime?: number;
    duration?: number;
    inputSize?: number;
    outputSize?: number;
    success: boolean;
    error?: Error;
    metadata?: Record<string, any>;
}

export interface BenchmarkResult {
    operationType: string;
    metrics: {
        averageLatency: number;
        maxLatency: number;
        minLatency: number;
        throughput: number;  // operations per second
        successRate: number;
        dataOverhead?: number;  // ratio of encrypted/plaintext size
        totalOperations: number;
        totalErrors: number;
    };
    rawData: OperationMetrics[];
}

class PerformanceMetrics {
    private operations: OperationMetrics[] = [];
    private activeOperations: Map<string, OperationMetrics> = new Map();
    private benchmarkResults: Record<string, BenchmarkResult> = {};

    // Start timing an operation
    startOperation(
        operationName: string,
        type: 'encryption' | 'decryption' | 'computation' | 'network',
        metadata?: Record<string, any>,
        inputSize?: number
    ): string {
        const id = `${operationName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const metrics: OperationMetrics = {
            operationName,
            operationType: type,
            startTime: performance.now(),
            success: false,
            inputSize,
            metadata
        };

        this.activeOperations.set(id, metrics);
        return id;
    }

    // End timing an operation and record results
    endOperation(id: string, success: boolean = true, error?: Error, outputSize?: number): OperationMetrics | null {
        const operation = this.activeOperations.get(id);

        if (!operation) {
            console.warn(`No active operation found with ID: ${id}`);
            return null;
        }

        operation.endTime = performance.now();
        operation.duration = operation.endTime - operation.startTime;
        operation.success = success;
        operation.error = error;
        operation.outputSize = outputSize;

        this.operations.push(operation);
        this.activeOperations.delete(id);

        return operation;
    }

    // Get statistics for a specific type of operation
    getStatsByType(operationType: string): BenchmarkResult | null {
        const filteredOps = this.operations.filter(
            op => op.operationName === operationType && op.success
        );

        if (filteredOps.length === 0) {
            return null;
        }

        const durations = filteredOps.map(op => op.duration || 0);
        const totalOps = this.operations.filter(op => op.operationName === operationType).length;
        const errors = this.operations.filter(
            op => op.operationName === operationType && !op.success
        ).length;

        // Calculate data overhead if size info is available
        const dataOverheadMetrics = filteredOps.filter(
            op => op.inputSize !== undefined && op.outputSize !== undefined
        );

        let dataOverhead;
        if (dataOverheadMetrics.length > 0) {
            dataOverhead = dataOverheadMetrics.reduce((sum, op) =>
                sum + ((op.outputSize || 0) / (op.inputSize || 1)), 0) / dataOverheadMetrics.length;
        }

        const result: BenchmarkResult = {
            operationType,
            metrics: {
                averageLatency: durations.reduce((sum, val) => sum + val, 0) / durations.length,
                maxLatency: Math.max(...durations),
                minLatency: Math.min(...durations),
                throughput: 1000 / (durations.reduce((sum, val) => sum + val, 0) / durations.length),
                successRate: filteredOps.length / totalOps,
                totalOperations: totalOps,
                totalErrors: errors,
                dataOverhead
            },
            rawData: filteredOps
        };

        this.benchmarkResults[operationType] = result;
        return result;
    }

    // Compare two operation types
    compareOperations(type1: string, type2: string): {
        latencyDiff: number,
        throughputRatio: number,
        overheadRatio?: number
    } | null {
        const stats1 = this.benchmarkResults[type1] || this.getStatsByType(type1);
        const stats2 = this.benchmarkResults[type2] || this.getStatsByType(type2);

        if (!stats1 || !stats2) {
            return null;
        }

        return {
            latencyDiff: stats1.metrics.averageLatency - stats2.metrics.averageLatency,
            throughputRatio: stats1.metrics.throughput / stats2.metrics.throughput,
            overheadRatio: stats1.metrics.dataOverhead && stats2.metrics.dataOverhead ?
                stats1.metrics.dataOverhead / stats2.metrics.dataOverhead : undefined
        };
    }

    // Run a benchmark for homomorphic vs plaintext operations
    async runBenchmark(
        operation: string,
        homomorphicFn: (input: any) => Promise<any>,
        plaintextFn: (input: any) => any,
        testInputs: any[],
        iterations: number = 10
    ): Promise<{ homomorphic: BenchmarkResult, plaintext: BenchmarkResult, comparison: any }> {
        // Reset previous data for this benchmark
        this.operations = this.operations.filter(
            op => op.operationName !== `${operation}_homomorphic` &&
                op.operationName !== `${operation}_plaintext`
        );

        // Run plaintext operations
        for (let i = 0; i < iterations; i++) {
            for (const input of testInputs) {
                const id = this.startOperation(
                    `${operation}_plaintext`,
                    'computation',
                    { iteration: i },
                    typeof input === 'string' ? input.length : JSON.stringify(input).length
                );

                try {
                    const result = plaintextFn(input);
                    const resultSize = typeof result === 'string' ?
                        result.length : JSON.stringify(result).length;
                    this.endOperation(id, true, undefined, resultSize);
                } catch (err) {
                    this.endOperation(id, false, err as Error);
                }
            }
        }

        // Run homomorphic operations
        for (let i = 0; i < iterations; i++) {
            for (const input of testInputs) {
                const id = this.startOperation(
                    `${operation}_homomorphic`,
                    'computation',
                    { iteration: i },
                    typeof input === 'string' ? input.length : JSON.stringify(input).length
                );

                try {
                    const result = await homomorphicFn(input);
                    const resultSize = typeof result === 'string' ?
                        result.length : JSON.stringify(result).length;
                    this.endOperation(id, true, undefined, resultSize);
                } catch (err) {
                    this.endOperation(id, false, err as Error);
                }
            }
        }

        const homomorphicStats = this.getStatsByType(`${operation}_homomorphic`);
        const plaintextStats = this.getStatsByType(`${operation}_plaintext`);
        const comparison = this.compareOperations(`${operation}_homomorphic`, `${operation}_plaintext`);

        return {
            homomorphic: homomorphicStats!,
            plaintext: plaintextStats!,
            comparison
        };
    }

    // Clear all metrics
    clearMetrics() {
        this.operations = [];
        this.activeOperations.clear();
        this.benchmarkResults = {};
    }

    // Export metrics data for analysis
    exportMetrics(): any {
        return {
            operations: this.operations,
            benchmarks: this.benchmarkResults
        };
    }
}

// Export a singleton instance
const performanceMetrics = new PerformanceMetrics();
export default performanceMetrics;