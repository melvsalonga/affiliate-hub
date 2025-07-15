import { Product } from '@/types/product';
import { AffiliateLink } from '@/types/affiliate';
import { storage } from '@/utils/localStorage';

class ProductAffiliateService {
  
  // Convert affiliate link to product
  async createProductFromAffiliateLink(affiliateLink: AffiliateLink, productData: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    category: string;
    brand?: string;
    rating?: number;
    reviewCount?: number;
    isAvailable?: boolean;
    location?: string;
  }): Promise<Product> {
    
    const product: Product = {
      id: `product_${affiliateLink.id}`,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.originalPrice,
      currency: 'PHP',
      imageUrl: productData.imageUrl,
      platform: {
        id: affiliateLink.platform,
        name: this.getPlatformDisplayName(affiliateLink.platform),
        displayName: this.getPlatformDisplayName(affiliateLink.platform),
        baseUrl: this.getPlatformBaseUrl(affiliateLink.platform),
        logoUrl: this.getPlatformLogoUrl(affiliateLink.platform),
        commission: affiliateLink.commission,
        currency: 'PHP'
      },
      affiliateUrl: affiliateLink.affiliateUrl,
      category: productData.category,
      brand: productData.brand,
      rating: productData.rating || 4.5,
      reviewCount: productData.reviewCount || 100,
      discount: productData.originalPrice ? 
        Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100) : 0,
      isAvailable: productData.isAvailable !== false,
      location: productData.location || 'Philippines',
      shippingInfo: {
        cost: 0,
        estimatedDays: 3,
        freeShippingMinimum: 500
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save product to storage
    this.saveProductToStorage(product);

    return product;
  }

  // Create product manually
  async createManualProduct(productData: {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    category: string;
    brand?: string;
    rating?: number;
    reviewCount?: number;
    platform: string;
    affiliateUrl: string;
    isAvailable: boolean;
    location: string;
  }): Promise<Product> {
    const product: Product = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.originalPrice,
      currency: 'PHP',
      imageUrl: productData.imageUrl,
      platform: {
        id: productData.platform,
        name: this.getPlatformDisplayName(productData.platform),
        displayName: this.getPlatformDisplayName(productData.platform),
        baseUrl: this.getPlatformBaseUrl(productData.platform),
        logoUrl: this.getPlatformLogoUrl(productData.platform),
        commission: this.getDefaultCommission(productData.platform),
        currency: 'PHP'
      },
      affiliateUrl: productData.affiliateUrl,
      category: productData.category,
      brand: productData.brand,
      rating: productData.rating || 4.5,
      reviewCount: productData.reviewCount || 100,
      discount: productData.originalPrice ? 
        Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100) : 0,
      isAvailable: productData.isAvailable,
      location: productData.location,
      shippingInfo: {
        cost: 0,
        estimatedDays: 3,
        freeShippingMinimum: 500
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save product to storage
    this.saveProductToStorage(product);

    return product;
  }

  // Get all products created from affiliate links
  getAffiliateProducts(): Product[] {
    try {
      const stored = localStorage.getItem('affiliate_products');
      if (stored) {
        const products = JSON.parse(stored);
        return products.map((product: any) => ({
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading affiliate products:', error);
      return [];
    }
  }

  // Save product to storage
  private saveProductToStorage(product: Product): void {
    try {
      const existingProducts = this.getAffiliateProducts();
      const updatedProducts = [product, ...existingProducts.filter(p => p.id !== product.id)];
      localStorage.setItem('affiliate_products', JSON.stringify(updatedProducts));
    } catch (error) {
      console.error('Error saving affiliate product:', error);
    }
  }

  // Update product
  updateProduct(productId: string, updates: Partial<Product>): Product | null {
    try {
      const products = this.getAffiliateProducts();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) return null;

      const updatedProduct = {
        ...products[productIndex],
        ...updates,
        updatedAt: new Date()
      };

      products[productIndex] = updatedProduct;
      localStorage.setItem('affiliate_products', JSON.stringify(products));

      return updatedProduct;
    } catch (error) {
      console.error('Error updating affiliate product:', error);
      return null;
    }
  }

  // Delete product
  deleteProduct(productId: string): boolean {
    try {
      const products = this.getAffiliateProducts();
      const filteredProducts = products.filter(p => p.id !== productId);
      
      if (filteredProducts.length === products.length) return false;

      localStorage.setItem('affiliate_products', JSON.stringify(filteredProducts));
      return true;
    } catch (error) {
      console.error('Error deleting affiliate product:', error);
      return false;
    }
  }

  // Track click when user clicks on product
  async trackProductClick(productId: string, affiliateLinkId: string): Promise<void> {
    try {
      // Track in analytics
      await fetch('/api/affiliate/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'click',
          linkId: affiliateLinkId,
          sessionId: this.generateSessionId(),
          ipAddress: 'unknown',
          userAgent: navigator.userAgent,
          referrer: window.location.href,
          country: 'Philippines',
          device: this.getDeviceType(),
          browser: this.getBrowserType(),
          os: this.getOSType()
        }),
      });

      // Track in storage for quick access
      storage.clickEvents.add({
        productId,
        affiliateLinkId,
        timestamp: new Date(),
        platform: this.getPlatformFromProductId(productId)
      });
    } catch (error) {
      console.error('Error tracking product click:', error);
    }
  }

  // Auto-fill product data from URL (basic implementation)
  async extractProductDataFromUrl(url: string): Promise<Partial<{
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    category: string;
    brand?: string;
  }>> {
    // This is a basic implementation - in production you'd use web scraping or APIs
    const platform = this.detectPlatformFromUrl(url);
    
    return {
      name: 'Product Name (Auto-detected)',
      description: 'Product description will be auto-filled',
      price: 999,
      originalPrice: 1299,
      imageUrl: '/placeholder-product.jpg',
      category: 'Electronics',
      brand: 'Unknown Brand'
    };
  }

  // Helper methods
  private getPlatformDisplayName(platform: string): string {
    const platformMap: Record<string, string> = {
      'lazada': 'Lazada',
      'shopee': 'Shopee',
      'tiktok': 'TikTok Shop',
      'amazon': 'Amazon',
      'aliexpress': 'AliExpress'
    };
    return platformMap[platform] || platform;
  }

  private getPlatformBaseUrl(platform: string): string {
    const urlMap: Record<string, string> = {
      'lazada': 'https://www.lazada.com.ph',
      'shopee': 'https://shopee.ph',
      'tiktok': 'https://shop.tiktok.com',
      'amazon': 'https://amazon.com',
      'aliexpress': 'https://aliexpress.com'
    };
    return urlMap[platform] || '';
  }

  private getPlatformLogoUrl(platform: string): string {
    return `/logos/${platform}.png`;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowserType(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private getOSType(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Other';
  }

  private getPlatformFromProductId(productId: string): string {
    // Extract platform from product ID if it contains affiliate link ID
    return 'unknown';
  }

  private detectPlatformFromUrl(url: string): string {
    if (url.includes('lazada.com')) return 'lazada';
    if (url.includes('shopee.ph')) return 'shopee';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('amazon.com')) return 'amazon';
    if (url.includes('aliexpress.com')) return 'aliexpress';
    return 'unknown';
  }
}

export const productAffiliateService = new ProductAffiliateService();
export default productAffiliateService;
