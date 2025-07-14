// Affiliate link management types

export interface AffiliateLink {
  id: string;
  originalUrl: string;
  affiliateUrl: string;
  shortUrl?: string;
  platform: string;
  productId?: string;
  trackingId: string;
  commission: number;
  clicks: number;
  conversions: number;
  revenue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  tags?: string[];
  notes?: string;
}

export interface AffiliateLinkConfig {
  platform: string;
  baseUrl: string;
  affiliateId: string;
  trackingParameters: Record<string, string>;
  commissionRate: number;
  linkFormat: string;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  pattern: string;
  message: string;
}

export interface LinkGenerationRequest {
  originalUrl: string;
  platform: string;
  trackingId?: string;
  customParameters?: Record<string, string>;
  tags?: string[];
  notes?: string;
}

export interface LinkGenerationResponse {
  success: boolean;
  affiliateLink?: AffiliateLink;
  error?: string;
  warnings?: string[];
}

export interface LinkAnalytics {
  linkId: string;
  totalClicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  commission: number;
  clicksByDate: Record<string, number>;
  conversionsByDate: Record<string, number>;
  topReferrers: Array<{
    source: string;
    clicks: number;
    conversions: number;
  }>;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
}

export interface BulkLinkOperation {
  operation: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  links: Array<{
    id?: string;
    originalUrl?: string;
    platform?: string;
    trackingId?: string;
    tags?: string[];
    notes?: string;
  }>;
  options?: {
    skipValidation?: boolean;
    continueOnError?: boolean;
  };
}

export interface BulkLinkResult {
  success: boolean;
  processed: number;
  errors: Array<{
    index: number;
    error: string;
    item: any;
  }>;
  results: AffiliateLink[];
}

// Platform-specific affiliate configurations
export interface LazadaAffiliateConfig {
  publisherId: string;
  siteId: string;
  trackingId: string;
  commissionRate: number;
}

export interface ShopeeAffiliateConfig {
  partnerId: string;
  trackingId: string;
  commissionRate: number;
}

export interface TikTokAffiliateConfig {
  partnerId: string;
  trackingId: string;
  commissionRate: number;
}

export interface AmazonAffiliateConfig {
  associateId: string;
  trackingId: string;
  region: string;
  commissionRate: number;
}

export interface AliExpressAffiliateConfig {
  trackingId: string;
  appKey: string;
  commissionRate: number;
}

// Link tracking and analytics
export interface LinkClick {
  id: string;
  linkId: string;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  timestamp: Date;
  country?: string;
  city?: string;
  device: string;
  browser: string;
  os: string;
}

export interface LinkConversion {
  id: string;
  linkId: string;
  clickId: string;
  userId?: string;
  orderValue: number;
  commission: number;
  conversionType: 'purchase' | 'signup' | 'lead';
  timestamp: Date;
  orderId?: string;
  productIds?: string[];
}

// Campaign management
export interface AffiliateCampaign {
  id: string;
  name: string;
  description?: string;
  links: string[];
  startDate: Date;
  endDate?: Date;
  budget?: number;
  targetRevenue?: number;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
  averageOrderValue: number;
  costPerClick?: number;
  returnOnAdSpend?: number;
  linkPerformance: Array<{
    linkId: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}
