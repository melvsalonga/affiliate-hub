import { NextRequest, NextResponse } from 'next/server';
import { ShopeeProduct, Product } from '@/types/product';

// Mock function to simulate Shopee API call
async function fetchShopeeProducts(query: string): Promise<ShopeeProduct[]> {
  // This will be replaced with actual Shopee API integration
  return [];
}

// Transform Shopee product data to our standard format
function transformShopeeProduct(shopeeProduct: ShopeeProduct): Product {
  return {
    id: `shopee-${shopeeProduct.itemid}`,
    name: shopeeProduct.name,
    description: shopeeProduct.name, // Shopee doesn't provide description in search
    price: shopeeProduct.price / 100000, // Shopee returns price in cents
    originalPrice: shopeeProduct.price_before_discount ? shopeeProduct.price_before_discount / 100000 : undefined,
    currency: 'PHP',
    imageUrl: `https://cf.shopee.ph/file/${shopeeProduct.image}`,
    platform: {
      id: 'shopee',
      name: 'Shopee',
      displayName: 'Shopee',
      baseUrl: 'https://shopee.ph',
      logoUrl: '/logos/shopee.png',
      commission: 3.5,
      currency: 'PHP'
    },
    affiliateUrl: shopeeProduct.url,
    category: 'general', // Will be enhanced with category mapping
    rating: shopeeProduct.rating,
    reviewCount: shopeeProduct.sold,
    discount: shopeeProduct.discount ? parseInt(shopeeProduct.discount) : undefined,
    isAvailable: true,
    location: shopeeProduct.shop_location,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Placeholder for actual Shopee API integration
    const shopeeProducts = await fetchShopeeProducts(query);
    const transformedProducts = shopeeProducts.map(transformShopeeProduct);

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts.slice(0, limit),
        platform: 'shopee',
        query,
        total: transformedProducts.length
      }
    });

  } catch (error) {
    console.error('Shopee API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch products from Shopee'
    }, { status: 500 });
  }
}
