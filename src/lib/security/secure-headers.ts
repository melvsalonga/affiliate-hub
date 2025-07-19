import { NextRequest, NextResponse } from 'next/server'

// Security headers configuration
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: CSPConfig | boolean
  strictTransportSecurity?: HSTSConfig | boolean
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string | boolean
  xContentTypeOptions?: boolean
  referrerPolicy?: ReferrerPolicyValue | boolean
  permissionsPolicy?: PermissionsPolicyConfig | boolean
  crossOriginEmbedderPolicy?: 'require-corp' | 'unsafe-none' | boolean
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none' | boolean
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin' | boolean
  xXSSProtection?: boolean
  xDNSPrefetchControl?: boolean
  xDownloadOptions?: boolean
  xPermittedCrossDomainPolicies?: 'none' | 'master-only' | 'by-content-type' | 'all' | boolean
  customHeaders?: Record<string, string>
}

// Content Security Policy configuration
export interface CSPConfig {
  defaultSrc?: string[]
  scriptSrc?: string[]
  styleSrc?: string[]
  imgSrc?: string[]
  connectSrc?: string[]
  fontSrc?: string[]
  objectSrc?: string[]
  mediaSrc?: string[]
  frameSrc?: string[]
  childSrc?: string[]
  workerSrc?: string[]
  manifestSrc?: string[]
  baseUri?: string[]
  formAction?: string[]
  frameAncestors?: string[]
  upgradeInsecureRequests?: boolean
  blockAllMixedContent?: boolean
  reportUri?: string
  reportTo?: string
  requireTrustedTypesFor?: string[]
  trustedTypes?: string[]
}

// HSTS configuration
export interface HSTSConfig {
  maxAge: number
  includeSubDomains?: boolean
  preload?: boolean
}

// Permissions Policy configuration
export interface PermissionsPolicyConfig {
  accelerometer?: string[]
  ambientLightSensor?: string[]
  autoplay?: string[]
  battery?: string[]
  camera?: string[]
  crossOriginIsolated?: string[]
  displayCapture?: string[]
  documentDomain?: string[]
  encryptedMedia?: string[]
  executionWhileNotRendered?: string[]
  executionWhileOutOfViewport?: string[]
  fullscreen?: string[]
  geolocation?: string[]
  gyroscope?: string[]
  magnetometer?: string[]
  microphone?: string[]
  midi?: string[]
  navigationOverride?: string[]
  payment?: string[]
  pictureInPicture?: string[]
  publicKeyCredentialsGet?: string[]
  screenWakeLock?: string[]
  syncXhr?: string[]
  usb?: string[]
  webShare?: string[]
  xrSpatialTracking?: string[]
}

// Referrer Policy values
export type ReferrerPolicyValue = 
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url'

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", 'https:', 'data:'],
    frameSrc: ["'self'", 'https:'],
    childSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    manifestSrc: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true,
    blockAllMixedContent: false
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    midi: [],
    battery: [],
    accelerometer: [],
    gyroscope: [],
    magnetometer: [],
    ambientLightSensor: [],
    autoplay: ['self'],
    fullscreen: ['self'],
    pictureInPicture: ['self']
  },
  crossOriginEmbedderPolicy: false, // Can break some integrations
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  xXSSProtection: true,
  xDNSPrefetchControl: true,
  xDownloadOptions: true,
  xPermittedCrossDomainPolicies: 'none'
}

// Security Headers class
export class SecurityHeaders {
  private config: SecurityHeadersConfig

