import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product';
import { handleApiError, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';
import { z } from 'zod';

const statusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'SCHEDULED']),
  publishedAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional()
});

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
    const { status, publishedAt, scheduledFor } = statusUpdateSchema.parse(body);

    const updateData: any = { status };

    // Handle status-specific logic
    switch (status) {
      case 'ACTIVE':
        updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
        updateData.isActive = true;
        break;
      case 'INACTIVE':
        updateData.isActive = false;
        break;
      case 'SCHEDULED':
        if (!scheduledFor) {
          return NextResponse.json({
            success: false,
            error: 'Bad Request',
            message: 'scheduledFor is required when status is SCHEDULED'
          }, { status: 400 });
        }
        updateData.publishedAt = new Date(scheduledFor);
        updateData.isActive = false;
        break;
      case 'DRAFT':
        updateData.publishedAt = null;
        updateData.isActive = false;
        break;
    }

    const updatedProduct = await productRepository.update(id, {
      product: updateData
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct.id,
        status: updatedProduct.status,
        isActive: updatedProduct.isActive,
        publishedAt: updatedProduct.publishedAt
      },
      message: `Product status updated to ${status}`
    });

  } catch (error) {
    return handleApiError(error);
  }
}