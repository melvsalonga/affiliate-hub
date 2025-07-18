// Export all validation schemas and types
export * from './user'
export * from './product'
export * from './affiliate'

// Common validation utilities
import { z } from 'zod'

// Common schemas
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const emailSchema = z.string().email('Invalid email address')
export const urlSchema = z.string().url('Invalid URL format')
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
})

// Sort schema
export const sortSchema = z.object({
  field: z.string().min(1, 'Sort field is required'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

// Search schema
export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  sort: sortSchema.optional(),
  pagination: paginationSchema.optional(),
})

// API response schemas
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional(),
})

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  data: z.array(dataSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
})

// Type inference for common schemas
export type PaginationInput = z.infer<typeof paginationSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type SortInput = z.infer<typeof sortSchema>
export type SearchInput = z.infer<typeof searchSchema>

// Validation error handling
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Validation helper functions
export function validateUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success
}

export function validateEmail(value: string): boolean {
  return emailSchema.safeParse(value).success
}

export function validateUrl(value: string): boolean {
  return urlSchema.safeParse(value).success
}

export function validateSlug(value: string): boolean {
  return slugSchema.safeParse(value).success
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Schema validation wrapper
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.errors[0]
    throw new ValidationError(
      firstError.message,
      firstError.path.join('.'),
      firstError.code
    )
  }
  return result.data
}