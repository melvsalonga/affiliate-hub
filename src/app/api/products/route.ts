import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product';
import { createProductSchema } from '@/lib/validations/product';
import { createClient } from '@/lib/supabase/server';
import { validateRequest, handleApiError } from '@/lib/api/utils';
import { withApiCache, apiCacheConfigs } from '@/lib/cache/middleware';
import { cacheInvalidation } from '@/lib/cache/utils';
import { WebhookTriggers } from '@/lib/webhooks/triggers';
import { SocialMediaService } from '@/lib/services/social-media';

// Apply caching to GET requests
const cachedGET = withApiCache(apiCacheConfigs.products)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('q') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'SCHEDULED' || undefined;
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Sorting
    const sortField = searchParams.get('sortBy') || 'createdAt';
    const sortDirection = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Build filters
    const filters = {
      search,
      categoryId,
      status,
      isActive,
      minPrice,
      maxPrice,
      tags,
      createdBy
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const sort = {
      field: sortField,
      direction: sortDirection
    };

    const result = await productRepository.findMany(filters, sort, page, limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: {
        search,
        categoryId,
        status,
        isActive,
        minPrice,
        maxPrice,
        tags,
        createdBy,
        sortBy: sortField,
        sortOrder: sortDirection
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
})

export const GET = cachedGET

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create products
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['ADMIN', 'EDITOR'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = await validateRequest(createProductSchema, body);

    const product = await productRepository.create(validatedData);

    // Trigger webhook for product created event
    await WebhookTriggers.productCreated(product);

    // Auto-share new products to social media if enabled
    try {
      const autoSharePlatforms = process.env.AUTO_SHARE_PLATFORMS?.split(',') || [];
      if (autoSharePlatforms.length > 0) {
        await SocialMediaService.shareProduct(product, autoSharePlatforms);
      }
    } catch (error) {
      console.error('Failed to auto-share product to social media:', error);
    }

    // Invalidate product caches after successful creation
    await cacheInvalidation.invalidateProductLists();
    await cacheInvalidation.invalidateSearch();

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}
