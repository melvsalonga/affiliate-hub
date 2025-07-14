import { NextRequest, NextResponse } from 'next/server';
import { productAffiliateService } from '@/services/productAffiliateService';
import { Product } from '@/types/product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
  const query = searchParams.get('q')?.toLowerCase() || '';
  const platform = searchParams.get('platform') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sortBy = searchParams.get('sortBy') || 'relevance';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Get all affiliate products
  let products = productAffiliateService.getAffiliateProducts();

  // Filter by platform if specified
  if (platform && platform !== 'all') {
    products = products.filter(p => p.platform.id === platform);
  }

    // Filter by search query
    if (query) {
      products = products.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category) {
      products = products.filter(product => product.category === category);
    }

    // Filter by price range
    if (minPrice) {
      const min = parseFloat(minPrice);
      products = products.filter(product => product.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      products = products.filter(product => product.price <= max);
    }

    // Sort products
    switch (sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        products.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case 'newest':
        products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'popular':
        products.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    // Apply pagination
    const total = products.length;
    const paginatedProducts = products.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        },
        filters: {
          query,
          platform,
          category,
          minPrice,
          maxPrice,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch products'
      },
      { status: 500 }
    );
  }
}
