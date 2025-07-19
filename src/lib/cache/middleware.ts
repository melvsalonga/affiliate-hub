import { NextRequest, NextResponse } from 'next/server'
import { cache, cacheTTL } from './redis'
import { memoryCache } from './utils'

export interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: NextRequest) => string
  skipCache?: (req: NextRequest) => boolean
  varyBy?: string[] // Headers to vary cache by
}

// Default cache key generator
function defaultKeyGenerator(req: NextRequest): string {
  const url = new URL(req.url)
  const method = req.method
  const pathname = url.pathname
  const searchParams = url.searchParams.toString()
  
  return `api:${method}:${pathname}${searchParams ? `:${searchParams}` : ''}`
}

// Cache middleware for API routes
export function withApiCache(options: CacheOptions = {}) {
  const {
    ttl = cacheTTL.medium,
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
    varyBy = []
  } = options

  return function cacheMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(req: NextRequest): Promise<NextResponse> {
      // Skip cache for non-GET requests or when skipCache returns true
      if (req.method !== 'GET' || skipCache(req)) {
        return handler(req)
      }

      // Generate cache key
      let cacheKey = keyGenerator(req)
      
      // Add vary headers to cache key
      if (varyBy.length > 0) {
        const varyValues = varyBy.map(header => req.headers.get(header) || '').join(':')
        cacheKey += `:vary:${varyValues}`
      }

      try {
        // Try to get from Redis cache first
        let cachedResponse = await cache.get(cacheKey)
        
        // Fallback to memory cache if Redis is unavailable
        if (!cachedResponse) {
          cachedResponse = memoryCache.get(cacheKey)
        }

        if (cachedResponse) {
          const parsed = JSON.parse(cachedResponse)
          const response = new NextResponse(parsed.body, {
            status: parsed.status,
            headers: {
              ...parsed.headers,
              'X-Cache': 'HIT',
              'X-Cache-Key': cacheKey
            }
          })
          return response
        }
      } catch (error) {
        console.warn('Cache retrieval error:', error)
      }

      // Execute the handler
      const response = await handler(req)
      
      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        try {
          // Clone response to read body
          const responseClone = response.clone()
          const body = await responseClone.text()
          
          const cacheData = {
            body,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }

          const serialized = JSON.stringify(cacheData)
          
          // Store in Redis cache
          await cache.set(cacheKey, serialized, { ex: ttl })
          
          // Also store in memory cache as fallback
          memoryCache.set(cacheKey, serialized, ttl)
          
          // Add cache headers to response
          response.headers.set('X-Cache', 'MISS')
          response.headers.set('X-Cache-Key', cacheKey)
          response.headers.set('Cache-Control', `public, max-age=${ttl}`)
          
        } catch (error) {
          console.warn('Cache storage error:', error)
        }
      }

      return response
    }
  }
}

// Specific cache configurations for different API endpoints
export const apiCacheConfigs = {
  // Product listings - cache for 30 minutes
  products: {
    ttl: cacheTTL.medium,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const page = url.searchParams.get('page') || '1'
      const limit = url.searchParams.get('limit') || '20'
      const category = url.searchParams.get('category') || ''
      const search = url.searchParams.get('search') || ''
      const sort = url.searchParams.get('sort') || ''
      
      return `api:products:${page}:${limit}:${category}:${search}:${sort}`
    }
  },

  // Individual products - cache for 1 hour
  product: {
    ttl: cacheTTL.long,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const id = url.pathname.split('/').pop()
      return `api:product:${id}`
    }
  },

  // Categories - cache for 1 day
  categories: {
    ttl: cacheTTL.day,
    keyGenerator: () => 'api:categories:all'
  },

  // Tags - cache for 1 day
  tags: {
    ttl: cacheTTL.day,
    keyGenerator: () => 'api:tags:all'
  },

  // Analytics - cache for 5 minutes (more dynamic data)
  analytics: {
    ttl: cacheTTL.short,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const linkId = url.searchParams.get('linkId') || ''
      const period = url.searchParams.get('period') || 'day'
      const from = url.searchParams.get('from') || ''
      const to = url.searchParams.get('to') || ''
      
      return `api:analytics:${linkId}:${period}:${from}:${to}`
    }
  },

  // Search results - cache for 15 minutes
  search: {
    ttl: 900, // 15 minutes
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const query = url.searchParams.get('q') || ''
      const page = url.searchParams.get('page') || '1'
      const filters = url.searchParams.get('filters') || ''
      
      return `api:search:${query}:${page}:${filters}`
    }
  },

  // SEO data - cache for 1 hour
  seo: {
    ttl: cacheTTL.long,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url)
      const slug = url.pathname.split('/').pop()
      return `api:seo:${slug}`
    }
  }
}

// Cache invalidation middleware
export function withCacheInvalidation(
  handler: (req: NextRequest) => Promise<NextResponse>,
  invalidationPatterns: string[]
) {
  return async function invalidatingHandler(req: NextRequest): Promise<NextResponse> {
    const response = await handler(req)
    
    // Only invalidate on successful mutations
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      response.status >= 200 && 
      response.status < 300
    ) {
      try {
        // Invalidate cache patterns
        for (const pattern of invalidationPatterns) {
          const keys = await cache.keys(pattern)
          if (keys.length > 0) {
            await Promise.all(keys.map(key => cache.del(key)))
          }
        }
      } catch (error) {
        console.warn('Cache invalidation error:', error)
      }
    }
    
    return response
  }
}