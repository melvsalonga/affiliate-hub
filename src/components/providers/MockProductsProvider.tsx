'use client';

import { useEffect } from 'react';
import { productAffiliateService } from '@/services/productAffiliateService';
import { cacheService } from '@/services/cacheService';

export default function AffiliateProductsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set up global reference to affiliate products for localStorage utilities
    if (typeof window !== 'undefined') {
      // Get affiliate products and make them globally available
      const affiliateProducts = productAffiliateService.getAffiliateProducts();
      (window as any).__AFFILIATE_PRODUCTS__ = affiliateProducts;
      
      // Preload common data into cache
      cacheService.preloadCommonData();
    }
  }, []);

  return <>{children}</>;
}
