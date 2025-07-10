// Configuration utility for environment variables
export const config = {
  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'DealFinder',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Your Smart Shopping Companion',
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  },

  // Platform API Keys
  platforms: {
    lazada: {
      apiKey: process.env.LAZADA_API_KEY || '',
      secretKey: process.env.LAZADA_SECRET_KEY || '',
    },
    shopee: {
      apiKey: process.env.SHOPEE_API_KEY || '',
      secretKey: process.env.SHOPEE_SECRET_KEY || '',
    },
    tiktok: {
      apiKey: process.env.TIKTOK_API_KEY || '',
      secretKey: process.env.TIKTOK_SECRET_KEY || '',
    },
    amazon: {
      apiKey: process.env.AMAZON_API_KEY || '',
      secretKey: process.env.AMAZON_SECRET_KEY || '',
    },
    aliexpress: {
      apiKey: process.env.ALIEXPRESS_API_KEY || '',
      secretKey: process.env.ALIEXPRESS_SECRET_KEY || '',
    },
  },

  // Analytics
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '',
    googleAdsenseId: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || '',
  },

  // Social OAuth
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || '',
    },
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    nextAuthSecret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  },

  // Payment Processing
  payments: {
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },

  // Development
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;

// Validation function to check if required environment variables are set
export const validateConfig = () => {
  const errors: string[] = [];

  // Check required environment variables based on environment
  if (config.isProd) {
    // In production, certain variables are required
    if (!config.auth.nextAuthSecret || config.auth.nextAuthSecret === 'your-secret-key-here') {
      errors.push('NEXTAUTH_SECRET is required in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
};

// Helper function to get platform configuration
export const getPlatformConfig = (platformId: string) => {
  const platform = config.platforms[platformId as keyof typeof config.platforms];
  
  if (!platform) {
    throw new Error(`Platform configuration not found for: ${platformId}`);
  }
  
  return platform;
};

// Helper function to check if a platform is configured
export const isPlatformConfigured = (platformId: string): boolean => {
  try {
    const platform = getPlatformConfig(platformId);
    return Boolean(platform.apiKey && platform.secretKey);
  } catch {
    return false;
  }
};

// Export individual config sections for easier imports
export const appConfig = config.app;
export const apiConfig = config.api;
export const platformsConfig = config.platforms;
export const analyticsConfig = config.analytics;
export const authConfig = config.auth;
export const emailConfig = config.email;
export const paymentsConfig = config.payments;

export default config;
