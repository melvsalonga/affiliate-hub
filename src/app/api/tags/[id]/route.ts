import { NextRequest, NextResponse } from 'next/server';
import { tagRepository } from '@/lib/repositories/product';
import { updateTagSchema } from '@/lib/validations/product';
import { handleApiError, validateRequest, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tag = await tagRepository.findById(id);

    if (!tag) {
      return NextResponse.json({
        success: false,
        error: 'Not Found',
        message: `Tag with ID "${id}" does not exist`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tag
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
    const validatedData = await validateRequest(updateTagSchema, body);

    const updatedTag = await tagRepository.update(id, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedTag,
      message: 'Tag updated successfully'
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
    await tagRepository.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
}