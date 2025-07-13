import crypto from 'crypto';
import { LAZADA_CONFIG } from './config';
import { Product } from '@/types/product';

export interface LazadaProduct {
  item_id: string;
  title: string;
  price: string;
  original_price?: string;
  discount?: string;
  image: string;
  item_url: string;
  shop_name: string;
  location: string;
  rating: number;
  review_count: number;
  category_id: string;
  brand: string;
  sku_list: Array<{
    sku_id: string;
    price: string;
    stock: number;
  }>;
}

export interface LazadaSearchParams {
  q: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  sort?: 'price_asc' | 'price_desc' | 'sales' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface LazadaSearchResponse {
  data: {
    products: LazadaProduct[];
    total_products: number;
    total_pages: number;
    current_page: number;
  };
  code: string;
  message: string;
}

export class LazadaClient {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    this.appKey = process.env.LAZADA_APP_KEY || '';
    this.appSecret = process.env.LAZADA_APP_SECRET || '';
    this.accessToken = process.env.LAZADA_ACCESS_TOKEN || '';
    this.baseUrl = 'https://api.lazada.com.ph/rest'; // Philippines endpoint
  }

  // Generate API signature for authentication
  private generateSignature(params: Record<string, any>, apiPath: string): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const queryString = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const stringToSign = `${apiPath}${queryString}`;
    
    return crypto
      .createHmac('sha256', this.appSecret)
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();
  }

  // Make API request with authentication
  private async makeRequest(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const timestamp = Date.now().toString();
    
    const requestParams = {
      app_key: this.appKey,
      timestamp,
      sign_method: 'sha256',
      access_token: this.accessToken,
      ...params,
    };

    const signature = this.generateSignature(requestParams, endpoint);
    requestParams.sign = signature;

    const url = `${this.baseUrl}${endpoint}`;
    const queryString = Object.keys(requestParams)
      .map(key => `${key}=${encodeURIComponent(requestParams[key])}`)
      .join('&');

    try {
      const response = await fetch(`${url}?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: LAZADA_CONFIG.settings.timeout,
      });

      if (!response.ok) {
        throw new Error(`Lazada API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Lazada API request failed:', error);
      throw error;
    }
  }

  // Search products
  async searchProducts(params: LazadaSearchParams): Promise<LazadaSearchResponse> {
    const searchParams = {
      q: params.q,
      category: params.category,
      price_min: params.price_min,
      price_max: params.price_max,
      sort: params.sort || 'sales',
      offset: ((params.page || 1) - 1) * (params.limit || 20),
      limit: params.limit || 20,
    };

    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value !== undefined)
    );

    return await this.makeRequest('/products/search', filteredParams);
  }

  // Get product details
  async getProductDetails(productId: string): Promise<LazadaProduct> {
    const response = await this.makeRequest('/product/item/get', {
      item_id: productId,
    });

    return response.data;
  }

  // Generate affiliate link
  async generateAffiliateLink(productUrl: string): Promise<string> {
    const response = await this.makeRequest('/affiliate/product/generate', {
      product_url: productUrl,
    });

    return response.data.affiliate_url;
  }

  // Get product categories
  async getCategories(): Promise<any[]> {
    const response = await this.makeRequest('/category/tree/get');
    return response.data;
  }

  // Convert Lazada product to our Product interface
  convertToProduct(lazadaProduct: LazadaProduct): Product {
    const price = parseFloat(lazadaProduct.price);
    const originalPrice = lazadaProduct.original_price 
      ? parseFloat(lazadaProduct.original_price) 
      : undefined;

    return {
      id: lazadaProduct.item_id,
      name: lazadaProduct.title,
      price,
      originalPrice,
      discount: lazadaProduct.discount ? parseInt(lazadaProduct.discount) : undefined,
      imageUrl: lazadaProduct.image,
      rating: lazadaProduct.rating,
      reviewCount: lazadaProduct.review_count,
      platform: {
        id: 'lazada',
        name: 'Lazada',
        displayName: 'Lazada',
        url: 'https://lazada.com.ph',
        logo: '🛍️',
        color: 'blue',
      },
      category: lazadaProduct.category_id,
      brand: lazadaProduct.brand,
      availability: lazadaProduct.sku_list.some(sku => sku.stock > 0),
      affiliateUrl: lazadaProduct.item_url,
      seller: {
        name: lazadaProduct.shop_name,
        location: lazadaProduct.location,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

// Create singleton instance
export const lazadaClient = new LazadaClient();