  constructor(config: SecurityHeadersConfig = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config }
  }

  /**
   * Apply security headers to response
   */
  applyHeaders(response: NextResponse, request?: NextRequest): NextResponse {
    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      const csp = this.buildCSP(this.config.contentSecurityPolicy)
      if (csp) {
        response.headers.set('Content-Security-Policy', csp)
      }
    }

    // Strict Transport Security
    if (this.config.strictTransportSecurity && this.isHTTPS(request)) {
      const hsts = this.buildHSTS(this.config.strictTransportSecurity)
      if (hsts) {
        response.headers.set('Strict-Transport-Security', hsts)
      }
    }

    // X-Frame-Options
    if (this.config.xFrameOptions) {
      const value = typeof this.config.xFrameOptions === 'string' 
        ? this.config.xFrameOptions 
        : 'DENY'
      response.headers.set('X-Frame-Options', value)
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff')
    }

    // Referrer Policy
    if (this.config.referrerPolicy) {
      const value = typeof this.config.referrerPolicy === 'string'
        ? this.config.referrerPolicy
        : 'strict-origin-when-cross-origin'
      response.headers.set('Referrer-Policy', value)
    }

    // Permissions Policy
    if (this.config.permissionsPolicy) {
      const pp = this.buildPermissionsPolicy(this.config.permissionsPolicy)
      if (pp) {
        response.headers.set('Permissions-Policy', pp)
      }
    }

    // Cross-Origin-Embedder-Policy
    if (this.config.crossOriginEmbedderPolicy) {
      const value = typeof this.config.crossOriginEmbedderPolicy === 'string'
        ? this.config.crossOriginEmbedderPolicy
        : 'require-corp'
      response.headers.set('Cross-Origin-Embedder-Policy', value)
    }

    // Cross-Origin-Opener-Policy
    if (this.config.crossOriginOpenerPolicy) {
      const value = typeof this.config.crossOriginOpenerPolicy === 'string'
        ? this.config.crossOriginOpenerPolicy
        : 'same-origin'
      response.headers.set('Cross-Origin-Opener-Policy', value)
    }

    // Cross-Origin-Resource-Policy
    if (this.config.crossOriginResourcePolicy) {
      const value = typeof this.config.crossOriginResourcePolicy === 'string'
        ? this.config.crossOriginResourcePolicy
        : 'same-origin'
      response.headers.set('Cross-Origin-Resource-Policy', value)
    }

    // X-XSS-Protection (deprecated but still useful for older browsers)
    if (this.config.xXSSProtection) {
      response.headers.set('X-XSS-Protection', '1; mode=block')
    }

    // X-DNS-Prefetch-Control
    if (this.config.xDNSPrefetchControl) {
      response.headers.set('X-DNS-Prefetch-Control', 'off')
    }

    // X-Download-Options
    if (this.config.xDownloadOptions) {
      response.headers.set('X-Download-Options', 'noopen')
    }

    // X-Permitted-Cross-Domain-Policies
    if (this.config.xPermittedCrossDomainPolicies) {
      const value = typeof this.config.xPermittedCrossDomainPolicies === 'string'
        ? this.config.xPermittedCrossDomainPolicies
        : 'none'
      response.headers.set('X-Permitted-Cross-Domain-Policies', value)
    }

    // Custom headers
    if (this.config.customHeaders) {
      Object.entries(this.config.customHeaders).forEach(([name, value]) => {
        response.headers.set(name, value)
      })
    }

    // Remove potentially sensitive headers
    response.headers.delete('X-Powered-By')
    response.headers.delete('Server')

    return response
  }

  /**
   * Build Content Security Policy string
   */
  private buildCSP(config: CSPConfig | boolean): string | null {
    if (typeof config === 'boolean') {
      return config ? this.buildCSP(DEFAULT_SECURITY_CONFIG.contentSecurityPolicy as CSPConfig) : null
    }

    const directives: string[] = []

    // Add each directive
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'upgradeInsecureRequests' && value) {
        directives.push('upgrade-insecure-requests')
      } else if (key === 'blockAllMixedContent' && value) {
        directives.push('block-all-mixed-content')
      } else if (key === 'reportUri' && value) {
        directives.push(`report-uri ${value}`)
      } else if (key === 'reportTo' && value) {
        directives.push(`report-to ${value}`)
      } else if (key === 'requireTrustedTypesFor' && Array.isArray(value)) {
        directives.push(`require-trusted-types-for ${value.join(' ')}`)
      } else if (key === 'trustedTypes' && Array.isArray(value)) {
        directives.push(`trusted-types ${value.join(' ')}`)
      } else if (Array.isArray(value) && value.length > 0) {
        const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        directives.push(`${directiveName} ${value.join(' ')}`)
      }
    })

    return directives.join('; ')
  }

  /**
   * Build HSTS string
   */
  private buildHSTS(config: HSTSConfig | boolean): string | null {
    if (typeof config === 'boolean') {
      return config ? this.buildHSTS(DEFAULT_SECURITY_CONFIG.strictTransportSecurity as HSTSConfig) : null
    }

    let hsts = `max-age=${config.maxAge}`
    
    if (config.includeSubDomains) {
      hsts += '; includeSubDomains'
    }
    
    if (config.preload) {
      hsts += '; preload'
    }
    
    return hsts
  }

  /**
   * Build Permissions Policy string
   */
  private buildPermissionsPolicy(config: PermissionsPolicyConfig | boolean): string | null {
    if (typeof config === 'boolean') {
      return config ? this.buildPermissionsPolicy(DEFAULT_SECURITY_CONFIG.permissionsPolicy as PermissionsPolicyConfig) : null
    }

    const policies: string[] = []

    Object.entries(config).forEach(([feature, allowlist]) => {
      if (Array.isArray(allowlist)) {
        const featureName = feature.replace(/([A-Z])/g, '-$1').toLowerCase()
        if (allowlist.length === 0) {
          policies.push(`${featureName}=()`)
        } else {
          const origins = allowlist.map(origin => 
            origin === 'self' ? 'self' : `"${origin}"`
          ).join(' ')
          policies.push(`${featureName}=(${origins})`)
        }
      }
    })

    return policies.join(', ')
  }

  /**
   * Check if request is HTTPS
   */
  private isHTTPS(request?: NextRequest): boolean {
    if (!request) return false
    
    // Check protocol
    if (request.nextUrl.protocol === 'https:') return true
    
    // Check forwarded headers (for proxies)
    const forwarded = request.headers.get('x-forwarded-proto')
    if (forwarded === 'https') return true
    
    const forwarded2 = request.headers.get('x-forwarded-protocol')
    if (forwarded2 === 'https') return true
    
    return false
  }

  /**
   * Create middleware
   */
  middleware() {
    return (request: NextRequest) => {
      const response = NextResponse.next()
      return this.applyHeaders(response, request)
    }
  }
}

