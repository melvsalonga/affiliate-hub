import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product';
import { handleApiError, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';

function generateCSV(products: any[]): string {
  if (products.length === 0) {
    return 'No products to export';
  }

  const headers = [
    'id',
    'title',
    'description',
    'shortDescription',
    'currentPrice',
    'originalPrice',
    'currency',
    'slug',
    'status',
    'isActive',
    'metaTitle',
    'metaDescription',
    'categoryName',
    'categorySlug',
    'createdAt',
    'updatedAt',
    'publishedAt',
    'imageUrls',
    'tags',
    'affiliateLinksCount'
  ];

  const csvRows = [headers.join(',')];

  products.forEach(product => {
    const row = [
      product.id,
      `"${product.title.replace(/"/g, '""')}"`,
      `"${product.description.replace(/"/g, '""')}"`,
      `"${(product.shortDescription || '').replace(/"/g, '""')}"`,
      product.currentPrice,
      product.originalPrice || '',
      product.currency,
      product.slug,
      product.status,
      product.isActive,
      `"${(product.metaTitle || '').replace(/"/g, '""')}"`,
      `"${(product.metaDescription || '').replace(/"/g, '""')}"`,
      `"${product.category.name.replace(/"/g, '""')}"`,
      product.category.slug,
      product.createdAt,
      product.updatedAt,
      product.publishedAt || '',
      `"${product.images.map((img: any) => img.url).join(',')}"`,
      `"${product.tags.map((tag: any) => tag.tag.name).join(',')}"`,
      product.affiliateLinks.length
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest();
    
    if (!authenticated || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkUserPermissions(user.id, ['ADMIN', 'EDITOR', 'VIEWER']);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const categoryId = searchParams.get('categoryId') || undefined;
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'SCHEDULED' || undefined;
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const limit = Math.min(10000, parseInt(searchParams.get('limit') || '1000'));

    // Build filters
    const filters = {
      categoryId,
      status,
      isActive
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    // Get products
    const result = await productRepository.findMany(
      filters,
      { field: 'createdAt', direction: 'desc' },
      1,
      limit
    );

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          products: result.data,
          pagination: result.pagination,
          exportedAt: new Date().toISOString(),
          filters
        }
      });
    }

    // Generate CSV
    const csv = generateCSV(result.data);
    const filename = `products-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}