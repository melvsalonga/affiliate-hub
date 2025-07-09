import { Product } from '@/types/product';

export const mockProducts: Product[] = [
  {
    id: 'lazada-1',
    name: 'iPhone 15 Pro Max 256GB Natural Titanium',
    description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
    price: 75990,
    originalPrice: 79990,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
    platform: {
      id: 'lazada',
      name: 'Lazada',
      displayName: 'Lazada',
      baseUrl: 'https://lazada.com.ph',
      logoUrl: '/logos/lazada.png',
      commission: 3,
      currency: 'PHP'
    },
    affiliateUrl: 'https://lazada.com.ph/products/iphone-15-pro-max',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 1250,
    discount: 5,
    isAvailable: true,
    location: 'Manila, Philippines',
    shippingInfo: {
      cost: 0,
      estimatedDays: 2,
      freeShippingMinimum: 1000
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  },
  {
    id: 'shopee-1',
    name: 'Samsung Galaxy S24 Ultra 512GB Titanium Black',
    description: 'Premium Samsung flagship with S Pen, 200MP camera, and AI features',
    price: 69990,
    originalPrice: 74990,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80',
    platform: {
      id: 'shopee',
      name: 'Shopee',
      displayName: 'Shopee',
      baseUrl: 'https://shopee.ph',
      logoUrl: '/logos/shopee.png',
      commission: 4,
      currency: 'PHP'
    },
    affiliateUrl: 'https://shopee.ph/samsung-galaxy-s24-ultra',
    category: 'electronics',
    brand: 'Samsung',
    rating: 4.7,
    reviewCount: 890,
    discount: 7,
    isAvailable: true,
    location: 'Cebu, Philippines',
    shippingInfo: {
      cost: 0,
      estimatedDays: 3,
      freeShippingMinimum: 500
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  },
  {
    id: 'tiktok-1',
    name: 'Viral LED Strip Lights 5M RGB Color Changing',
    description: 'Trending LED strips with app control, music sync, and 16M colors',
    price: 799,
    originalPrice: 1299,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',
    platform: {
      id: 'tiktok',
      name: 'TikTok Shop',
      displayName: 'TikTok Shop',
      baseUrl: 'https://shop.tiktok.com',
      logoUrl: '/logos/tiktok.png',
      commission: 15,
      currency: 'PHP'
    },
    affiliateUrl: 'https://shop.tiktok.com/led-strip-lights',
    category: 'home',
    brand: 'Generic',
    rating: 4.3,
    reviewCount: 2150,
    discount: 38,
    isAvailable: true,
    location: 'Guangzhou, China',
    shippingInfo: {
      cost: 49,
      estimatedDays: 7,
      freeShippingMinimum: 1000
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  },
  {
    id: 'amazon-1',
    name: 'Apple AirPods Pro 2nd Generation with MagSafe',
    description: 'Premium wireless earbuds with active noise cancellation and spatial audio',
    price: 13990,
    originalPrice: 14990,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80',
    platform: {
      id: 'amazon',
      name: 'Amazon',
      displayName: 'Amazon',
      baseUrl: 'https://amazon.com',
      logoUrl: '/logos/amazon.png',
      commission: 2,
      currency: 'PHP'
    },
    affiliateUrl: 'https://amazon.com/airpods-pro-2nd-generation',
    category: 'electronics',
    brand: 'Apple',
    rating: 4.9,
    reviewCount: 45670,
    discount: 7,
    isAvailable: true,
    location: 'USA',
    shippingInfo: {
      cost: 299,
      estimatedDays: 10,
      freeShippingMinimum: 2000
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  },
  {
    id: 'aliexpress-1',
    name: 'Wireless Bluetooth Mechanical Keyboard RGB',
    description: 'Gaming keyboard with blue switches, RGB backlighting, and wireless connectivity',
    price: 2499,
    originalPrice: 3999,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
    platform: {
      id: 'aliexpress',
      name: 'AliExpress',
      displayName: 'AliExpress',
      baseUrl: 'https://aliexpress.com',
      logoUrl: '/logos/aliexpress.png',
      commission: 6,
      currency: 'PHP'
    },
    affiliateUrl: 'https://aliexpress.com/wireless-mechanical-keyboard',
    category: 'electronics',
    brand: 'Generic',
    rating: 4.2,
    reviewCount: 567,
    discount: 38,
    isAvailable: true,
    location: 'Shenzhen, China',
    shippingInfo: {
      cost: 0,
      estimatedDays: 14,
      freeShippingMinimum: 1500
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  },
  {
    id: 'lazada-2',
    name: 'Nike Air Force 1 Low White Unisex Sneakers',
    description: 'Classic white leather sneakers, comfortable and versatile for daily wear',
    price: 4995,
    originalPrice: 5995,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80',
    platform: {
      id: 'lazada',
      name: 'Lazada',
      displayName: 'Lazada',
      baseUrl: 'https://lazada.com.ph',
      logoUrl: '/logos/lazada.png',
      commission: 3,
      currency: 'PHP'
    },
    affiliateUrl: 'https://lazada.com.ph/nike-air-force-1',
    category: 'fashion',
    brand: 'Nike',
    rating: 4.6,
    reviewCount: 789,
    discount: 17,
    isAvailable: true,
    location: 'Manila, Philippines',
    shippingInfo: {
      cost: 0,
      estimatedDays: 2,
      freeShippingMinimum: 1000
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  },
  {
    id: 'shopee-2',
    name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
    description: 'Multi-functional pressure cooker, slow cooker, rice cooker, and more',
    price: 8999,
    originalPrice: 11999,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-4e94e8e5d4a7?w=400&q=80',
    platform: {
      id: 'shopee',
      name: 'Shopee',
      displayName: 'Shopee',
      baseUrl: 'https://shopee.ph',
      logoUrl: '/logos/shopee.png',
      commission: 4,
      currency: 'PHP'
    },
    affiliateUrl: 'https://shopee.ph/instant-pot-duo',
    category: 'home',
    brand: 'Instant Pot',
    rating: 4.8,
    reviewCount: 1234,
    discount: 25,
    isAvailable: true,
    location: 'Davao, Philippines',
    shippingInfo: {
      cost: 0,
      estimatedDays: 3,
      freeShippingMinimum: 500
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  },
  {
    id: 'tiktok-2',
    name: 'Viral Makeup Set 12-Piece Professional Kit',
    description: 'Complete makeup collection with brushes, eyeshadow palette, and lipsticks',
    price: 1299,
    originalPrice: 2499,
    currency: 'PHP',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
    platform: {
      id: 'tiktok',
      name: 'TikTok Shop',
      displayName: 'TikTok Shop',
      baseUrl: 'https://shop.tiktok.com',
      logoUrl: '/logos/tiktok.png',
      commission: 15,
      currency: 'PHP'
    },
    affiliateUrl: 'https://shop.tiktok.com/makeup-set',
    category: 'beauty',
    brand: 'Generic',
    rating: 4.1,
    reviewCount: 3456,
    discount: 48,
    isAvailable: true,
    location: 'Guangzhou, China',
    shippingInfo: {
      cost: 49,
      estimatedDays: 7,
      freeShippingMinimum: 1000
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-09')
  }
];

export const featuredProducts = mockProducts.slice(0, 4);
export const trendingProducts = mockProducts.slice(2, 6);
export const dealsProducts = mockProducts.filter(p => p.discount && p.discount > 20);
