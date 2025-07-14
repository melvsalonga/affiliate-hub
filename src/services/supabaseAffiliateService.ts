import { supabase } from '@/utils/supabaseClient';
import { 
  AffiliateLink, 
  AffiliateLinkConfig, 
  LinkGenerationRequest, 
  LinkGenerationResponse,
  LinkAnalytics,
  LinkClick,
  LinkConversion
} from '@/types/affiliate';

class SupabaseAffiliateService {
  private configs: Map<string, AffiliateLinkConfig> = new Map();

  constructor() {
    this.initializePlatformConfigs();
  }

  private initializePlatformConfigs() {
    // Lazada affiliate configuration
    this.configs.set('lazada', {
      platform: 'lazada',
      baseUrl: 'https://www.lazada.com.ph',
      affiliateId: process.env.NEXT_PUBLIC_LAZADA_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'laz_trackid': process.env.NEXT_PUBLIC_LAZADA_TRACKING_ID || 'demo_tracking',
        'laz_vn_id': process.env.NEXT_PUBLIC_LAZADA_VN_ID || 'demo_vn',
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
      affiliateId: process.env.NEXT_PUBLIC_SHOPEE_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'af_siteid': process.env.NEXT_PUBLIC_SHOPEE_SITE_ID || 'demo_site',
        'pid': process.env.NEXT_PUBLIC_SHOPEE_PARTNER_ID || 'demo_partner',
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
      affiliateId: process.env.NEXT_PUBLIC_TIKTOK_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'partner_id': process.env.NEXT_PUBLIC_TIKTOK_PARTNER_ID || 'demo_partner',
        'tracking_id': process.env.NEXT_PUBLIC_TIKTOK_TRACKING_ID || 'demo_tracking',
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
      affiliateId: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'demo_associate',
      trackingParameters: {
        'tag': process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_ID || 'demo_associate',
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
      affiliateId: process.env.NEXT_PUBLIC_ALIEXPRESS_AFFILIATE_ID || 'demo_affiliate',
      trackingParameters: {
        'aff_trace_key': process.env.NEXT_PUBLIC_ALIEXPRESS_TRACKING_ID || 'demo_tracking',
        'terminal_id': process.env.NEXT_PUBLIC_ALIEXPRESS_TERMINAL_ID || 'demo_terminal',
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

      // Create affiliate link object for database
      const affiliateLinkData = {
        original_url: request.originalUrl,
        affiliate_url: affiliateUrl,
        platform: request.platform,
        tracking_id: trackingId,
        commission: config.commissionRate,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        is_active: true,
        tags: request.tags || [],
        notes: request.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert([affiliateLinkData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: 'Failed to save affiliate link to database'
        };
      }

      // Convert database format to application format
      const affiliateLink: AffiliateLink = {
        id: data.id,
        originalUrl: data.original_url,
        affiliateUrl: data.affiliate_url,
        platform: data.platform,
        trackingId: data.tracking_id,
        commission: data.commission,
        clicks: data.clicks,
        conversions: data.conversions,
        revenue: data.revenue,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        tags: data.tags || [],
        notes: data.notes
      };

      return {
        success: true,
        affiliateLink
      };
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get affiliate link by ID
  async getAffiliateLink(id: string): Promise<AffiliateLink | null> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return this.convertDatabaseToModel(data);
    } catch (error) {
      console.error('Error getting affiliate link:', error);
      return null;
    }
  }

  // Get all affiliate links
  async getAllAffiliateLinks(filter?: {
    platform?: string;
    isActive?: boolean;
    tags?: string[];
  }): Promise<AffiliateLink[]> {
    try {
      let query = supabase.from('affiliate_links').select('*');

      // Apply filters
      if (filter?.platform) {
        query = query.eq('platform', filter.platform);
      }
      if (filter?.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }
      if (filter?.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      return data?.map(item => this.convertDatabaseToModel(item)) || [];
    } catch (error) {
      console.error('Error getting affiliate links:', error);
      return [];
    }
  }

  // Update affiliate link
  async updateAffiliateLink(id: string, updates: Partial<AffiliateLink>): Promise<LinkGenerationResponse> {
    try {
      // Convert application format to database format
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.originalUrl) dbUpdates.original_url = updates.originalUrl;
      if (updates.affiliateUrl) dbUpdates.affiliate_url = updates.affiliateUrl;
      if (updates.platform) dbUpdates.platform = updates.platform;
      if (updates.trackingId) dbUpdates.tracking_id = updates.trackingId;
      if (updates.commission !== undefined) dbUpdates.commission = updates.commission;
      if (updates.clicks !== undefined) dbUpdates.clicks = updates.clicks;
      if (updates.conversions !== undefined) dbUpdates.conversions = updates.conversions;
      if (updates.revenue !== undefined) dbUpdates.revenue = updates.revenue;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.tags) dbUpdates.tags = updates.tags;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('affiliate_links')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: 'Failed to update affiliate link'
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Affiliate link not found'
        };
      }

      return {
        success: true,
        affiliateLink: this.convertDatabaseToModel(data)
      };
    } catch (error) {
      console.error('Error updating affiliate link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Delete affiliate link
  async deleteAffiliateLink(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return {
          success: false,
          error: 'Failed to delete affiliate link'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting affiliate link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Track link click
  async trackClick(linkId: string, clickData: Omit<LinkClick, 'id' | 'linkId' | 'timestamp'>): Promise<void> {
    try {
      // Insert click record
      const clickRecord = {
        link_id: linkId,
        user_id: clickData.userId,
        session_id: clickData.sessionId,
        ip_address: clickData.ipAddress,
        user_agent: clickData.userAgent,
        referrer: clickData.referrer,
        country: clickData.country,
        city: clickData.city,
        device: clickData.device,
        browser: clickData.browser,
        os: clickData.os,
        timestamp: new Date().toISOString()
      };

      await supabase.from('link_clicks').insert([clickRecord]);

      // Update link click count
      await supabase.rpc('increment_link_clicks', { link_id: linkId });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  // Track conversion
  async trackConversion(linkId: string, conversionData: Omit<LinkConversion, 'id' | 'linkId' | 'timestamp'>): Promise<void> {
    try {
      // Insert conversion record
      const conversionRecord = {
        link_id: linkId,
        click_id: conversionData.clickId,
        user_id: conversionData.userId,
        order_value: conversionData.orderValue,
        commission: conversionData.commission,
        conversion_type: conversionData.conversionType,
        order_id: conversionData.orderId,
        product_ids: conversionData.productIds,
        timestamp: new Date().toISOString()
      };

      await supabase.from('link_conversions').insert([conversionRecord]);

      // Update link conversion count and revenue
      await supabase.rpc('increment_link_conversions', { 
        link_id: linkId, 
        revenue_amount: conversionData.orderValue 
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // Convert database format to application model
  private convertDatabaseToModel(data: any): AffiliateLink {
    return {
      id: data.id,
      originalUrl: data.original_url,
      affiliateUrl: data.affiliate_url,
      platform: data.platform,
      trackingId: data.tracking_id,
      commission: data.commission,
      clicks: data.clicks,
      conversions: data.conversions,
      revenue: data.revenue,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      tags: data.tags || [],
      notes: data.notes
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

  private generateTrackingId(): string {
    return 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export const supabaseAffiliateService = new SupabaseAffiliateService();
export default supabaseAffiliateService;
