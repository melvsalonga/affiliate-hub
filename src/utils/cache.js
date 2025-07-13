import { useState, useEffect } from 'react';

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function getCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function clearCache() {
  cache.clear();
}

// Hook for cache management
export function useCache(key, fetchFunction) {
  const [data, setData] = useState(() => getCache(key));

  useEffect(() => {
    if (!data) {
      fetchFunction().then((result) => {
        setCache(key, result);
        setData(result);
      });
    }
  }, [key, data, fetchFunction]);

  return data;
}
