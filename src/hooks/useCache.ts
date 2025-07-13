import { useState, useEffect, useCallback } from 'react';
import { cacheService } from '@/services/cacheService';

// Generic cache hook
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = cacheService.get(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      cacheService.set(key, freshData);
      setData(freshData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    cacheService.delete(key);
    fetchData();
  }, [key, fetchData]);

  const updateCache = useCallback((newData: T) => {
    cacheService.set(key, newData);
    setData(newData);
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch,
    updateCache
  };
}

// Specific hooks for common operations

// Categories hook
export function useCategories() {
  return useCache(
    'categories',
    async () => {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data.categories;
    }
  );
}

// Search results hook
export function useSearchResults(query: string, platform: string = 'all') {
  return useCache(
    `search:${query}:${platform}`,
    async () => {
      const params = new URLSearchParams({ q: query });
      if (platform !== 'all') params.append('platform', platform);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data.products;
    },
    [query, platform]
  );
}

// Product details hook
export function useProductDetails(productId: string) {
  return useCache(
    `product:${productId}`,
    async () => {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data.product;
    },
    [productId]
  );
}

// Platform status hook
export function usePlatformStatus() {
  return useCache(
    'platform:status',
    async () => {
      const response = await fetch('/api/platforms/status');
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data.platforms;
    }
  );
}

// API response hook with custom cache duration
export function useApiData<T>(
  endpoint: string,
  params: Record<string, any> = {},
  cacheDuration?: number
) {
  const key = `api:${endpoint}:${JSON.stringify(params)}`;
  
  return useCache(
    key,
    async () => {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const response = await fetch(url);
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    }
  );
}

// Cache statistics hook
export function useCacheStats() {
  const [stats, setStats] = useState(cacheService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheService.getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
}
