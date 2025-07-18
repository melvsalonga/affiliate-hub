import { NextRequest, NextResponse } from 'next/server';
import { productRepository, categoryRepository } from '@/lib/repositories/product';
import { handleApiError, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';
import { z } from 'zod';

const csvProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDescription: z.string().max(500).optional(),
  currentPrice: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  categorySlug: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'SCHEDULED']).default('DRAFT'),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  imageUrls: z.string().optional(), // Comma-separated URLs
  tags: z.string().optional(), // Comma-separated tags
});

function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'CSV file is required'
      }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'File must be a CSV'
      }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot import more than 1000 products at once'
      }, { status: 400 });
    }

    // Get all categories for slug lookup
    const categoriesResult = await categoryRepository.findMany();
    const categoryMap = new Map(
      categoriesResult.data.map(cat => [cat.slug, cat.id])
    );

    const results = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Parse and validate row data
        const parsedRow = {
          ...row,
          currentPrice: parseFloat(row.currentPrice),
          originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
        };

        const validatedData = csvProductSchema.parse(parsedRow);

        // Find category ID
        const categoryId = categoryMap.get(validatedData.categorySlug);
        if (!categoryId) {
          errors.push({
            row: i + 2, // +2 because of 0-index and header row
            data: row,
            error: `Category not found: ${validatedData.categorySlug}`
          });
          continue;
        }

        // Generate slug
        const slug = generateSlug(validatedData.title);

        // Parse images
        const images = validatedData.imageUrls
          ? validatedData.imageUrls.split(',').map((url, index) => ({
              url: url.trim(),
              alt: validatedData.title,
              isPrimary: index === 0,
              order: index
            }))
          : [];

        // Parse tags (we'll skip tag creation for now, just store as empty array)
        const tags: string[] = [];

        const productData = {
          product: {
            title: validatedData.title,
            description: validatedData.description,
            shortDescription: validatedData.shortDescription,
            currentPrice: validatedData.currentPrice,
            originalPrice: validatedData.originalPrice,
            currency: validatedData.currency,
            metaTitle: validatedData.metaTitle,
            metaDescription: validatedData.metaDescription,
            slug,
            status: validatedData.status,
            categoryId,
            createdBy: user.id
          },
          images,
          tags
        };

        const product = await productRepository.create(productData);
        results.push({
          row: i + 2,
          success: true,
          productId: product.id,
          title: product.title
        });

      } catch (error) {
        errors.push({
          row: i + 2,
          data: row,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Import completed: ${results.length} products imported, ${errors.length} failed`
    });

  } catch (error) {
    return handleApiError(error);
  }
}