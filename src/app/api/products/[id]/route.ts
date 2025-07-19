import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/repositories/product';
import { updateProductSchema } from '@/lib/validations/product';
import { handleApiError, validateRequest, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';
import { WebhookTriggers } from '@/lib/webhooks/triggers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await productRepository.findWithRelations(id);

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Not Found',
        message: `Product with ID "${id}" does not exist`
      }, { status: 404 });
    }

    // Get related products (same category, different products)
    const relatedProducts = await productRepository.findByCategory(product.categoryId, 1, 4);
    const filteredRelated = relatedProducts.data.filter(p => p.id !== product.id);

    return NextResponse.json({
      success: true,
      data: {
        product,
        relatedProducts: filteredRelated,
        metadata: {
          category: product.category.name,
          categorySlug: product.category.slug,
          lastUpdated: product.updatedAt,
          status: product.status,
          isActive: product.isActive,
          totalImages: product.images.length,
          totalAffiliateLinks: product.affiliateLinks.length,
          totalTags: product.tags.length
        }
      }
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
    const validatedData = await validateRequest(updateProductSchema, body);

    // Get original product for comparison
    const originalProduct = await productRepository.findById(id);
    if (!originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = await productRepository.update(id, validatedData);

    // Trigger webhook for product updated event
    const changes = Object.keys(validatedData).reduce((acc, key) => {
      const oldValue = originalProduct[key as keyof typeof originalProduct];
      const newValue = validatedData[key as keyof typeof validatedData];
      if (oldValue !== newValue) {
        acc[key] = { from: oldValue, to: newValue };
      }
      return acc;
    }, {} as Record<string, any>);

    if (Object.keys(changes).length > 0) {
      await WebhookTriggers.productUpdated(updatedProduct, changes);
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
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
    
    // Get product data before deletion for webhook
    const productToDelete = await productRepository.findById(id);
    if (!productToDelete) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await productRepository.delete(id);

    // Trigger webhook for product deleted event
    await WebhookTriggers.productDeleted(id, {
      title: productToDelete.title,
      slug: productToDelete.slug,
      status: productToDelete.status,
      categoryId: productToDelete.categoryId,
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
}
