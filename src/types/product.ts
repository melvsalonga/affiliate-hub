// Product interfaces for multi-platform affiliate hub

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  platform: Platform;
  affiliateUrl: string;
  category: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  discount?: number;
  isAvailable: boolean;
  location?: string;
  shippingInfo?: ShippingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingInfo {
  cost: number;
  estimatedDays: number;
  freeShippingMinimum?: number;
}

export interface Platform {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  logoUrl: string;
  commission: number;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  subcategories?: Category[];
}

export interface ProductFilter {
  category?: string;
  platform?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  location?: string;
  sortBy?: 'price' | 'rating' | 'discount' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  category?: string;
  platform?: string;
  page?: number;
  limit?: number;
  filters?: ProductFilter;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Platform-specific product structures
export interface LazadaProduct {
  itemId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount: number;
  seller: string;
  location: string;
  url: string;
}

export interface ShopeeProduct {
  itemid: number;
  shopid: number;
  name: string;
  price: number;
  price_before_discount?: number;
  image: string;
  rating: number;
  sold: number;
  discount: string;
  shop_location: string;
  url: string;
}

export interface TikTokProduct {
  product_id: string;
  title: string;
  price: number;
  discount_price?: number;
  image_url: string;
  rating: number;
  review_count: number;
  sales_count: number;
  shop_name: string;
  video_url?: string;
  url: string;
}

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number;
  list_price?: number;
  image_url: string;
  rating: number;
  review_count: number;
  availability: string;
  brand: string;
  url: string;
}

export interface AliExpressProduct {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  rating: number;
  orders: number;
  store: string;
  shipping: string;
  url: string;
}

// User-related types
export interface UserPreferences {
  favoriteCategories: string[];
  preferredPlatforms: string[];
  priceRange: {
    min: number;
    max: number;
  };
  currency: string;
  location: string;
  notifications: {
    priceDrops: boolean;
    newDeals: boolean;
    newsletter: boolean;
  };
}

export interface UserFavorite {
  id: string;
  productId: string;
  userId?: string;
  addedAt: Date;
}

export interface PriceAlert {
  id: string;
  productId: string;
  userId?: string;
  targetPrice: number;
  isActive: boolean;
  createdAt: Date;
}

// Analytics types
export interface ClickEvent {
  productId: string;
  platform: string;
  userId?: string;
  timestamp: Date;
  referrer?: string;
  converted?: boolean;
}

export interface ConversionEvent {
  productId: string;
  platform: string;
  userId?: string;
  orderValue: number;
  commission: number;
  timestamp: Date;
}
