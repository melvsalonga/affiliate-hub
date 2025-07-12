// LocalStorage utilities for user data management
import { UserPreferences, UserFavorite, PriceAlert, ClickEvent } from '@/types/product';

// Storage keys
const STORAGE_KEYS = {
  USER_PREFERENCES: 'affiliate_hub_user_preferences',
  USER_FAVORITES: 'affiliate_hub_user_favorites',
  PRICE_ALERTS: 'affiliate_hub_price_alerts',
  CLICK_EVENTS: 'affiliate_hub_click_events',
  SEARCH_HISTORY: 'affiliate_hub_search_history',
  RECENT_PRODUCTS: 'affiliate_hub_recent_products',
} as const;

// Helper function to safely parse JSON
function safeJsonParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn('Failed to parse JSON from localStorage:', error);
    return defaultValue;
  }
}

// Helper function to safely stringify JSON
function safeJsonStringify(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn('Failed to stringify JSON for localStorage:', error);
    return '{}';
  }
}

// User Preferences Management
export const userPreferencesStorage = {
  get(): UserPreferences {
    const defaultPreferences: UserPreferences = {
      favoriteCategories: [],
      preferredPlatforms: [],
      priceRange: { min: 0, max: 10000 },
      currency: 'PHP',
      location: 'Philippines',
      notifications: {
        priceDrops: true,
        newDeals: true,
        newsletter: false,
      },
    };

    if (typeof window === 'undefined') return defaultPreferences;
    
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return safeJsonParse(stored, defaultPreferences);
  },

  set(preferences: UserPreferences): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, safeJsonStringify(preferences));
  },

  update(updates: Partial<UserPreferences>): void {
    const current = this.get();
    this.set({ ...current, ...updates });
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  },
};

// User Favorites Management
export const userFavoritesStorage = {
  get(): UserFavorite[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.USER_FAVORITES);
    return safeJsonParse(stored, []);
  },

  set(favorites: UserFavorite[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_FAVORITES, safeJsonStringify(favorites));
  },

  add(productId: string): void {
    const favorites = this.get();
    const exists = favorites.find(fav => fav.productId === productId);
    
    if (!exists) {
      const newFavorite: UserFavorite = {
        id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId,
        addedAt: new Date(),
      };
      favorites.push(newFavorite);
      this.set(favorites);
    }
  },

  remove(productId: string): void {
    const favorites = this.get();
    const filtered = favorites.filter(fav => fav.productId !== productId);
    this.set(filtered);
  },

  isFavorite(productId: string): boolean {
    const favorites = this.get();
    return favorites.some(fav => fav.productId === productId);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER_FAVORITES);
  },
};

// Price Alerts Management
export const priceAlertsStorage = {
  get(): PriceAlert[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.PRICE_ALERTS);
    return safeJsonParse(stored, []);
  },

  set(alerts: PriceAlert[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, safeJsonStringify(alerts));
  },

  add(productId: string, targetPrice: number): void {
    const alerts = this.get();
    const exists = alerts.find(alert => alert.productId === productId);
    
    if (!exists) {
      const newAlert: PriceAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId,
        targetPrice,
        isActive: true,
        createdAt: new Date(),
      };
      alerts.push(newAlert);
      this.set(alerts);
    }
  },

  remove(productId: string): void {
    const alerts = this.get();
    const filtered = alerts.filter(alert => alert.productId !== productId);
    this.set(filtered);
  },

  toggle(productId: string): void {
    const alerts = this.get();
    const alert = alerts.find(a => a.productId === productId);
    if (alert) {
      alert.isActive = !alert.isActive;
      this.set(alerts);
    }
  },

  hasAlert(productId: string): boolean {
    const alerts = this.get();
    return alerts.some(alert => alert.productId === productId && alert.isActive);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PRICE_ALERTS);
  },
};

// Click Events Tracking
export const clickEventsStorage = {
  get(): ClickEvent[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.CLICK_EVENTS);
    return safeJsonParse(stored, []);
  },

  set(events: ClickEvent[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CLICK_EVENTS, safeJsonStringify(events));
  },

  add(productId: string, platform: string): void {
    const events = this.get();
    const clickEvent: ClickEvent = {
      productId,
      platform,
      timestamp: new Date(),
      referrer: typeof window !== 'undefined' ? window.location.href : undefined,
    };
    
    events.push(clickEvent);
    
    // Keep only last 1000 events to prevent storage bloat
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    
    this.set(events);
  },

  getByProduct(productId: string): ClickEvent[] {
    const events = this.get();
    return events.filter(event => event.productId === productId);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CLICK_EVENTS);
  },
};

// Search History Management
export const searchHistoryStorage = {
  get(): string[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return safeJsonParse(stored, []);
  },

  set(history: string[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, safeJsonStringify(history));
  },

  add(query: string): void {
    if (!query.trim()) return;
    
    const history = this.get();
    const filtered = history.filter(item => item !== query);
    filtered.unshift(query);
    
    // Keep only last 20 searches
    if (filtered.length > 20) {
      filtered.splice(20);
    }
    
    this.set(filtered);
  },

  remove(query: string): void {
    const history = this.get();
    const filtered = history.filter(item => item !== query);
    this.set(filtered);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },
};

// Recent Products Management
export const recentProductsStorage = {
  get(): string[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_PRODUCTS);
    return safeJsonParse(stored, []);
  },

  set(products: string[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.RECENT_PRODUCTS, safeJsonStringify(products));
  },

  add(productId: string): void {
    const products = this.get();
    const filtered = products.filter(id => id !== productId);
    filtered.unshift(productId);
    
    // Keep only last 50 products
    if (filtered.length > 50) {
      filtered.splice(50);
    }
    
    this.set(filtered);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.RECENT_PRODUCTS);
  },
};

// Clear all storage
export const clearAllStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Export all utilities
export const storage = {
  userPreferences: userPreferencesStorage,
  userFavorites: userFavoritesStorage,
  priceAlerts: priceAlertsStorage,
  clickEvents: clickEventsStorage,
  searchHistory: searchHistoryStorage,
  recentProducts: recentProductsStorage,
  clearAll: clearAllStorage,
};

// Helper functions for easier usage
export const getUserFavorites = () => {
  // This would normally fetch product data from API based on favorite IDs
  // For now, return empty array as placeholder
  return [];
};

export const getPriceAlerts = () => {
  return priceAlertsStorage.get();
};

export const addPriceAlert = (alert: PriceAlert) => {
  const alerts = priceAlertsStorage.get();
  alerts.push(alert);
  priceAlertsStorage.set(alerts);
};

export const removePriceAlert = (alertId: string) => {
  const alerts = priceAlertsStorage.get();
  const filtered = alerts.filter(alert => alert.id !== alertId);
  priceAlertsStorage.set(filtered);
};

export default storage;
