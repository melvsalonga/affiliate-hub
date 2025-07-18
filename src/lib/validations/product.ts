import { z } from 'zod'
import { ProductStatus } from '@prisma/client'

// Product validation schemas
export const productStatusSchema = z.nativeEnum(ProductStatus)

export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  shortDescription: z.string().max(500, 'Short description too long').optional(),
  currentPrice: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive('Original price must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  metaTitle: z.string().max(60, 'Meta title too long').optional(),
  metaDescription: z.string().max(160, 'Meta description too long').optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  status: productStatusSchema.default(ProductStatus.DRAFT),
  isActive: z.boolean().default(true),
  categoryId: z.string().uuid('Invalid category ID'),
  publishedAt: z.date().optional(),
})

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid('Invalid product ID'),
})

export const productImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  alt: z.string().min(1, 'Alt text is required').max(200, 'Alt text too long'),
  isPrimary: z.boolean().default(false),
  order: z.number().int().min(0, 'Order must be non-negative').default(0),
})

export const createProductWithImagesSchema = z.object({
  product: createProductSchema,
  images: z.array(productImageSchema).min(1, 'At least one image is required'),
  tags: z.array(z.string().uuid('Invalid tag ID')).optional(),
})

export const updateProductWithImagesSchema = z.object({
  product: updateProductSchema,
  images: z.array(productImageSchema.extend({ id: z.string().uuid().optional() })).optional(),
  tags: z.array(z.string().uuid('Invalid tag ID')).optional(),
})

export const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  status: productStatusSchema.optional(),
  isActive: z.boolean().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  search: z.string().optional(),
  tags: z.array(z.string().uuid()).optional(),
  createdBy: z.string().uuid().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
})

export const productSortSchema = z.object({
  field: z.enum(['title', 'currentPrice', 'createdAt', 'updatedAt', 'publishedAt']),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
})

export const getProductsSchema = z.object({
  filters: productFilterSchema.optional(),
  sort: productSortSchema.optional(),
  pagination: paginationSchema.optional(),
})

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid('Invalid parent category ID').optional(),
  order: z.number().int().min(0, 'Order must be non-negative').default(0),
  isActive: z.boolean().default(true),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid('Invalid category ID'),
})

// Tag validation schemas
export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
})

export const updateTagSchema = createTagSchema.partial().extend({
  id: z.string().uuid('Invalid tag ID'),
})

// Type inference
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductImageInput = z.infer<typeof productImageSchema>
export type CreateProductWithImagesInput = z.infer<typeof createProductWithImagesSchema>
export type UpdateProductWithImagesInput = z.infer<typeof updateProductWithImagesSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>
export type ProductSortInput = z.infer<typeof productSortSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type GetProductsInput = z.infer<typeof getProductsSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>