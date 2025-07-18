import { NextRequest, NextResponse } from 'next/server';
import { tagRepository } from '@/lib/repositories/product';
import { createTagSchema } from '@/lib/validations/product';
import { handleApiError, validateRequest, authenticateRequest, checkUserPermissions, extractPaginationParams } from '@/lib/api/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const popular = searchParams.get('popular') === 'true';
    
    if (popular) {
      const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
      const tags = await tagRepository.findPopular(limit);
      
      return NextResponse.json({
        success: true,
        data: {
          tags,
          totalTags: tags.length
        }
      });
    }

    const { page, limit } = extractPaginationParams(searchParams);
    const result = await tagRepository.findMany(page, limit);

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
    const validatedData = await validateRequest(createTagSchema, body);

    const tag = await tagRepository.create(validatedData);

    return NextResponse.json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}