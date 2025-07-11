import { NextRequest, NextResponse } from 'next/server';
import { TikTokProduct, Product } from '@/types/product';

// Mock function to simulate TikTok Shop API call
async function fetchTikTokProducts(query: string): Promise<TikTokProduct[]> {
  // This will be replaced with actual TikTok Shop API integration
  return [];
}

// Transform TikTok Shop product data to our standard format
function transformTikTokProduct(tiktokProduct: TikTokProduct): Product {
  return {
    id: `tiktok-${tiktokProduct.product_id}`,
    name: tiktokProduct.title,
    description: tiktokProduct.title,
    price: tiktokProduct.discount_price || tiktokProduct.price,
    originalPrice: tiktokProduct.discount_price ? tiktokProduct.price : undefined,
    currency: 'PHP',
    imageUrl: tiktokProduct.image_url,
    platform: {
      id: 'tiktok',
      name: 'TikTok Shop',
      displayName: 'TikTok Shop',
      baseUrl: 'https://shop.tiktok.com',
      logoUrl: '/logos/tiktok.png',
      commission: 12.5,
      currency: 'PHP'
    },
    affiliateUrl: tiktokProduct.url,
    category: 'general',
    rating: tiktokProduct.rating,
    reviewCount: tiktokProduct.review_count,
    discount: tiktokProduct.discount_price ? Math.round(((tiktokProduct.price - tiktokProduct.discount_price) / tiktokProduct.price) * 100) : undefined,
    isAvailable: true,
    shippingInfo: {
      cost: 0, // TikTok Shop often has free shipping
      estimatedDays: 3
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

    // Placeholder for actual TikTok Shop API integration
    const tiktokProducts = await fetchTikTokProducts(query);
    const transformedProducts = tiktokProducts.map(transformTikTokProduct);

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts.slice(0, limit),
        platform: 'tiktok',
        query,
        total: transformedProducts.length,
        metadata: {
          hasVideo: tiktokProducts.some(p => p.video_url),
          avgRating: transformedProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / transformedProducts.length
        }
      }
    });

  } catch (error) {
    console.error('TikTok Shop API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch products from TikTok Shop'
    }, { status: 500 });
  }
}
