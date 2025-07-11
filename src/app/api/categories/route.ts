import { NextRequest, NextResponse } from 'next/server';
import { mockProducts } from '@/data/mockProducts';

export async function GET(request: NextRequest) {
  try {
    // Calculate statistics for each category
    const categoryStats: Record<string, {
      name: string;
      count: number;
      avgPrice: number;
      deals: number;
      platforms: Set<string>;
      minPrice: number;
      maxPrice: number;
    }> = {};

    // Category metadata
    const categoryInfo = {
      electronics: { name: 'Electronics', icon: '📱' },
      fashion: { name: 'Fashion', icon: '👗' },
      home: { name: 'Home & Living', icon: '🏠' },
      beauty: { name: 'Beauty & Health', icon: '💄' },
      sports: { name: 'Sports & Outdoors', icon: '⚽' },
      automotive: { name: 'Automotive', icon: '🚗' },
      toys: { name: 'Toys & Games', icon: '🎮' },
      books: { name: 'Books & Media', icon: '📚' },
    };

    // Process products to calculate statistics
    mockProducts.forEach(product => {
      const categoryKey = product.category;
      
      if (!categoryStats[categoryKey]) {
        categoryStats[categoryKey] = {
          name: categoryInfo[categoryKey as keyof typeof categoryInfo]?.name || categoryKey,
          count: 0,
          avgPrice: 0,
          deals: 0,
          platforms: new Set(),
          minPrice: Infinity,
          maxPrice: 0
        };
      }

      const stats = categoryStats[categoryKey];
      stats.count++;
      stats.platforms.add(product.platform.name);
      stats.minPrice = Math.min(stats.minPrice, product.price);
      stats.maxPrice = Math.max(stats.maxPrice, product.price);

      if (product.discount && product.discount > 0) {
        stats.deals++;
      }
    });

    // Calculate average prices and finalize data
    const categories = Object.keys(categoryStats).map(key => {
      const stats = categoryStats[key];
      const categoryProducts = mockProducts.filter(p => p.category === key);
      const avgPrice = Math.round(
        categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length
      );

      return {
        id: key,
        name: stats.name,
        icon: categoryInfo[key as keyof typeof categoryInfo]?.icon || '📦',
        count: stats.count,
        avgPrice,
        deals: stats.deals,
        platforms: Array.from(stats.platforms),
        priceRange: {
          min: stats.minPrice === Infinity ? 0 : stats.minPrice,
          max: stats.maxPrice
        }
      };
    });

    // Sort by product count (most popular first)
    categories.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      data: {
        categories,
        summary: {
          totalCategories: categories.length,
          totalProducts: mockProducts.length,
          totalDeals: categories.reduce((sum, cat) => sum + cat.deals, 0),
          avgPriceOverall: Math.round(
            mockProducts.reduce((sum, p) => sum + p.price, 0) / mockProducts.length
          )
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}
