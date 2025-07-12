import { Product, LazadaProduct, ShopeeProduct, TikTokProduct, AmazonProduct, AliExpressProduct } from '@/types/product';

export interface PlatformConfig {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiEndpoint?: string;
  apiKey?: string;
  commission: number;
  currency: string;
  isActive: boolean;
  rateLimit: number; // requests per minute
}

export const platformConfigs: Record<string, PlatformConfig> = {
  lazada: {
    id: 'lazada',
    name: 'Lazada',
    displayName: 'Lazada',
    baseUrl: 'https://lazada.com.ph',
    apiEndpoint: process.env.LAZADA_API_ENDPOINT,
    apiKey: process.env.LAZADA_API_KEY,
    commission: 4.5,
    currency: 'PHP',
    isActive: true,
    rateLimit: 60
  },
  shopee: {
    id: 'shopee',
    name: 'Shopee',
    displayName: 'Shopee',
    baseUrl: 'https://shopee.ph',
    apiEndpoint: process.env.SHOPEE_API_ENDPOINT,
    apiKey: process.env.SHOPEE_API_KEY,
    commission: 3.5,
    currency: 'PHP',
    isActive: true,
    rateLimit: 100
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok Shop',
    displayName: 'TikTok Shop',
    baseUrl: 'https://shop.tiktok.com',
    apiEndpoint: process.env.TIKTOK_API_ENDPOINT,
    apiKey: process.env.TIKTOK_API_KEY,
    commission: 12.5,
    currency: 'PHP',
    isActive: true,
    rateLimit: 50
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    displayName: 'Amazon',
    baseUrl: 'https://amazon.com',
    apiEndpoint: process.env.AMAZON_API_ENDPOINT,
    apiKey: process.env.AMAZON_API_KEY,
    commission: 5.0,
    currency: 'USD',
    isActive: true,
    rateLimit: 30
  },
  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    displayName: 'AliExpress',
    baseUrl: 'https://aliexpress.com',
    apiEndpoint: process.env.ALIEXPRESS_API_ENDPOINT,
    apiKey: process.env.ALIEXPRESS_API_KEY,
    commission: 5.5,
    currency: 'USD',
    isActive: true,
    rateLimit: 40
  }
};

export class PlatformService {
  private static instance: PlatformService;
  private rateLimiters: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PlatformService {
    if (!PlatformService.instance) {
      PlatformService.instance = new PlatformService();
    }
    return PlatformService.instance;
  }

  // Rate limiting check
  private canMakeRequest(platformId: string): boolean {
    const config = platformConfigs[platformId];
    if (!config) return false;

    const now = Date.now();
    const requests = this.rateLimiters.get(platformId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = requests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= config.rateLimit) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimiters.set(platformId, recentRequests);
    
    return true;
  }

  // Get active platforms
  getActivePlatforms(): PlatformConfig[] {
    return Object.values(platformConfigs).filter(config => config.isActive);
  }

  // Get platform configuration
  getPlatformConfig(platformId: string): PlatformConfig | null {
    return platformConfigs[platformId] || null;
  }

  // Fetch products from specific platform
  async fetchFromPlatform(platformId: string, query: string, limit: number = 20): Promise<Product[]> {
    const config = this.getPlatformConfig(platformId);
    
    if (!config || !config.isActive) {
      throw new Error(`Platform ${platformId} is not available`);
    }

    if (!this.canMakeRequest(platformId)) {
      throw new Error(`Rate limit exceeded for platform ${platformId}`);
    }

    // This would call the actual platform API
    // For now, return empty array as placeholder
    return [];
  }

  // Fetch products from multiple platforms
  async fetchFromMultiplePlatforms(platforms: string[], query: string, limit: number = 20): Promise<Product[]> {
    const promises = platforms.map(platformId => 
      this.fetchFromPlatform(platformId, query, Math.ceil(limit / platforms.length))
        .catch(error => {
          console.error(`Error fetching from ${platformId}:`, error);
          return [];
        })
    );

    const results = await Promise.allSettled(promises);
    const products: Product[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        products.push(...result.value);
      } else {
        console.error(`Platform ${platforms[index]} failed:`, result.reason);
      }
    });

    return products.slice(0, limit);
  }

  // Transform platform-specific product data
  transformLazadaProduct(lazadaProduct: LazadaProduct): Product {
    return {
      id: `lazada-${lazadaProduct.itemId}`,
      name: lazadaProduct.name,
      description: lazadaProduct.name,
      price: lazadaProduct.price,
      originalPrice: lazadaProduct.originalPrice,
      currency: 'PHP',
      imageUrl: lazadaProduct.image,
      platform: {
        id: 'lazada',
        name: 'Lazada',
        displayName: 'Lazada',
        baseUrl: 'https://lazada.com.ph',
        logoUrl: '/logos/lazada.png',
        commission: 4.5,
        currency: 'PHP'
      },
      affiliateUrl: lazadaProduct.url,
      category: 'general',
      rating: lazadaProduct.rating,
      reviewCount: lazadaProduct.reviewCount,
      discount: lazadaProduct.discount,
      isAvailable: true,
      location: lazadaProduct.location,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Add similar transform methods for other platforms...
  // (transformShopeeProduct, transformTikTokProduct, etc.)

  // Generate affiliate link with tracking
  generateAffiliateLink(product: Product, userId?: string): string {
    const config = this.getPlatformConfig(product.platform.id);
    if (!config) return product.affiliateUrl;

    // Add tracking parameters
    const url = new URL(product.affiliateUrl);
    url.searchParams.append('aff_source', 'affiliate-hub');
    if (userId) {
      url.searchParams.append('user_id', userId);
    }
    url.searchParams.append('timestamp', Date.now().toString());

    return url.toString();
  }

  // Calculate commission
  calculateCommission(product: Product, orderValue: number): number {
    const config = this.getPlatformConfig(product.platform.id);
    if (!config) return 0;

    return (orderValue * config.commission) / 100;
  }

  // Health check for all platforms
  async healthCheck(): Promise<Record<string, boolean>> {
    const platforms = this.getActivePlatforms();
    const results: Record<string, boolean> = {};

    for (const platform of platforms) {
      try {
        // This would make a simple API call to check if platform is responding
        // For now, just return true
        results[platform.id] = true;
      } catch (error) {
        results[platform.id] = false;
      }
    }

    return results;
  }
}
