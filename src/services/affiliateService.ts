import { 
  AffiliateLink, 
  AffiliateLinkConfig, 
  LinkGenerationRequest, 
  LinkGenerationResponse,
  LinkAnalytics,
  BulkLinkOperation,
  BulkLinkResult,
  LinkClick,
  LinkConversion
} from '@/types/affiliate';

class AffiliateService {
  private configs: Map<string, AffiliateLinkConfig> = new Map();
  private links: Map<string, AffiliateLink> = new Map();
  private clicks: Map<string, LinkClick[]> = new Map();
  private conversions: Map<string, LinkConversion[]> = new Map();

  constructor() {
    this.initializePlatformConfigs();
    this.loadLinksFromStorage();
  }

  private initializePlatformConfigs() {
    // Lazada affiliate configuration
    this.configs.set('lazada', {
      platform: 'lazada',
      baseUrl: 'https://www.lazada.com.ph',
      affiliateId: process.env.LAZADA_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'laz_trackid': process.env.LAZADA_TRACKING_ID || 'demo_tracking',
        'laz_vn_id': process.env.LAZADA_VN_ID || 'demo_vn',
      },
      commissionRate: 0.05, // 5% commission
      linkFormat: '{baseUrl}{originalPath}?{trackingParams}',
      validationRules: [
        {
          field: 'originalUrl',
          pattern: '^https?://.*lazada\\.com\\.ph.*',
          message: 'URL must be from Lazada Philippines'
        }
      ]
    });

