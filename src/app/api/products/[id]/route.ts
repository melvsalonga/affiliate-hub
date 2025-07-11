import { NextRequest, NextResponse } from 'next/server';
import { mockProducts } from '@/data/mockProducts';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find the product by ID
    const product = mockProducts.find(p => p.id === id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
          message: `Product with ID "${id}" does not exist`
        },
        { status: 404 }
      );
    }

    // Get related products (same category, different products)
    const relatedProducts = mockProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    // Get similar products from same platform
    const similarProducts = mockProducts
      .filter(p => p.platform.id === product.platform.id && p.id !== product.id)
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      data: {
        product,
        relatedProducts,
        similarProducts,
        metadata: {
          category: product.category,
          platform: product.platform.name,
          lastUpdated: product.updatedAt,
          availability: product.isAvailable ? 'In Stock' : 'Out of Stock'
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch product details'
      },
      { status: 500 }
    );
  }
}
