// src/lib/use-performance-metrics.ts
import { useCallback } from 'react';
import performanceMetrics from './performance-metrics';

export function usePerformanceMetrics() {
    const trackOperation = useCallback((
        operationName: string,
        fn: (...args: any[]) => any,
        type: 'encryption' | 'decryption' | 'computation' | 'network' = 'computation',
        metadata?: Record<string, any>
    ) => {
        return async (...args: any[]) => {
            const inputSize = JSON.stringify(args).length;
            const id = performanceMetrics.startOperation(operationName, type, metadata, inputSize);

            try {
                const result = await fn(...args);
                const outputSize = JSON.stringify(result).length;
                performanceMetrics.endOperation(id, true, undefined, outputSize);
                return result;
            } catch (error) {
                performanceMetrics.endOperation(id, false, error as Error);
                throw error;
            }
        };
    }, []);

    return {
        trackOperation,
        getStats: performanceMetrics.getStatsByType.bind(performanceMetrics),
        compare: performanceMetrics.compareOperations.bind(performanceMetrics),
        runBenchmark: performanceMetrics.runBenchmark.bind(performanceMetrics),
        clearMetrics: performanceMetrics.clearMetrics.bind(performanceMetrics),
        exportMetrics: performanceMetrics.exportMetrics.bind(performanceMetrics)
    };
}