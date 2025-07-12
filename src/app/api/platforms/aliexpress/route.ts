import { NextRequest, NextResponse } from 'next/server';
import { AliExpressProduct, Product } from '@/types/product';

// Mock function to simulate AliExpress API call
async function fetchAliExpressProducts(query: string): Promise<AliExpressProduct[]> {
  // This will be replaced with actual AliExpress API integration
  return [];
}

// Transform AliExpress product data to our standard format
function transformAliExpressProduct(aliProduct: AliExpressProduct): Product {
  return {
    id: `aliexpress-${aliProduct.productId}`,
    name: aliProduct.title,
    description: aliProduct.title,
    price: aliProduct.price,
    originalPrice: aliProduct.originalPrice,
    currency: 'USD',
    imageUrl: aliProduct.imageUrl,
    platform: {
      id: 'aliexpress',
      name: 'AliExpress',
      displayName: 'AliExpress',
      baseUrl: 'https://aliexpress.com',
      logoUrl: '/logos/aliexpress.png',
      commission: 5.5,
      currency: 'USD'
    },
    affiliateUrl: aliProduct.url,
    category: 'general',
    rating: aliProduct.rating,
    reviewCount: aliProduct.orders,
    discount: aliProduct.originalPrice ? Math.round(((aliProduct.originalPrice - aliProduct.price) / aliProduct.originalPrice) * 100) : undefined,
    isAvailable: true,
    shippingInfo: {
      cost: 0, // Often free shipping
      estimatedDays: 14 // International shipping
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Placeholder for actual AliExpress API integration
    const aliProducts = await fetchAliExpressProducts(query);
    const transformedProducts = aliProducts.map(transformAliExpressProduct);

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts.slice(0, limit),
        platform: 'aliexpress',
        query,
        total: transformedProducts.length,
        metadata: {
          avgRating: transformedProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / transformedProducts.length,
          totalOrders: transformedProducts.reduce((sum, p) => sum + (p.reviewCount || 0), 0),
          avgShippingDays: 14
        }
      }
    });

  } catch (error) {
    console.error('AliExpress API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch products from AliExpress'
    }, { status: 500 });
  }
}
