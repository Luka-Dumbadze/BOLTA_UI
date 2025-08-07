// hooks/usePerformanceMonitor.ts
// Performance monitoring hook for optimizing app performance

import { useEffect, useRef, useCallback } from 'react';
import { FEATURE_FLAGS, DEV_CONFIG } from '../constants/Config';
import { logger } from '../utils';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
  props?: any;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  logRenders?: boolean;
  logProps?: boolean;
  threshold?: number; // Log only if render time exceeds threshold (ms)
}

/**
 * Custom hook for monitoring component performance
 * Tracks render times and provides insights for optimization
 */
export function usePerformanceMonitor({
  componentName,
  logRenders = DEV_CONFIG.ENABLE_CONSOLE_LOGS,
  logProps = false,
  threshold = 16, // 16ms = 60fps threshold
}: UsePerformanceMonitorOptions) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);
  const lastProps = useRef<any>(null);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING) return;
    renderStartTime.current = performance.now();
  }, []);

  // End performance measurement and log results
  const endMeasurement = useCallback((props?: any) => {
    if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current++;
    totalRenderTime.current += renderTime;

    const metrics: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now(),
      ...(logProps && props && { props }),
    };

    // Log if render time exceeds threshold or if logging is enabled
    if (renderTime > threshold || (logRenders && DEV_CONFIG.ENABLE_CONSOLE_LOGS)) {
      logger.debug(`🔍 Performance: ${componentName}`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: renderCount.current,
        avgRenderTime: `${(totalRenderTime.current / renderCount.current).toFixed(2)}ms`,
        ...(renderTime > threshold && { warning: 'Slow render detected!' }),
        ...(logProps && props && { props }),
      });
    }

    // Store performance data for analytics (if enabled)
    if (FEATURE_FLAGS.ENABLE_ANALYTICS) {
      // Could send to analytics service here
      // analytics.track('component_render', metrics);
    }
  }, [componentName, logRenders, logProps, threshold]);

  // Check for unnecessary re-renders
  const checkUnnecessaryRenders = useCallback((props: any) => {
    if (!DEV_CONFIG.ENABLE_CONSOLE_LOGS) return;

    if (lastProps.current && JSON.stringify(lastProps.current) === JSON.stringify(props)) {
      logger.warn(`⚠️ Unnecessary render detected in ${componentName}`, {
        renderCount: renderCount.current,
        props: logProps ? props : 'Props logging disabled',
      });
    }
    lastProps.current = props;
  }, [componentName, logProps]);

  // Get performance statistics
  const getStats = useCallback(() => ({
    componentName,
    renderCount: renderCount.current,
    totalRenderTime: totalRenderTime.current,
    averageRenderTime: renderCount.current > 0 
      ? totalRenderTime.current / renderCount.current 
      : 0,
  }), [componentName]);

  // Reset statistics
  const resetStats = useCallback(() => {
    renderCount.current = 0;
    totalRenderTime.current = 0;
    lastProps.current = null;
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    checkUnnecessaryRenders,
    getStats,
    resetStats,
  };
}

/**
 * Hook for monitoring async operations performance
 */
export function useAsyncPerformanceMonitor() {
  const activeOperations = useRef<Map<string, number>>(new Map());

  const startOperation = useCallback((operationId: string, operationName?: string) => {
    if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING) return;
    
    activeOperations.current.set(operationId, performance.now());
    
    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      logger.debug(`⏱️ Started: ${operationName || operationId}`);
    }
  }, []);

  const endOperation = useCallback((operationId: string, operationName?: string, context?: any) => {
    if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING) return;

    const startTime = activeOperations.current.get(operationId);
    if (!startTime) {
      logger.warn(`No start time found for operation: ${operationId}`);
      return;
    }

    const duration = performance.now() - startTime;
    activeOperations.current.delete(operationId);

    if (DEV_CONFIG.ENABLE_CONSOLE_LOGS) {
      logger.debug(`✅ Completed: ${operationName || operationId}`, {
        duration: `${duration.toFixed(2)}ms`,
        ...(context && { context }),
      });
    }

    // Track slow operations
    if (duration > 1000) { // Operations taking more than 1 second
      logger.warn(`🐌 Slow operation detected: ${operationName || operationId}`, {
        duration: `${duration.toFixed(2)}ms`,
        ...(context && { context }),
      });
    }

    return duration;
  }, []);

  const getActiveOperations = useCallback(() => {
    return Array.from(activeOperations.current.entries()).map(([id, startTime]) => ({
      operationId: id,
      duration: performance.now() - startTime,
    }));
  }, []);

  return {
    startOperation,
    endOperation,
    getActiveOperations,
  };
}

/**
 * Hook for monitoring memory usage (where supported)
 */
export function useMemoryMonitor() {
  const logMemoryUsage = useCallback((label?: string) => {
    if (!FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING || !DEV_CONFIG.ENABLE_CONSOLE_LOGS) return;

    // Check if performance.memory is available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      logger.debug(`💾 Memory usage${label ? ` - ${label}` : ''}`, {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    } else {
      logger.debug('Memory monitoring not supported in this environment');
    }
  }, []);

  const checkMemoryPressure = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usageRatio > 0.8) {
        logger.warn('🚨 High memory usage detected', {
          usage: `${(usageRatio * 100).toFixed(1)}%`,
          used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
          limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
        });
        return true;
      }
    }
    return false;
  }, []);

  return {
    logMemoryUsage,
    checkMemoryPressure,
  };
}