import { useState, useCallback } from 'react'
// Using a simple toast implementation for now
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
  warning: (message: string) => console.warn('⚠️', message),
}

export interface ProcessLinkOptions {
  url: string
  productId?: string
  extractProductInfo?: boolean
  validateLink?: boolean
  createShortUrl?: boolean
  customDomain?: string
  autoCreateProduct?: boolean
  categoryId?: string
}

export interface LinkProcessingResult {
  originalUrl: string
  platformDetection: {
    platform: string
    productId?: string
    isAffiliate: boolean
    confidence: number
  }
  validation?: {
    isValid: boolean
    status: number
    redirectUrl?: string
    error?: string
    responseTime: number
  }
  productInfo?: {
    title?: string
    description?: string
    price?: {
      current: number
      original?: number
      currency: string
    }
    images?: string[]
    rating?: number
    reviewCount?: number
    availability?: string
    brand?: string
    category?: string
  }
  shortenedUrl?: string
  platform?: any
  product?: any
  affiliateLink?: any
}

export interface HealthCheckResult {
  linkId: string
  isHealthy: boolean
  lastChecked: string
  status: number
  responseTime: number
  error?: string
}

export interface LinkRotationConfig {
  productId: string
  strategy: 'round_robin' | 'weighted' | 'performance_based' | 'random'
  weights?: Record<string, number>
  testDuration?: number
  trafficSplit?: number
}

