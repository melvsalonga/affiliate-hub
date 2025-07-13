'use client';

import { useEffect } from 'react';
import { mockProducts } from '@/data/mockProducts';
import { cacheService } from '@/services/cacheService';

export default function MockProductsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up global reference to mock products for localStorage utilities
    if (typeof window !== 'undefined') {
      (window as any).__MOCK_PRODUCTS__ = mockProducts;
      
      // Preload common data into cache
      cacheService.preloadCommonData();
    }
  }, []);

  return <>{children}</>;
}
