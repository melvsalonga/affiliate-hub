import { NextRequest, NextResponse } from 'next/server';
import { categoryRepository } from '@/lib/repositories/product';
import { updateCategorySchema } from '@/lib/validations/product';
import { handleApiError, validateRequest, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get('includeChildren') === 'true';

    let category;
    
    if (includeChildren) {
      category = await categoryRepository.findWithChildren(id);
    } else {
      category = await categoryRepository.findById(id);
    }

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Not Found',
        message: `Category with ID "${id}" does not exist`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: category
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest();
    
    if (!authenticated || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkUserPermissions(user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = await validateRequest(updateCategorySchema, body);

    const updatedCategory = await categoryRepository.update(id, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest();
    
    if (!authenticated || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkUserPermissions(user.id, ['ADMIN']);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = params;
    
    // Check if category has children or products
    const categoryWithChildren = await categoryRepository.findWithChildren(id);
    if (categoryWithChildren?.children && categoryWithChildren.children.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Conflict',
        message: 'Cannot delete category with subcategories. Please delete or move subcategories first.'
      }, { status: 409 });
    }

    await categoryRepository.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
}