import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

// Upstash Redis client for production
const upstashClient = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Local Redis client for development
let localClient: ReturnType<typeof createClient> | null = null

if (process.env.NODE_ENV === 'development' && process.env.REDIS_URL) {
  localClient = createClient({
    url: process.env.REDIS_URL,
  })
  
  localClient.on('error', (err) => {
    console.warn('Redis Client Error (development):', err)
  })
  
  // Connect in development
  localClient.connect().catch(console.warn)
}

// Cache interface for consistent API
export interface CacheClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  expire(key: string, seconds: number): Promise<void>
  flushall(): Promise<void>
  keys(pattern: string): Promise<string[]>
}

// Unified cache client
class UnifiedCacheClient implements CacheClient {
  private getClient() {
    return upstashClient || localClient
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = this.getClient()
      if (!client) return null
      
      if (upstashClient) {
        return await upstashClient.get(key)
      } else if (localClient) {
        return await localClient.get(key)
      }
      return null
    } catch (error) {
      console.warn('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    try {
      const client = this.getClient()
      if (!client) return
      
      if (upstashClient) {
        await upstashClient.set(key, value, options)
      } else if (localClient) {
        if (options?.ex) {
          await localClient.setEx(key, options.ex, value)
        } else if (options?.px) {
          await localClient.pSetEx(key, options.px, value)
        } else {
          await localClient.set(key, value)
        }
      }
    } catch (error) {
      console.warn('Cache set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = this.getClient()
      if (!client) return
      
      if (upstashClient) {
        await upstashClient.del(key)
      } else if (localClient) {
        await localClient.del(key)
      }
    } catch (error) {
      console.warn('Cache del error:', error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient()
      if (!client) return false
      
      if (upstashClient) {
        const result = await upstashClient.exists(key)
        return result === 1
      } else if (localClient) {
        const result = await localClient.exists(key)
        return result === 1
      }
      return false
    } catch (error) {
      console.warn('Cache exists error:', error)
      return false
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      const client = this.getClient()
      if (!client) return
      
      if (upstashClient) {
        await upstashClient.expire(key, seconds)
      } else if (localClient) {
        await localClient.expire(key, seconds)
      }
    } catch (error) {
      console.warn('Cache expire error:', error)
    }
  }

  async flushall(): Promise<void> {
    try {
      const client = this.getClient()
      if (!client) return
      
      if (upstashClient) {
        await upstashClient.flushall()
      } else if (localClient) {
        await localClient.flushAll()
      }
    } catch (error) {
      console.warn('Cache flushall error:', error)
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const client = this.getClient()
      if (!client) return []
      
      if (upstashClient) {
        return await upstashClient.keys(pattern)
      } else if (localClient) {
        return await localClient.keys(pattern)
      }
      return []
    } catch (error) {
      console.warn('Cache keys error:', error)
      return []
    }
  }
}

export const cache = new UnifiedCacheClient()

// Cache key generators
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (page: number, limit: number, filters?: string) => 
    `products:${page}:${limit}${filters ? `:${filters}` : ''}`,
  productsByCategory: (categoryId: string, page: number, limit: number) => 
    `products:category:${categoryId}:${page}:${limit}`,
  categories: () => 'categories:all',
  tags: () => 'tags:all',
  analytics: (linkId: string, period: string) => `analytics:${linkId}:${period}`,
  linkHealth: (linkId: string) => `link:health:${linkId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  seoData: (slug: string) => `seo:${slug}`,
  sitemap: () => 'sitemap:xml',
  searchResults: (query: string, page: number) => `search:${query}:${page}`,
}

// Cache TTL constants (in seconds)
export const cacheTTL = {
  short: 300,      // 5 minutes
  medium: 1800,    // 30 minutes
  long: 3600,      // 1 hour
  day: 86400,      // 24 hours
  week: 604800,    // 7 days
}