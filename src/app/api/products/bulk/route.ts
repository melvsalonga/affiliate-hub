import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product';
import { handleApiError, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
  productIds: z.array(z.string().uuid()),
  updates: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'SCHEDULED']).optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
  })
});

const bulkDeleteSchema = z.object({
  productIds: z.array(z.string().uuid())
});

export async function PUT(request: NextRequest) {
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
    const { productIds, updates } = bulkUpdateSchema.parse(body);

    if (productIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'No product IDs provided'
      }, { status: 400 });
    }

    if (productIds.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot update more than 100 products at once'
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const productId of productIds) {
      try {
        const updatedProduct = await productRepository.update(productId, {
          product: updates
        });
        results.push({ id: productId, success: true, product: updatedProduct });
      } catch (error) {
        errors.push({ 
          id: productId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Bulk update completed: ${results.length} updated, ${errors.length} failed`
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest();
    
    if (!authenticated || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkUserPermissions(user.id, ['ADMIN']);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { productIds } = bulkDeleteSchema.parse(body);

    if (productIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'No product IDs provided'
      }, { status: 400 });
    }

    if (productIds.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot delete more than 50 products at once'
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const productId of productIds) {
      try {
        await productRepository.delete(productId);
        results.push({ id: productId, success: true });
      } catch (error) {
        errors.push({ 
          id: productId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        deleted: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Bulk delete completed: ${results.length} deleted, ${errors.length} failed`
    });

  } catch (error) {
    return handleApiError(error);
  }
}