    // Shopee affiliate configuration
    this.configs.set('shopee', {
      platform: 'shopee',
      baseUrl: 'https://shopee.ph',
      affiliateId: process.env.SHOPEE_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'af_siteid': process.env.SHOPEE_SITE_ID || 'demo_site',
        'pid': process.env.SHOPEE_PARTNER_ID || 'demo_partner',
      },
      commissionRate: 0.04, // 4% commission
      linkFormat: '{baseUrl}{originalPath}?{trackingParams}',
      validationRules: [
        {
          field: 'originalUrl',
          pattern: '^https?://.*shopee\\.ph.*',
          message: 'URL must be from Shopee Philippines'
        }
      ]
    });

    // TikTok Shop affiliate configuration
    this.configs.set('tiktok', {
      platform: 'tiktok',
      baseUrl: 'https://shop.tiktok.com',
      affiliateId: process.env.TIKTOK_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'partner_id': process.env.TIKTOK_PARTNER_ID || 'demo_partner',
        'tracking_id': process.env.TIKTOK_TRACKING_ID || 'demo_tracking',
      },
      commissionRate: 0.08, // 8% commission
      linkFormat: '{baseUrl}{originalPath}?{trackingParams}',
      validationRules: [
        {
          field: 'originalUrl',
          pattern: '^https?://.*tiktok\\.com.*',
          message: 'URL must be from TikTok Shop'
        }
      ]
    });

    // Amazon affiliate configuration
    this.configs.set('amazon', {
      platform: 'amazon',
      baseUrl: 'https://amazon.com',
      affiliateId: process.env.AMAZON_ASSOCIATE_ID || 'demo_associate',
      trackingParameters: {
        'tag': process.env.AMAZON_ASSOCIATE_ID || 'demo_associate',
        'linkCode': 'as2',
        'camp': '1789',
        'creative': '9325',
      },
      commissionRate: 0.06, // 6% commission
      linkFormat: '{baseUrl}{originalPath}?{trackingParams}',
      validationRules: [
        {
          field: 'originalUrl',
          pattern: '^https?://.*amazon\\.com.*',
          message: 'URL must be from Amazon'
        }
      ]
    });

    // AliExpress affiliate configuration
    this.configs.set('aliexpress', {
      platform: 'aliexpress',
      baseUrl: 'https://aliexpress.com',
      affiliateId: process.env.ALIEXPRESS_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'aff_trace_key': process.env.ALIEXPRESS_TRACKING_ID || 'demo_tracking',
        'terminal_id': process.env.ALIEXPRESS_TERMINAL_ID || 'demo_terminal',
      },
      commissionRate: 0.05, // 5% commission
      linkFormat: '{baseUrl}{originalPath}?{trackingParams}',
      validationRules: [
        {
          field: 'originalUrl',
          pattern: '^https?://.*aliexpress\\.com.*',
          message: 'URL must be from AliExpress'
        }
      ]
    });
  }

  private loadLinksFromStorage() {
    try {
      // Only run on client side
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('affiliate_links');
        if (stored) {
          const linksData = JSON.parse(stored);
          linksData.forEach((link: any) => {
            this.links.set(link.id, {
              ...link,
              createdAt: new Date(link.createdAt),
              updatedAt: new Date(link.updatedAt),
              expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading affiliate links from storage:', error);
    }
  }

  private saveLinksToStorage() {
    try {
      // Only run on client side
      if (typeof window !== 'undefined' && window.localStorage) {
        const linksArray = Array.from(this.links.values());
        localStorage.setItem('affiliate_links', JSON.stringify(linksArray));
      }
    } catch (error) {
      console.error('Error saving affiliate links to storage:', error);
    }
  }

  // Generate affiliate link
  async generateAffiliateLink(request: LinkGenerationRequest): Promise<LinkGenerationResponse> {
    try {
      const config = this.configs.get(request.platform);
      if (!config) {
        return {
          success: false,
          error: `Platform ${request.platform} is not supported`
        };
      }

      // Validate the original URL
      const validationResult = this.validateUrl(request.originalUrl, config);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.message
        };
      }

      // Generate tracking ID if not provided
      const trackingId = request.trackingId || this.generateTrackingId();

      // Create affiliate URL
      const affiliateUrl = this.buildAffiliateUrl(request.originalUrl, config, trackingId, request.customParameters);

      // Create affiliate link object
      const affiliateLink: AffiliateLink = {
        id: this.generateLinkId(),
        originalUrl: request.originalUrl,
        affiliateUrl,
        platform: request.platform,
        trackingId,
        commission: config.commissionRate,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: request.tags || [],
        notes: request.notes
      };

      // Store the link
      this.links.set(affiliateLink.id, affiliateLink);
      this.saveLinksToStorage();

      return {
        success: true,
        affiliateLink
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get affiliate link by ID
  getAffiliateLink(id: string): AffiliateLink | undefined {
    return this.links.get(id);
  }

  // Get all affiliate links
  getAllAffiliateLinks(filter?: {
    platform?: string;
    isActive?: boolean;
    tags?: string[];
  }): AffiliateLink[] {
    let links = Array.from(this.links.values());

    if (filter) {
      if (filter.platform) {
        links = links.filter(link => link.platform === filter.platform);
      }
      if (filter.isActive !== undefined) {
        links = links.filter(link => link.isActive === filter.isActive);
      }
      if (filter.tags && filter.tags.length > 0) {
        links = links.filter(link => 
          link.tags?.some(tag => filter.tags!.includes(tag))
        );
      }
    }

    return links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Update affiliate link
  async updateAffiliateLink(id: string, updates: Partial<AffiliateLink>): Promise<LinkGenerationResponse> {
    try {
      const existingLink = this.links.get(id);
      if (!existingLink) {
        return {
          success: false,
          error: 'Affiliate link not found'
        };
      }

      const updatedLink: AffiliateLink = {
        ...existingLink,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date()
      };

      this.links.set(id, updatedLink);
      this.saveLinksToStorage();

      return {
        success: true,
        affiliateLink: updatedLink
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Delete affiliate link
  async deleteAffiliateLink(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = this.links.delete(id);
      if (!deleted) {
        return {
          success: false,
          error: 'Affiliate link not found'
        };
      }

      this.saveLinksToStorage();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Track link click
  async trackClick(linkId: string, clickData: Omit<LinkClick, 'id' | 'linkId' | 'timestamp'>): Promise<void> {
    const link = this.links.get(linkId);
    if (!link) return;

    const click: LinkClick = {
      id: this.generateClickId(),
      linkId,
      timestamp: new Date(),
      ...clickData
    };

    // Store click
    if (!this.clicks.has(linkId)) {
      this.clicks.set(linkId, []);
    }
    this.clicks.get(linkId)!.push(click);

    // Update link click count
    link.clicks += 1;
    link.updatedAt = new Date();
    this.links.set(linkId, link);
    this.saveLinksToStorage();
  }

  // Track conversion
  async trackConversion(linkId: string, conversionData: Omit<LinkConversion, 'id' | 'linkId' | 'timestamp'>): Promise<void> {
    const link = this.links.get(linkId);
    if (!link) return;

    const conversion: LinkConversion = {
      id: this.generateConversionId(),
      linkId,
      timestamp: new Date(),
      ...conversionData
    };

    // Store conversion
    if (!this.conversions.has(linkId)) {
      this.conversions.set(linkId, []);
    }
    this.conversions.get(linkId)!.push(conversion);

    // Update link stats
    link.conversions += 1;
    link.revenue += conversionData.orderValue;
    link.updatedAt = new Date();
    this.links.set(linkId, link);
    this.saveLinksToStorage();
  }

  // Get link analytics
  getLinkAnalytics(linkId: string): LinkAnalytics | null {
    const link = this.links.get(linkId);
    if (!link) return null;

    const clicks = this.clicks.get(linkId) || [];
    const conversions = this.conversions.get(linkId) || [];

    // Calculate analytics
    const uniqueClicks = new Set(clicks.map(c => c.sessionId)).size;
    const conversionRate = clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0;
    const totalRevenue = conversions.reduce((sum, c) => sum + c.orderValue, 0);
    const totalCommission = conversions.reduce((sum, c) => sum + c.commission, 0);

    // Group clicks by date
    const clicksByDate: Record<string, number> = {};
    clicks.forEach(click => {
      const date = click.timestamp.toISOString().split('T')[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;
    });

    // Group conversions by date
    const conversionsByDate: Record<string, number> = {};
    conversions.forEach(conversion => {
      const date = conversion.timestamp.toISOString().split('T')[0];
      conversionsByDate[date] = (conversionsByDate[date] || 0) + 1;
    });

    // Top referrers
    const referrerMap: Record<string, { clicks: number; conversions: number }> = {};
    clicks.forEach(click => {
      const referrer = click.referrer || 'Direct';
      if (!referrerMap[referrer]) {
        referrerMap[referrer] = { clicks: 0, conversions: 0 };
      }
      referrerMap[referrer].clicks += 1;
    });

    conversions.forEach(conversion => {
      const click = clicks.find(c => c.id === conversion.clickId);
      if (click) {
        const referrer = click.referrer || 'Direct';
        if (referrerMap[referrer]) {
          referrerMap[referrer].conversions += 1;
        }
      }
    });

    const topReferrers = Object.entries(referrerMap)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.clicks - a.clicks);

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    clicks.forEach(click => {
      deviceBreakdown[click.device] = (deviceBreakdown[click.device] || 0) + 1;
    });

    // Location breakdown
    const locationBreakdown: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.country) {
        locationBreakdown[click.country] = (locationBreakdown[click.country] || 0) + 1;
      }
    });

    return {
      linkId,
      totalClicks: clicks.length,
      uniqueClicks,
      conversions: conversions.length,
      conversionRate,
      revenue: totalRevenue,
      commission: totalCommission,
      clicksByDate,
      conversionsByDate,
      topReferrers,
      deviceBreakdown,
      locationBreakdown
    };
  }

  // Helper methods
  private validateUrl(url: string, config: AffiliateLinkConfig): { isValid: boolean; message?: string } {
    for (const rule of config.validationRules) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(url)) {
        return { isValid: false, message: rule.message };
      }
    }
    return { isValid: true };
  }

  private buildAffiliateUrl(originalUrl: string, config: AffiliateLinkConfig, trackingId: string, customParams?: Record<string, string>): string {
    const url = new URL(originalUrl);
    
    // Add tracking parameters
    Object.entries(config.trackingParameters).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    // Add custom parameters
    if (customParams) {
      Object.entries(customParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // Add tracking ID
    url.searchParams.set('tracking_id', trackingId);

    return url.toString();
  }

  private generateLinkId(): string {
    return 'link_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateTrackingId(): string {
    return 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateClickId(): string {
    return 'click_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateConversionId(): string {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const affiliateService = new AffiliateService();
export default affiliateService;
