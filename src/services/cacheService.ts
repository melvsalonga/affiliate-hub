// Cache service for managing different types of data with different expiry times
import { Product } from '@/types/product';

interface CacheItem {
  data: any;
  timestamp: number;
  expiry: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem>();

  // Cache durations in milliseconds
  private readonly CACHE_DURATIONS = {
    SEARCH_RESULTS: 5 * 60 * 1000,      // 5 minutes
    PRODUCT_DETAILS: 15 * 60 * 1000,    // 15 minutes
    CATEGORIES: 60 * 60 * 1000,         // 1 hour
    PLATFORM_STATUS: 5 * 60 * 1000,     // 5 minutes
    USER_PREFERENCES: Infinity,          // Never expire (until cleared)
    RECENT_SEARCHES: 24 * 60 * 60 * 1000, // 24 hours
    API_RESPONSES: 10 * 60 * 1000,      // 10 minutes
  };

  private constructor() {
    // Clean up expired cache every 10 minutes
    setInterval(() => this.cleanupExpired(), 10 * 60 * 1000);
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Set cache with specific duration
  set(key: string, data: any, duration?: number): void {
    const expiry = duration || this.CACHE_DURATIONS.API_RESPONSES;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  // Get cache if not expired
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (item.expiry !== Infinity && Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Remove specific cache entry
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry !== Infinity && now - item.timestamp > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Specific methods for different data types
  
  // Search results caching
  setSearchResults(query: string, platform: string, results: Product[]): void {
    const key = `search:${query}:${platform}`;
    this.set(key, results, this.CACHE_DURATIONS.SEARCH_RESULTS);
  }

  getSearchResults(query: string, platform: string): Product[] | null {
    const key = `search:${query}:${platform}`;
    return this.get(key);
  }

  // Product details caching
  setProductDetails(productId: string, product: Product): void {
    const key = `product:${productId}`;
    this.set(key, product, this.CACHE_DURATIONS.PRODUCT_DETAILS);
  }

  getProductDetails(productId: string): Product | null {
    const key = `product:${productId}`;
    return this.get(key);
  }

  // Categories caching
  setCategories(categories: any[]): void {
    this.set('categories', categories, this.CACHE_DURATIONS.CATEGORIES);
  }

  getCategories(): any[] | null {
    return this.get('categories');
  }

  // Platform status caching
  setPlatformStatus(status: Record<string, boolean>): void {
    this.set('platform:status', status, this.CACHE_DURATIONS.PLATFORM_STATUS);
  }

  getPlatformStatus(): Record<string, boolean> | null {
    return this.get('platform:status');
  }

  // API response caching (generic)
  setApiResponse(endpoint: string, params: Record<string, any>, response: any): void {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    this.set(key, response, this.CACHE_DURATIONS.API_RESPONSES);
  }

  getApiResponse(endpoint: string, params: Record<string, any>): any | null {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.get(key);
  }

  // Get cache statistics
  getStats(): { 
    totalEntries: number; 
    memoryUsage: number; 
    hitRate: number; 
  } {
    return {
      totalEntries: this.cache.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
      hitRate: 0 // Would need to track hits/misses to calculate
    };
  }

  // Preload commonly accessed data
  async preloadCommonData(): Promise<void> {
    try {
      // Preload categories if not cached
      if (!this.getCategories()) {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          this.setCategories(data.data.categories);
        }
      }

      // Preload platform status if not cached
      if (!this.getPlatformStatus()) {
        const response = await fetch('/api/platforms/status');
        const data = await response.json();
        if (data.success) {
          this.setPlatformStatus(data.data.platforms);
        }
      }
    } catch (error) {
      console.warn('Failed to preload common data:', error);
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
