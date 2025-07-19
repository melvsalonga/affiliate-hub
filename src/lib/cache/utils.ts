import { cache, cacheKeys, cacheTTL } from './redis'

// Generic cache wrapper for functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = cacheTTL.medium
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    
    // Try to get from cache first
    const cached = await cache.get(key)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (error) {
        console.warn('Cache parse error:', error)
        // Continue to fetch fresh data
      }
    }
    
    // Fetch fresh data
    const result = await fn(...args)
    
    // Cache the result
    if (result !== null && result !== undefined) {
      await cache.set(key, JSON.stringify(result), { ex: ttl })
    }
    
    return result
  }) as T
}

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate product-related caches
  async invalidateProduct(productId: string) {
    await Promise.all([
      cache.del(cacheKeys.product(productId)),
      this.invalidateProductLists(),
    ])
  },

  // Invalidate all product list caches
  async invalidateProductLists() {
    const keys = await cache.keys('products:*')
    if (keys.length > 0) {
      await Promise.all(keys.map(key => cache.del(key)))
    }
  },

  // Invalidate category-related caches
  async invalidateCategories() {
    await Promise.all([
      cache.del(cacheKeys.categories()),
      this.invalidateProductLists(),
    ])
  },

  // Invalidate tag-related caches
  async invalidateTags() {
    await Promise.all([
      cache.del(cacheKeys.tags()),
      this.invalidateProductLists(),
    ])
  },

  // Invalidate analytics caches
  async invalidateAnalytics(linkId?: string) {
    if (linkId) {
      const keys = await cache.keys(`analytics:${linkId}:*`)
      if (keys.length > 0) {
        await Promise.all(keys.map(key => cache.del(key)))
      }
    } else {
      const keys = await cache.keys('analytics:*')
      if (keys.length > 0) {
        await Promise.all(keys.map(key => cache.del(key)))
      }
    }
  },

  // Invalidate search caches
  async invalidateSearch() {
    const keys = await cache.keys('search:*')
    if (keys.length > 0) {
      await Promise.all(keys.map(key => cache.del(key)))
    }
  },

  // Invalidate SEO-related caches
  async invalidateSEO(slug?: string) {
    if (slug) {
      await cache.del(cacheKeys.seoData(slug))
    } else {
      const keys = await cache.keys('seo:*')
      if (keys.length > 0) {
        await Promise.all(keys.map(key => cache.del(key)))
      }
    }
    
    // Also invalidate sitemap
    await cache.del(cacheKeys.sitemap())
  },

  // Clear all caches (use with caution)
  async clearAll() {
    await cache.flushall()
  }
}

// Cache warming utilities
export const cacheWarming = {
  // Warm up product caches
  async warmProductCaches() {
    // This would typically be called during deployment or scheduled tasks
    console.log('Warming product caches...')
    // Implementation would fetch and cache popular products, categories, etc.
  },

  // Warm up analytics caches
  async warmAnalyticsCaches() {
    console.log('Warming analytics caches...')
    // Implementation would pre-calculate and cache common analytics queries
  }
}

// Cache statistics and monitoring
export const cacheStats = {
  async getStats() {
    try {
      const keys = await cache.keys('*')
      const stats = {
        totalKeys: keys.length,
        keysByType: {} as Record<string, number>
      }

      // Group keys by type
      keys.forEach(key => {
        const type = key.split(':')[0]
        stats.keysByType[type] = (stats.keysByType[type] || 0) + 1
      })

      return stats
    } catch (error) {
      console.warn('Error getting cache stats:', error)
      return { totalKeys: 0, keysByType: {} }
    }
  },

  async getKeyInfo(key: string) {
    try {
      const exists = await cache.exists(key)
      if (!exists) return null

      const value = await cache.get(key)
      return {
        key,
        exists,
        size: value ? new Blob([value]).size : 0,
        value: value ? JSON.parse(value) : null
      }
    } catch (error) {
      console.warn('Error getting key info:', error)
      return null
    }
  }
}

// Memory cache fallback for when Redis is unavailable
class MemoryCache {
  private cache = new Map<string, { value: string; expires: number }>()
  private maxSize = 1000 // Maximum number of items

  get(key: string): string | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  set(key: string, value: string, ttlSeconds: number = 300): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    })
  }

  del(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

export const memoryCache = new MemoryCache()