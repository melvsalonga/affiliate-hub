import { z } from 'zod'
import { ConversionStatus } from '@prisma/client'

// Platform validation schemas
export const createPlatformSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  baseUrl: z.string().url('Invalid base URL'),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  isActive: z.boolean().default(true),
})

export const updatePlatformSchema = createPlatformSchema.partial().extend({
  id: z.string().uuid('Invalid platform ID'),
})

// Affiliate Link validation schemas
export const createAffiliateLinkSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  platformId: z.string().uuid('Invalid platform ID'),
  originalUrl: z.string().url('Invalid original URL'),
  shortenedUrl: z.string().url('Invalid shortened URL').optional(),
  commission: z.number().min(0, 'Commission must be non-negative').max(1, 'Commission cannot exceed 100%'),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0, 'Priority must be non-negative').default(0),
})

export const updateAffiliateLinkSchema = createAffiliateLinkSchema.partial().extend({
  id: z.string().uuid('Invalid affiliate link ID'),
})

export const bulkAffiliateLinkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'activate', 'deactivate']),
  linkIds: z.array(z.string().uuid('Invalid link ID')).optional(),
  data: z.array(createAffiliateLinkSchema.partial()).optional(),
  filters: z.object({
    productId: z.string().uuid().optional(),
    platformId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  }).optional(),
})

// Analytics validation schemas
export const clickEventSchema = z.object({
  linkId: z.string().uuid('Invalid link ID'),
  sessionId: z.string().min(1, 'Session ID is required'),
  ipAddress: z.string().ip('Invalid IP address').optional(),
  userAgent: z.string().optional(),
  referrer: z.string().url('Invalid referrer URL').optional(),
  country: z.string().max(100, 'Country name too long').optional(),
  city: z.string().max(100, 'City name too long').optional(),
  device: z.string().max(50, 'Device name too long').optional(),
  browser: z.string().max(50, 'Browser name too long').optional(),
  os: z.string().max(50, 'OS name too long').optional(),
})

export const conversionEventSchema = z.object({
  linkId: z.string().uuid('Invalid link ID'),
  clickId: z.string().uuid('Invalid click ID').optional(),
  orderValue: z.number().positive('Order value must be positive'),
  commission: z.number().positive('Commission must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  status: z.nativeEnum(ConversionStatus).default(ConversionStatus.PENDING),
  orderId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
})

export const updateConversionEventSchema = conversionEventSchema.partial().extend({
  id: z.string().uuid('Invalid conversion event ID'),
})

// Analytics query schemas
export const analyticsDateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
})

export const analyticsFilterSchema = z.object({
  linkIds: z.array(z.string().uuid()).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  platformIds: z.array(z.string().uuid()).optional(),
  dateRange: analyticsDateRangeSchema.optional(),
  countries: z.array(z.string()).optional(),
  devices: z.array(z.string()).optional(),
  browsers: z.array(z.string()).optional(),
})

export const analyticsGroupBySchema = z.enum([
  'day', 'week', 'month', 'year',
  'link', 'product', 'platform', 'country', 'device', 'browser'
])

export const getAnalyticsSchema = z.object({
  filters: analyticsFilterSchema.optional(),
  groupBy: z.array(analyticsGroupBySchema).optional(),
  metrics: z.array(z.enum([
    'clicks', 'conversions', 'revenue', 'commission',
    'conversionRate', 'averageOrderValue', 'clickThroughRate'
  ])).default(['clicks', 'conversions', 'revenue']),
})

// Link tracking schemas
export const trackClickSchema = z.object({
  linkId: z.string().uuid('Invalid link ID'),
  sessionId: z.string().min(1, 'Session ID is required'),
  metadata: z.object({
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    ipAddress: z.string().optional(),
  }).optional(),
})

export const trackConversionSchema = z.object({
  linkId: z.string().uuid('Invalid link ID'),
  clickId: z.string().uuid('Invalid click ID').optional(),
  orderValue: z.number().positive('Order value must be positive'),
  orderId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  metadata: z.object({
    currency: z.string().length(3).default('USD'),
    commission: z.number().positive().optional(),
  }).optional(),
})

// Campaign validation schemas
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  targetRevenue: z.number().positive('Target revenue must be positive').optional(),
  isActive: z.boolean().default(true),
}).refine(data => !data.endDate || data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
})

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  id: z.string().uuid('Invalid campaign ID'),
})

// Type inference
export type CreatePlatformInput = z.infer<typeof createPlatformSchema>
export type UpdatePlatformInput = z.infer<typeof updatePlatformSchema>
export type CreateAffiliateLinkInput = z.infer<typeof createAffiliateLinkSchema>
export type UpdateAffiliateLinkInput = z.infer<typeof updateAffiliateLinkSchema>
export type BulkAffiliateLinkOperationInput = z.infer<typeof bulkAffiliateLinkOperationSchema>
export type ClickEventInput = z.infer<typeof clickEventSchema>
export type ConversionEventInput = z.infer<typeof conversionEventSchema>
export type UpdateConversionEventInput = z.infer<typeof updateConversionEventSchema>
export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>
export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>
export type GetAnalyticsInput = z.infer<typeof getAnalyticsSchema>
export type TrackClickInput = z.infer<typeof trackClickSchema>
export type TrackConversionInput = z.infer<typeof trackConversionSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>