// Specialized configurations for different environments
export const SECURITY_CONFIGS = {
  // Development configuration (more permissive)
  DEVELOPMENT: {
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost:*', '127.0.0.1:*'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: false
    },
    strictTransportSecurity: false,
    xFrameOptions: 'SAMEORIGIN'
  } as SecurityHeadersConfig,

  // Production configuration (strict)
  PRODUCTION: {
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://vercel.live'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: true,
      blockAllMixedContent: true
    },
    strictTransportSecurity: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true
    },
    xFrameOptions: 'DENY',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin'
  } as SecurityHeadersConfig,

  // API-specific configuration
  API: {
    contentSecurityPolicy: false, // Not needed for API responses
    xFrameOptions: 'DENY',
    xContentTypeOptions: true,
    referrerPolicy: 'no-referrer',
    crossOriginResourcePolicy: 'same-origin',
    customHeaders: {
      'X-API-Version': '1.0',
      'X-RateLimit-Policy': 'standard'
    }
  } as SecurityHeadersConfig
}

// Export instances
export const securityHeaders = new SecurityHeaders()
export const developmentSecurityHeaders = new SecurityHeaders(SECURITY_CONFIGS.DEVELOPMENT)
export const productionSecurityHeaders = new SecurityHeaders(SECURITY_CONFIGS.PRODUCTION)
export const apiSecurityHeaders = new SecurityHeaders(SECURITY_CONFIGS.API)

// Utility functions
export function getSecurityHeaders(environment: 'development' | 'production' | 'api' = 'production'): SecurityHeaders {
  switch (environment) {
    case 'development':
      return developmentSecurityHeaders
    case 'api':
      return apiSecurityHeaders
    default:
      return productionSecurityHeaders
  }
}

export function createSecurityMiddleware(config?: SecurityHeadersConfig) {
  const headers = new SecurityHeaders(config)
  return headers.middleware()
}