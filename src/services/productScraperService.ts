import { ExtractedProductData } from '@/components/admin/AutomaticProductAddition';

class ProductScraperService {

  async extractProductData(url: string): Promise<ExtractedProductData> {
    const platform = this.detectPlatformFromUrl(url);

    // Validate URL
    if (!url.trim()) {
      throw new Error('Please provide a valid URL');
    }

    if (platform === 'unknown') {
      throw new Error('Unsupported platform. Please use links from Lazada, Shopee, TikTok Shop, Amazon, or AliExpress.');
    }

    // Simulated data extraction with platform-specific data
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    
    return this.generatePlatformSpecificData(platform, url);
  }

  private generatePlatformSpecificData(platform: string, url: string): ExtractedProductData {
    const platformData = {
      'lazada': {
        name: 'Smartphone Pro Max 256GB - Latest Model',
        description: 'High-performance smartphone with advanced camera system, long-lasting battery, and premium design. Perfect for photography enthusiasts and power users.',
        price: 45999,
        originalPrice: 59999,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
        category: 'Electronics',
        brand: 'TechPro',
        rating: 4.6,
        reviewCount: 1247
      },
      'shopee': {
        name: 'Wireless Bluetooth Headphones - Premium Sound',
        description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio quality. Ideal for music lovers and professionals.',
        price: 2499,
        originalPrice: 3999,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
        category: 'Electronics',
        brand: 'SoundMax',
        rating: 4.4,
        reviewCount: 876
      },
      'tiktok': {
        name: 'Trendy Summer Dress - Floral Pattern',
        description: 'Stylish and comfortable summer dress with beautiful floral pattern. Made from breathable fabric, perfect for casual outings and special occasions.',
        price: 899,
        originalPrice: 1299,
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
        category: 'Fashion',
        brand: 'StyleHub',
        rating: 4.7,
        reviewCount: 432
      },
      'amazon': {
        name: 'Coffee Maker Machine - 12 Cup Programmable',
        description: 'Programmable coffee maker with 12-cup capacity, auto-brew timer, and thermal carafe. Features multiple brew strength settings and easy-clean design.',
        price: 3299,
        originalPrice: 4499,
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop',
        category: 'Home & Garden',
        brand: 'BrewMaster',
        rating: 4.3,
        reviewCount: 2156
      },
      'aliexpress': {
        name: 'Fitness Tracker Watch - Health Monitor',
        description: 'Advanced fitness tracker with heart rate monitoring, sleep tracking, GPS, and smartphone notifications. Waterproof design with 7-day battery life.',
        price: 1999,
        originalPrice: 2999,
        imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop',
        category: 'Sports & Outdoors',
        brand: 'FitTrack',
        rating: 4.2,
        reviewCount: 3421
      }
    };

    const data = platformData[platform as keyof typeof platformData];
    
    return {
      ...data,
      platform
    };
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

export const productScraperService = new ProductScraperService();
export default productScraperService;

