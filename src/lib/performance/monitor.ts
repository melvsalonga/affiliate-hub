'use client'

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType,
            timestamp: Date.now()
          })
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navObserver)

      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('resource', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType,
            timestamp: Date.now()
          })
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('paint', {
            name: entry.name,
            duration: entry.startTime, // Paint entries use startTime as the metric
            startTime: entry.startTime,
            type: entry.entryType,
            timestamp: Date.now()
          })
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.set('paint', paintObserver)

      // Observe largest contentful paint
      if ('LargestContentfulPaint' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('lcp', {
              name: 'largest-contentful-paint',
              duration: entry.startTime,
              startTime: entry.startTime,
              type: entry.entryType,
              timestamp: Date.now()
            })
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.set('lcp', lcpObserver)
      }

      // Observe cumulative layout shift
      if ('LayoutShift' in window) {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              this.recordMetric('cls', {
                name: 'cumulative-layout-shift',
                duration: (entry as any).value,
                startTime: entry.startTime,
                type: entry.entryType,
                timestamp: Date.now()
              })
            }
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.set('cls', clsObserver)
      }
    }
  }

  recordMetric(category: string, metric: PerformanceMetric) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, [])
    }
    
    const categoryMetrics = this.metrics.get(category)!
    categoryMetrics.push(metric)
    
    // Keep only last 100 metrics per category
    if (categoryMetrics.length > 100) {
      categoryMetrics.splice(0, categoryMetrics.length - 100)
    }
  }

  getMetrics(category?: string): Map<string, PerformanceMetric[]> | PerformanceMetric[] {
    if (category) {
      return this.metrics.get(category) || []
    }
    return this.metrics
  }

  getWebVitals(): WebVitals {
    const navigation = this.metrics.get('navigation')?.[0]
    const paint = this.metrics.get('paint') || []
    const lcp = this.metrics.get('lcp')?.[0]
    const cls = this.metrics.get('cls') || []

    const fcp = paint.find(p => p.name === 'first-contentful-paint')
    const fp = paint.find(p => p.name === 'first-paint')

    // Calculate CLS score
    const clsScore = cls.reduce((sum, entry) => sum + entry.duration, 0)

    return {
      // Core Web Vitals
      lcp: lcp?.duration || 0,
      fid: 0, // Would need to be measured separately
      cls: clsScore,
      
      // Other important metrics
      fcp: fcp?.duration || 0,
      fp: fp?.duration || 0,
      ttfb: navigation?.startTime || 0,
      
      // Page load metrics
      domContentLoaded: navigation ? (navigation as any).domContentLoadedEventEnd - (navigation as any).domContentLoadedEventStart : 0,
      loadComplete: navigation?.duration || 0
    }
  }

  measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    
    this.recordMetric('function', {
      name,
      duration: endTime - startTime,
      startTime,
      type: 'function',
      timestamp: Date.now()
    })
    
    return result
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    
    this.recordMetric('async-function', {
      name,
      duration: endTime - startTime,
      startTime,
      type: 'async-function',
      timestamp: Date.now()
    })
    
    return result
  }

  startMark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`)
    }
  }

  endMark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = performance.getEntriesByName(name, 'measure')[0]
      if (measure) {
        this.recordMetric('measure', {
          name,
          duration: measure.duration,
          startTime: measure.startTime,
          type: 'measure',
          timestamp: Date.now()
        })
      }
    }
  }

  getPerformanceReport(): PerformanceReport {
    const webVitals = this.getWebVitals()
    const resourceMetrics = this.metrics.get('resource') || []
    const functionMetrics = this.metrics.get('function') || []
    
    // Analyze resource loading
    const slowResources = resourceMetrics
      .filter(r => r.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
    
    // Analyze function performance
    const slowFunctions = functionMetrics
      .filter(f => f.duration > 100)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
    
    return {
      webVitals,
      slowResources,
      slowFunctions,
      recommendations: this.generateRecommendations(webVitals, slowResources, slowFunctions)
    }
  }

  private generateRecommendations(
    webVitals: WebVitals,
    slowResources: PerformanceMetric[],
    slowFunctions: PerformanceMetric[]
  ): string[] {
    const recommendations: string[] = []
    
    if (webVitals.lcp > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Consider optimizing images and critical resources.')
    }
    
    if (webVitals.fcp > 1800) {
      recommendations.push('First Contentful Paint is slow. Consider reducing render-blocking resources.')
    }
    
    if (webVitals.cls > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Ensure proper sizing for images and ads.')
    }
    
    if (slowResources.length > 0) {
      recommendations.push(`${slowResources.length} slow resources detected. Consider optimizing or lazy loading.`)
    }
    
    if (slowFunctions.length > 0) {
      recommendations.push(`${slowFunctions.length} slow functions detected. Consider optimization or code splitting.`)
    }
    
    return recommendations
  }

  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      webVitals: this.getWebVitals(),
      metrics: Object.fromEntries(this.metrics)
    }
    
    return JSON.stringify(data, null, 2)
  }

  clearMetrics() {
    this.metrics.clear()
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Types
interface PerformanceMetric {
  name: string
  duration: number
  startTime: number
  type: string
  timestamp: number
}

interface WebVitals {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  fp: number  // First Paint
  ttfb: number // Time to First Byte
  domContentLoaded: number
  loadComplete: number
}

interface PerformanceReport {
  webVitals: WebVitals
  slowResources: PerformanceMetric[]
  slowFunctions: PerformanceMetric[]
  recommendations: string[]
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()
  
  const measureRender = (componentName: string) => {
    monitor.startMark(`render-${componentName}`)
    
    return () => {
      monitor.endMark(`render-${componentName}`)
    }
  }
  
  const measureEffect = (effectName: string, fn: () => void | Promise<void>) => {
    return monitor.measureAsyncFunction(effectName, async () => {
      await fn()
    })
  }
  
  return {
    measureRender,
    measureEffect,
    getMetrics: () => monitor.getMetrics(),
    getWebVitals: () => monitor.getWebVitals(),
    getReport: () => monitor.getPerformanceReport()
  }
}

import React from 'react'

// Performance monitoring HOC
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const monitor = PerformanceMonitor.getInstance()
    
    React.useEffect(() => {
      monitor.startMark(`mount-${componentName}`)
      
      return () => {
        monitor.endMark(`mount-${componentName}`)
      }
    }, [])
    
    const endRenderMark = React.useRef<(() => void) | null>(null)
    
    React.useLayoutEffect(() => {
      if (endRenderMark.current) {
        endRenderMark.current()
      }
    })
    
    endRenderMark.current = () => {
      monitor.endMark(`render-${componentName}`)
    }
    
    monitor.startMark(`render-${componentName}`)
    
    return React.createElement(Component, props)
  }
}