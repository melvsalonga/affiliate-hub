// Lazada API Configuration
export const LAZADA_CONFIG = {
  // API endpoints
  endpoints: {
    product: {
      search: '/products/search',
      detail: '/product/detail',
      categories: '/categories',
    },
    affiliate: {
      generateLink: '/affiliate/product/generate',
      orderTracking: '/affiliate/order/get',
    },
  },
  
  // API settings
  settings: {
    timeout: 30000, // 30 seconds
    retries: 3,
    rateLimit: {
      requests: 100,
      period: 60000, // 1 minute
    },
  },
  
  // Commission rates (example - actual rates depend on category)
  commissionRates: {
    electronics: 0.03, // 3%
    fashion: 0.05, // 5%
    home: 0.04, // 4%
    beauty: 0.06, // 6%
    sports: 0.04, // 4%
    default: 0.03, // 3%
  },
  
  // Countries supported
  countries: ['PH', 'SG', 'MY', 'TH', 'VN', 'ID'],
  
  // Default parameters
  defaults: {
    limit: 20,
    offset: 0,
    sort: 'popularity',
    country: 'PH', // Philippines
  },
};

// Environment variables validation
export const validateLazadaConfig = () => {
  const required = [
    'LAZADA_APP_KEY',
    'LAZADA_APP_SECRET',
    'LAZADA_ACCESS_TOKEN',
    'LAZADA_REFRESH_TOKEN',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Lazada environment variables: ${missing.join(', ')}`);
  }
};
