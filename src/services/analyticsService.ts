export interface ClickEvent {
  id: string;
  productId: string;
  productName: string;
  platform: string;
  action: 'view' | 'affiliate_click' | 'search_result_click';
  timestamp: Date;
  sessionId: string;
  userAgent: string;
  referrer?: string;
  searchTerm?: string;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  platform: string;
  totalViews: number;
  totalAffiliateClicks: number;
  clickThroughRate: number;
  lastViewed: Date;
  firstViewed: Date;
}

export interface PlatformAnalytics {
  platform: string;
  totalProducts: number;
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number;
  averagePrice: number;
}

export interface SearchAnalytics {
  searchTerm: string;
  count: number;
  resultsFound: number;
  clickThroughRate: number;
  lastSearched: Date;
}

export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  pageViews: number;
  productViews: number;
  affiliateClicks: number;
  searchQueries: number;
  userAgent: string;
}

class AnalyticsService {
  private readonly STORAGE_KEYS = {
    CLICK_EVENTS: 'analytics_click_events',
    SESSIONS: 'analytics_sessions',
    CURRENT_SESSION: 'analytics_current_session'
  };

  private currentSessionId: string;

  constructor() {
    this.currentSessionId = this.initializeSession();
  }

  // Initialize or get current session
  private initializeSession(): string {
    const existingSession = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
    const sessionData = existingSession ? JSON.parse(existingSession) : null;
    
    // Check if session is still valid (less than 30 minutes old)
    if (sessionData && new Date().getTime() - new Date(sessionData.startTime).getTime() < 30 * 60 * 1000) {
      return sessionData.sessionId;
    }

    // Create new session
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: SessionData = {
      sessionId: newSessionId,
      startTime: new Date(),
      pageViews: 0,
      productViews: 0,
      affiliateClicks: 0,
      searchQueries: 0,
      userAgent: navigator.userAgent
    };

    localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(newSession));
    this.saveSession(newSession);
    