export function useLinkManagement() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isHealthChecking, setIsHealthChecking] = useState(false)
  const [isSettingUpRotation, setIsSettingUpRotation] = useState(false)

  const processLink = useCallback(async (options: ProcessLinkOptions): Promise<LinkProcessingResult | null> => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/links/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to process link')
        return null
      }

      toast.success('Link processed successfully!')
      return result.data
    } catch (error) {
      console.error('Link processing error:', error)
      toast.error('Failed to process link')
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const analyzeUrl = useCallback(async (url: string) => {
    try {
      const response = await fetch(`/api/links/process?url=${encodeURIComponent(url)}`)
      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to analyze URL')
        return null
      }

      return result.data
    } catch (error) {
      console.error('URL analysis error:', error)
      toast.error('Failed to analyze URL')
      return null
    }
  }, [])

  const shortenUrl = useCallback(async (options: {
    url: string
    customDomain?: string
    customSlug?: string
    linkId?: string
  }) => {
    try {
      const response = await fetch('/api/links/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to shorten URL')
        return null
      }

      toast.success('URL shortened successfully!')
      return result.data
    } catch (error) {
      console.error('URL shortening error:', error)
      toast.error('Failed to shorten URL')
      return null
    }
  }, [])

  const checkSlugAvailability = useCallback(async (slug: string, domain?: string) => {
    try {
      const params = new URLSearchParams({ slug })
      if (domain) params.append('domain', domain)

      const response = await fetch(`/api/links/shorten?${params}`)
      const result = await response.json()

      if (!result.success) {
        return { available: false, error: result.error }
      }

      return result.data
    } catch (error) {
      console.error('Slug validation error:', error)
      return { available: false, error: 'Failed to check availability' }
    }
  }, [])

  const performHealthCheck = useCallback(async (options: {
    linkIds?: string[]
    productId?: string
    platformId?: string
    batchSize?: number
  }): Promise<HealthCheckResult[] | null> => {
    setIsHealthChecking(true)
    
    try {
      const response = await fetch('/api/links/health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Health check failed')
        return null
      }

      const { summary, results } = result.data
      
      if (summary.unhealthy > 0) {
        toast.warning(`Health check completed: ${summary.unhealthy} unhealthy links found`)
      } else {
        toast.success(`Health check completed: All ${summary.healthy} links are healthy`)
      }

      return results
    } catch (error) {
      console.error('Health check error:', error)
      toast.error('Failed to perform health check')
      return null
    } finally {
      setIsHealthChecking(false)
    }
  }, [])

  const batchHealthCheck = useCallback(async (batchSize?: number) => {
    setIsHealthChecking(true)
    
    try {
      const params = batchSize ? `?batchSize=${batchSize}` : ''
      const response = await fetch(`/api/links/health-check${params}`)
      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Batch health check failed')
        return false
      }

      toast.success('Batch health check completed successfully')
      return true
    } catch (error) {
      console.error('Batch health check error:', error)
      toast.error('Failed to perform batch health check')
      return false
    } finally {
      setIsHealthChecking(false)
    }
  }, [])

  const setupLinkRotation = useCallback(async (config: LinkRotationConfig) => {
    setIsSettingUpRotation(true)
    
    try {
      const response = await fetch('/api/links/rotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to setup link rotation')
        return null
      }

      toast.success('Link rotation configured successfully!')
      return result.data
    } catch (error) {
      console.error('Link rotation setup error:', error)
      toast.error('Failed to setup link rotation')
      return null
    } finally {
      setIsSettingUpRotation(false)
    }
  }, [])

  const getRotationConfig = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/links/rotation?productId=${productId}`)
      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to get rotation configuration')
        return null
      }

      return result.data
    } catch (error) {
      console.error('Get rotation config error:', error)
      toast.error('Failed to get rotation configuration')
      return null
    }
  }, [])

  const bulkProcessLinks = useCallback(async (options: {
    urls: string[]
    extractProductInfo?: boolean
    validateLink?: boolean
    createShortUrl?: boolean
    customDomain?: string
    batchSize?: number
    autoCreateProduct?: boolean
    categoryId?: string
  }) => {
    try {
      const response = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process',
          urls: options.urls,
          options: {
            extractProductInfo: options.extractProductInfo,
            validateLink: options.validateLink,
            createShortUrl: options.createShortUrl,
            customDomain: options.customDomain,
            batchSize: options.batchSize,
            autoCreateProduct: options.autoCreateProduct,
            categoryId: options.categoryId,
          }
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Bulk processing failed')
        return null
      }

      toast.success(`Processed ${result.data.summary.successful} of ${result.data.summary.total} links`)
      return result.data
    } catch (error) {
      console.error('Bulk processing error:', error)
      toast.error('Failed to process links in bulk')
      return null
    }
  }, [])

  const generatePerformanceReport = useCallback(async (options: {
    linkIds: string[]
    startDate: string
    endDate: string
  }) => {
    try {
      const response = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'report',
          linkIds: options.linkIds,
          dateRange: {
            startDate: options.startDate,
            endDate: options.endDate
          }
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Report generation failed')
        return null
      }

      toast.success('Performance report generated successfully')
      return result.data
    } catch (error) {
      console.error('Report generation error:', error)
      toast.error('Failed to generate performance report')
      return null
    }
  }, [])

  const replaceLinksInContent = useCallback(async (options: {
    content: string
    replacementMap?: Record<string, string>
    createShortUrls?: boolean
    customDomain?: string
    onlyAffiliateLinks?: boolean
  }) => {
    try {
      const response = await fetch('/api/links/replace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: options.content,
          replacementMap: options.replacementMap,
          options: {
            createShortUrls: options.createShortUrls,
            customDomain: options.customDomain,
            onlyAffiliateLinks: options.onlyAffiliateLinks
          }
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Link replacement failed')
        return null
      }

      toast.success(`Replaced ${result.data.stats.replacedCount} links in content`)
      return result.data
    } catch (error) {
      console.error('Link replacement error:', error)
      toast.error('Failed to replace links in content')
      return null
    }
  }, [])

  return {
    // State
    isProcessing,
    isHealthChecking,
    isSettingUpRotation,

    // Methods
    processLink,
    analyzeUrl,
    shortenUrl,
    checkSlugAvailability,
    performHealthCheck,
    batchHealthCheck,
    setupLinkRotation,
    getRotationConfig,
    bulkProcessLinks,
    generatePerformanceReport,
    replaceLinksInContent,
  }
}