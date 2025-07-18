import { NextRequest, NextResponse } from 'next/server';
import { categoryRepository } from '@/lib/repositories/product';
import { createCategorySchema } from '@/lib/validations/product';
import { handleApiError, validateRequest, authenticateRequest, checkUserPermissions, extractPaginationParams } from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHierarchy = searchParams.get('hierarchy') === 'true';
    const isActive = searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const parentId = searchParams.get('parentId') || undefined;

    if (includeHierarchy) {
      // Get hierarchical categories (root categories with children)
      const categories = await categoryRepository.findHierarchy();
      
      return NextResponse.json({
        success: true,
        data: {
          categories,
          totalCategories: categories.length
        }
      });
    }

    // Get paginated categories
    const { page, limit } = extractPaginationParams(searchParams);
    
    const filters = {
      isActive,
      parentId
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const result = await categoryRepository.findMany(filters, page, limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest();
    
    if (!authenticated || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkUserPermissions(user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = await validateRequest(createCategorySchema, body);

    // Add creator information
    const categoryData = {
      ...validatedData,
      createdBy: user.id
    };

    const category = await categoryRepository.create(categoryData);

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}