    return newSessionId;
  }

  // Track product view
  trackProductView(productId: string, productName: string, platform: string, referrer?: string): void {
    const event: ClickEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName,
      platform,
      action: 'view',
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      userAgent: navigator.userAgent,
      referrer
    };

    this.saveClickEvent(event);
    this.updateSessionStats('productViews');
  }

  // Track affiliate link click
  trackAffiliateClick(productId: string, productName: string, platform: string, affiliateUrl: string): void {
    const event: ClickEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName,
      platform,
      action: 'affiliate_click',
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      userAgent: navigator.userAgent,
      referrer: window.location.href
    };

    this.saveClickEvent(event);
    this.updateSessionStats('affiliateClicks');
  }

  // Track search
  trackSearch(searchTerm: string, resultsCount: number): void {
    const event: ClickEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: 'search',
      productName: `Search: ${searchTerm}`,
      platform: 'search',
      action: 'search_result_click',
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      userAgent: navigator.userAgent,
      searchTerm
    };

    this.saveClickEvent(event);
    this.updateSessionStats('searchQueries');
  }

  // Track page view
  trackPageView(): void {
    this.updateSessionStats('pageViews');
  }

  // Get product analytics
  getProductAnalytics(): ProductAnalytics[] {
    const events = this.getClickEvents();
    const productStats = new Map<string, {
      productId: string;
      productName: string;
      platform: string;
      views: number;
      clicks: number;
      firstViewed: Date;
      lastViewed: Date;
    }>();

    events.forEach(event => {
      if (event.action === 'view' || event.action === 'affiliate_click') {
        const key = event.productId;
        const existing = productStats.get(key);

        if (existing) {
          if (event.action === 'view') existing.views++;
          if (event.action === 'affiliate_click') existing.clicks++;
          
          if (new Date(event.timestamp) > existing.lastViewed) {
            existing.lastViewed = new Date(event.timestamp);
          }
          if (new Date(event.timestamp) < existing.firstViewed) {
            existing.firstViewed = new Date(event.timestamp);
          }
        } else {
          productStats.set(key, {
            productId: event.productId,
            productName: event.productName,
            platform: event.platform,
            views: event.action === 'view' ? 1 : 0,
            clicks: event.action === 'affiliate_click' ? 1 : 0,
            firstViewed: new Date(event.timestamp),
            lastViewed: new Date(event.timestamp)
          });
        }
      }
    });

    return Array.from(productStats.values()).map(stats => ({
      productId: stats.productId,
      productName: stats.productName,
      platform: stats.platform,
      totalViews: stats.views,
      totalAffiliateClicks: stats.clicks,
      clickThroughRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0,
      lastViewed: stats.lastViewed,
      firstViewed: stats.firstViewed
    })).sort((a, b) => b.totalViews - a.totalViews);
  }

  // Get platform analytics
  getPlatformAnalytics(): PlatformAnalytics[] {
    const events = this.getClickEvents();
    const products = this.getProducts();
    const platformStats = new Map<string, {
      views: number;
      clicks: number;
      productIds: Set<string>;
    }>();

    events.forEach(event => {
      if (event.action === 'view' || event.action === 'affiliate_click') {
        const existing = platformStats.get(event.platform) || {
          views: 0,
          clicks: 0,
          productIds: new Set()
        };

        if (event.action === 'view') existing.views++;
        if (event.action === 'affiliate_click') existing.clicks++;
        existing.productIds.add(event.productId);

        platformStats.set(event.platform, existing);
      }
    });

    return Array.from(platformStats.entries()).map(([platform, stats]) => {
      const platformProducts = products.filter(p => p.platform?.id === platform);
      const averagePrice = platformProducts.length > 0 
        ? platformProducts.reduce((sum, p) => sum + p.price, 0) / platformProducts.length 
        : 0;

      return {
        platform,
        totalProducts: stats.productIds.size,
        totalViews: stats.views,
        totalClicks: stats.clicks,
        clickThroughRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0,
        averagePrice
      };
    }).sort((a, b) => b.totalViews - a.totalViews);
  }

  // Get search analytics
  getSearchAnalytics(): SearchAnalytics[] {
    const events = this.getClickEvents();
    const searchStats = new Map<string, {
      count: number;
      clicks: number;
      lastSearched: Date;
    }>();

    events.forEach(event => {
      if (event.searchTerm) {
        const term = event.searchTerm.toLowerCase();
        const existing = searchStats.get(term) || {
          count: 0,
          clicks: 0,
          lastSearched: new Date(event.timestamp)
        };

        existing.count++;
        if (event.action === 'affiliate_click') existing.clicks++;
        if (new Date(event.timestamp) > existing.lastSearched) {
          existing.lastSearched = new Date(event.timestamp);
        }

        searchStats.set(term, existing);
      }
    });

    return Array.from(searchStats.entries()).map(([searchTerm, stats]) => ({
      searchTerm,
      count: stats.count,
      resultsFound: 0, // We'd need to track this separately
      clickThroughRate: stats.count > 0 ? (stats.clicks / stats.count) * 100 : 0,
      lastSearched: stats.lastSearched
    })).sort((a, b) => b.count - a.count);
  }

  // Get session analytics
  getSessionAnalytics(): SessionData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      return stored ? JSON.parse(stored).map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined
      })) : [];
    } catch (error) {
      console.error('Error loading session analytics:', error);
      return [];
    }
  }

  // Get overall stats
  getOverallStats() {
    const events = this.getClickEvents();
    const sessions = this.getSessionAnalytics();
    const products = this.getProducts();

    const totalViews = events.filter(e => e.action === 'view').length;
    const totalClicks = events.filter(e => e.action === 'affiliate_click').length;
    const totalSessions = sessions.length;
    const totalProducts = products.length;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentEvents = events.filter(e => new Date(e.timestamp) > last7Days);
    const recentViews = recentEvents.filter(e => e.action === 'view').length;
    const recentClicks = recentEvents.filter(e => e.action === 'affiliate_click').length;

    return {
      totalViews,
      totalClicks,
      totalSessions,
      totalProducts,
      overallClickThroughRate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
      last7DaysViews: recentViews,
      last7DaysClicks: recentClicks,
      last7DaysClickThroughRate: recentViews > 0 ? (recentClicks / recentViews) * 100 : 0
    };
  }

  // Export analytics data
  exportAnalytics(format: 'json' | 'csv' = 'json') {
    const data = {
      products: this.getProductAnalytics(),
      platforms: this.getPlatformAnalytics(),
      searches: this.getSearchAnalytics(),
      sessions: this.getSessionAnalytics(),
      overall: this.getOverallStats(),
      events: this.getClickEvents(),
      exportedAt: new Date()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format for products
    const csvHeaders = 'Product ID,Product Name,Platform,Total Views,Total Clicks,Click Through Rate,First Viewed,Last Viewed\n';
    const csvRows = data.products.map(p => 
      `"${p.productId}","${p.productName}","${p.platform}",${p.totalViews},${p.totalAffiliateClicks},${p.clickThroughRate.toFixed(2)},${p.firstViewed.toISOString()},${p.lastViewed.toISOString()}`
    ).join('\n');

    return csvHeaders + csvRows;
  }

  // Clear analytics data
  clearAnalytics(): void {
    localStorage.removeItem(this.STORAGE_KEYS.CLICK_EVENTS);
    localStorage.removeItem(this.STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_SESSION);
    this.currentSessionId = this.initializeSession();
  }

  // Private helper methods
  private saveClickEvent(event: ClickEvent): void {
    try {
      const existing = this.getClickEvents();
      existing.push(event);
      
      // Keep only last 1000 events to prevent storage overflow
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.CLICK_EVENTS, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving click event:', error);
    }
  }

  private getClickEvents(): ClickEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CLICK_EVENTS);
      return stored ? JSON.parse(stored).map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      })) : [];
    } catch (error) {
      console.error('Error loading click events:', error);
      return [];
    }
  }

  private saveSession(session: SessionData): void {
    try {
      const existing = this.getSessionAnalytics();
      const index = existing.findIndex(s => s.sessionId === session.sessionId);
      
      if (index >= 0) {
        existing[index] = session;
      } else {
        existing.push(session);
      }
      
      // Keep only last 100 sessions
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private updateSessionStats(stat: keyof Pick<SessionData, 'pageViews' | 'productViews' | 'affiliateClicks' | 'searchQueries'>): void {
    try {
      const currentSessionData = localStorage.getItem(this.STORAGE_KEYS.CURRENT_SESSION);
      if (currentSessionData) {
        const session: SessionData = JSON.parse(currentSessionData);
        session[stat]++;
        session.endTime = new Date();
        
        localStorage.setItem(this.STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
        this.saveSession(session);
      }
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }

  private getProducts() {
    try {
      const stored = localStorage.getItem('admin_products');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
