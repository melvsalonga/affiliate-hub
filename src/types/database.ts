// Database types generated from Prisma schema
import { Prisma } from '@prisma/client'

// User types
export type User = Prisma.UserGetPayload<{}>
export type UserWithProfile = Prisma.UserGetPayload<{
  include: { profile: true }
}>
export type UserProfile = Prisma.UserProfileGetPayload<{}>
export type EmailNotificationSettings = Prisma.EmailNotificationSettingsGetPayload<{}>
export type PushNotificationSettings = Prisma.PushNotificationSettingsGetPayload<{}>

// Product types
export type Product = Prisma.ProductGetPayload<{}>
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true
    creator: true
    images: true
    affiliateLinks: {
      include: {
        platform: true
        analytics: true
      }
    }
    tags: {
      include: {
        tag: true
      }
    }
    analytics: true
  }
}>
export type ProductImage = Prisma.ProductImageGetPayload<{}>
export type ProductTag = Prisma.ProductTagGetPayload<{}>
export type ProductAnalytics = Prisma.ProductAnalyticsGetPayload<{}>

// Category types
export type Category = Prisma.CategoryGetPayload<{}>
export type CategoryWithChildren = Prisma.CategoryGetPayload<{
  include: {
    children: true
    parent: true
  }
}>
export type Tag = Prisma.TagGetPayload<{}>

// Affiliate Link types
export type AffiliateLink = Prisma.AffiliateLinkGetPayload<{}>
export type AffiliateLinkWithRelations = Prisma.AffiliateLinkGetPayload<{
  include: {
    product: true
    platform: true
    analytics: true
  }
}>
export type Platform = Prisma.PlatformGetPayload<{}>
export type LinkAnalytics = Prisma.LinkAnalyticsGetPayload<{}>

// Analytics types
export type ClickEvent = Prisma.ClickEventGetPayload<{}>
export type ConversionEvent = Prisma.ConversionEventGetPayload<{}>
export type ClickEventWithRelations = Prisma.ClickEventGetPayload<{
  include: {
    affiliateLink: {
      include: {
        product: true
        platform: true
      }
    }
    conversion: true
  }
}>

// Campaign types
export type Campaign = Prisma.CampaignGetPayload<{}>
export type CampaignWithCreator = Prisma.CampaignGetPayload<{
  include: {
    creator: true
  }
}>

// Enums
export { UserRole, Theme, ProductStatus, ConversionStatus } from '@prisma/client'

// Input types for creating/updating records
export type CreateUserInput = Prisma.UserCreateInput
export type UpdateUserInput = Prisma.UserUpdateInput
export type CreateProductInput = Prisma.ProductCreateInput
export type UpdateProductInput = Prisma.ProductUpdateInput
export type CreateAffiliateLinkInput = Prisma.AffiliateLinkCreateInput
export type UpdateAffiliateLinkInput = Prisma.AffiliateLinkUpdateInput
export type CreateCategoryInput = Prisma.CategoryCreateInput
export type UpdateCategoryInput = Prisma.CategoryUpdateInput
export type CreateCampaignInput = Prisma.CampaignCreateInput
export type UpdateCampaignInput = Prisma.CampaignUpdateInput

// Where clauses for filtering
export type UserWhereInput = Prisma.UserWhereInput
export type ProductWhereInput = Prisma.ProductWhereInput
export type AffiliateLinkWhereInput = Prisma.AffiliateLinkWhereInput
export type CategoryWhereInput = Prisma.CategoryWhereInput
export type ClickEventWhereInput = Prisma.ClickEventWhereInput
export type ConversionEventWhereInput = Prisma.ConversionEventWhereInput

// Order by clauses for sorting
export type UserOrderByInput = Prisma.UserOrderByWithRelationInput
export type ProductOrderByInput = Prisma.ProductOrderByWithRelationInput
export type AffiliateLinkOrderByInput = Prisma.AffiliateLinkOrderByWithRelationInput
export type CategoryOrderByInput = Prisma.CategoryOrderByWithRelationInput
export type ClickEventOrderByInput = Prisma.ClickEventOrderByWithRelationInput
export type ConversionEventOrderByInput = Prisma.ConversionEventOrderByWithRelationInput