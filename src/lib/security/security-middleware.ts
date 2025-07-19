import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RATE_LIMIT_CONFIGS, RateLimitError } from './rate-limiting'
import { csrfProtection, CSRFError } from './csrf-protection'
import { getSecurityHeaders } from './secure-headers'
import { auditLogger, AuditEventType, AuditLogLevel } from './audit-logging'
import { RequestValidator, ValidationError } from './input-validation'

// Security middleware configuration
export interface SecurityMiddlewareConfig {
  rateLimit?: {
    enabled: boolean
    config?: keyof typeof RATE_LIMIT_CONFIGS | any
  }
  csrf?: {
    enabled: boolean
    ignorePaths?: string[]
  }
  headers?: {
    enabled: boolean
    environment?: 'development' | 'production' | 'api'
  }
  audit?: {
    enabled: boolean
    logLevel?: AuditLogLevel
  }
  validation?: {
    enabled: boolean
    sanitizeHtml?: boolean
    maxBodySize?: number
  }
  ipWhitelist?: string[]
  ipBlacklist?: string[]
  userAgentBlacklist?: RegExp[]
  customChecks?: Array<(req: NextRequest) => Promise<SecurityCheckResult> | SecurityCheckResult>
}

// Security check result
export interface SecurityCheckResult {
  passed: boolean
  reason?: string
  action?: 'block' | 'log' | 'warn'
  statusCode?: number
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityMiddlewareConfig = {
  rateLimit: {
    enabled: true,
    config: 'API_GENERAL'
  },
  csrf: {
    enabled: true,
    ignorePaths: ['/api/auth/callback', '/api/webhooks']
  },
  headers: {
    enabled: true,
    environment: 'production'
  },
  audit: {
    enabled: true,
    logLevel: AuditLogLevel.INFO
  },
  validation: {
    enabled: true,
    sanitizeHtml: false,
    maxBodySize: 10000
  },
  ipBlacklist: [],
  userAgentBlacklist: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ],
  customChecks: []
}

// Security middleware class
export class SecurityMiddleware {
  private config: SecurityMiddlewareConfig

  constructor(config: Partial<SecurityMiddlewareConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config }
  }

  /**
   * Main security middleware function
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    let response: NextResponse

    try {
      // 1. IP-based filtering
      const ipCheck = await this.checkIPFiltering(request)
      if (!ipCheck.passed) {
        return this.createSecurityResponse(ipCheck, request)
      }

      // 2. User agent filtering
      const uaCheck = await this.checkUserAgent(request)
      if (!uaCheck.passed) {
        return this.createSecurityResponse(uaCheck, request)
      }

      // 3. Rate limiting
      if (this.config.rateLimit?.enabled) {
        const rateLimitCheck = await this.checkRateLimit(request)
        if (!rateLimitCheck.passed) {
          return this.createSecurityResponse(rateLimitCheck, request)
        }
      }

      // 4. CSRF protection
      if (this.config.csrf?.enabled) {
        const csrfCheck = await this.checkCSRF(request)
        if (!csrfCheck.passed) {
          return this.createSecurityResponse(csrfCheck, request)
        }
      }

      // 5. Input validation
      if (this.config.validation?.enabled) {
        const validationCheck = await this.checkInputValidation(request)
        if (!validationCheck.passed) {
          return this.createSecurityResponse(validationCheck, request)
        }
      }

      // 6. Custom security checks
      for (const customCheck of this.config.customChecks || []) {
        const result = await customCheck(request)
        if (!result.passed) {
          return this.createSecurityResponse(result, request)
        }
      }

      // 7. Create response and apply security headers
      response = NextResponse.next()
      
      if (this.config.headers?.enabled) {
        const securityHeaders = getSecurityHeaders(this.config.headers.environment)
        response = securityHeaders.applyHeaders(response, request)
      }

      // 8. Audit logging for successful requests
      if (this.config.audit?.enabled) {
        await this.logSecurityEvent(request, response, startTime, true)
      }

      return response

    } catch (error) {
      // Handle security middleware errors
      console.error('Security middleware error:', error)
      
      // Log security error
      if (this.config.audit?.enabled) {
        await auditLogger.logSecurity(
          AuditEventType.SYSTEM_ERROR,
          AuditLogLevel.ERROR,
          'Security middleware error',
          { error: error.message },
          request
        )
      }

      // Return generic error response
      return NextResponse.json(
        { error: 'Security check failed' },
        { status: 500 }
      )
    }
  }

  /**
   * Check IP filtering (whitelist/blacklist)
   */
  private async checkIPFiltering(request: NextRequest): Promise<SecurityCheckResult> {
    const clientIP = this.getClientIP(request)
    
    if (!clientIP) {
      return { passed: true }
    }

    // Check blacklist
    if (this.config.ipBlacklist && this.config.ipBlacklist.includes(clientIP)) {
      await this.logSecurityViolation(
        request,
        'IP_BLACKLISTED',
        `Blocked IP: ${clientIP}`
      )
      
      return {
        passed: false,
        reason: 'IP address is blacklisted',
        action: 'block',
        statusCode: 403
      }
    }

    // Check whitelist (if configured)
    if (this.config.ipWhitelist && this.config.ipWhitelist.length > 0) {
      if (!this.config.ipWhitelist.includes(clientIP)) {
        await this.logSecurityViolation(
          request,
          'IP_NOT_WHITELISTED',
          `Non-whitelisted IP: ${clientIP}`
        )
        
        return {
          passed: false,
          reason: 'IP address is not whitelisted',
          action: 'block',
          statusCode: 403
        }
      }
    }

    return { passed: true }
  }

  /**
   * Check user agent filtering
   */
  private async checkUserAgent(request: NextRequest): Promise<SecurityCheckResult> {
    const userAgent = request.headers.get('user-agent')
    
    if (!userAgent) {
      await this.logSecurityViolation(
        request,
        'MISSING_USER_AGENT',
        'Request without user agent'
      )
      
      return {
        passed: false,
        reason: 'Missing user agent',
        action: 'block',
        statusCode: 400
      }
    }

    // Check against blacklisted patterns
    for (const pattern of this.config.userAgentBlacklist || []) {
      if (pattern.test(userAgent)) {
        await this.logSecurityViolation(
          request,
          'BLOCKED_USER_AGENT',
          `Blocked user agent: ${userAgent}`
        )
        
        return {
          passed: false,
          reason: 'User agent is blocked',
          action: 'block',
          statusCode: 403
        }
      }
    }

    return { passed: true }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(request: NextRequest): Promise<SecurityCheckResult> {
    try {
      const config = typeof this.config.rateLimit?.config === 'string'
        ? RATE_LIMIT_CONFIGS[this.config.rateLimit.config]
        : this.config.rateLimit?.config

      const result = await rateLimiter.checkRateLimit(request, config)
      
      if (!result.success) {
        await this.logSecurityViolation(
          request,
          'RATE_LIMIT_EXCEEDED',
          `Rate limit exceeded: ${result.limit} requests per window`
        )
        
        return {
          passed: false,
          reason: result.message || 'Rate limit exceeded',
          action: 'block',
          statusCode: 429
        }
      }

      return { passed: true }
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          passed: false,
          reason: error.message,
          action: 'block',
          statusCode: 429
        }
      }
      throw error
    }
  }

  /**
   * Check CSRF protection
   */
  private async checkCSRF(request: NextRequest): Promise<SecurityCheckResult> {
    try {
      // Skip CSRF check for ignored paths
      const pathname = request.nextUrl.pathname
      if (this.config.csrf?.ignorePaths?.some(path => pathname.startsWith(path))) {
        return { passed: true }
      }

      const validation = await csrfProtection.validateRequest(request)
      
      if (!validation.valid) {
        await this.logSecurityViolation(
          request,
          'CSRF_VALIDATION_FAILED',
          `CSRF validation failed: ${validation.reason}`
        )
        
        return {
          passed: false,
          reason: validation.reason || 'CSRF validation failed',
          action: 'block',
          statusCode: 403
        }
      }

      return { passed: true }
    } catch (error) {
      if (error instanceof CSRFError) {
        return {
          passed: false,
          reason: error.message,
          action: 'block',
          statusCode: 403
        }
      }
      throw error
    }
  }

  /**
   * Check input validation
   */
  private async checkInputValidation(request: NextRequest): Promise<SecurityCheckResult> {
    try {
      // Only validate requests with body
      if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
        return { passed: true }
      }

      // Basic content-length check
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > (this.config.validation?.maxBodySize || 10000)) {
        await this.logSecurityViolation(
          request,
          'REQUEST_TOO_LARGE',
          `Request body too large: ${contentLength} bytes`
        )
        
        return {
          passed: false,
          reason: 'Request body too large',
          action: 'block',
          statusCode: 413
        }
      }

      // Content-type validation
      const contentType = request.headers.get('content-type')
      if (contentType && !this.isAllowedContentType(contentType)) {
        await this.logSecurityViolation(
          request,
          'INVALID_CONTENT_TYPE',
          `Invalid content type: ${contentType}`
        )
        
        return {
          passed: false,
          reason: 'Invalid content type',
          action: 'block',
          statusCode: 415
        }
      }

      return { passed: true }
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          passed: false,
          reason: error.message,
          action: 'block',
          statusCode: 400
        }
      }
      throw error
    }
  }

  /**
   * Check if content type is allowed
   */
  private isAllowedContentType(contentType: string): boolean {
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ]
    
    return allowedTypes.some(type => contentType.toLowerCase().includes(type))
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string | null {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return request.ip || null
  }

  /**
   * Log security violation
   */
  private async logSecurityViolation(
    request: NextRequest,
    violationType: string,
    details: string
  ): Promise<void> {
    if (!this.config.audit?.enabled) return

    await auditLogger.logSecurity(
      AuditEventType.SECURITY_BREACH_ATTEMPT,
      AuditLogLevel.WARN,
      `Security violation: ${violationType}`,
      {
        violationType,
        details,
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      },
      request
    )
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    request: NextRequest,
    response: NextResponse,
    startTime: number,
    success: boolean
  ): Promise<void> {
    if (!this.config.audit?.enabled) return

    const duration = Date.now() - startTime
    
    await auditLogger.log({
      level: success ? AuditLogLevel.INFO : AuditLogLevel.WARN,
      eventType: AuditEventType.SYSTEM_ERROR,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      action: 'Security middleware check',
      details: {
        success,
        duration,
        method: request.method,
        url: request.url,
        status: response.status
      },
      tags: ['security', 'middleware']
    })
  }

  /**
   * Create security response
   */
  private createSecurityResponse(
    result: SecurityCheckResult,
    request: NextRequest
  ): NextResponse {
    const response = NextResponse.json(
      { 
        error: result.reason || 'Security check failed',
        code: 'SECURITY_VIOLATION'
      },
      { status: result.statusCode || 403 }
    )

    // Apply security headers
    if (this.config.headers?.enabled) {
      const securityHeaders = getSecurityHeaders(this.config.headers.environment)
      return securityHeaders.applyHeaders(response, request)
    }

    return response
  }
}

// Predefined security configurations
export const SECURITY_PROFILES = {
  // Strict security for production APIs
  API_STRICT: {
    rateLimit: {
      enabled: true,
      config: 'API_STRICT'
    },
    csrf: {
      enabled: true,
      ignorePaths: ['/api/webhooks']
    },
    headers: {
      enabled: true,
      environment: 'api' as const
    },
    audit: {
      enabled: true,
      logLevel: AuditLogLevel.INFO
    },
    validation: {
      enabled: true,
      sanitizeHtml: false,
      maxBodySize: 5000
    }
  } as SecurityMiddlewareConfig,

  // Moderate security for web applications
  WEB_STANDARD: {
    rateLimit: {
      enabled: true,
      config: 'API_GENERAL'
    },
    csrf: {
      enabled: true,
      ignorePaths: ['/api/auth/callback', '/api/webhooks']
    },
    headers: {
      enabled: true,
      environment: 'production' as const
    },
    audit: {
      enabled: true,
      logLevel: AuditLogLevel.INFO
    },
    validation: {
      enabled: true,
      sanitizeHtml: true,
      maxBodySize: 10000
    }
  } as SecurityMiddlewareConfig,

  // Relaxed security for development
  DEVELOPMENT: {
    rateLimit: {
      enabled: false
    },
    csrf: {
      enabled: false
    },
    headers: {
      enabled: true,
      environment: 'development' as const
    },
    audit: {
      enabled: true,
      logLevel: AuditLogLevel.WARN
    },
    validation: {
      enabled: true,
      sanitizeHtml: false,
      maxBodySize: 50000
    }
  } as SecurityMiddlewareConfig
}

// Factory functions
export function createSecurityMiddleware(config?: Partial<SecurityMiddlewareConfig>): SecurityMiddleware {
  return new SecurityMiddleware(config)
}

export function createAPISecurityMiddleware(): SecurityMiddleware {
  return new SecurityMiddleware(SECURITY_PROFILES.API_STRICT)
}

export function createWebSecurityMiddleware(): SecurityMiddleware {
  return new SecurityMiddleware(SECURITY_PROFILES.WEB_STANDARD)
}

export function createDevelopmentSecurityMiddleware(): SecurityMiddleware {
  return new SecurityMiddleware(SECURITY_PROFILES.DEVELOPMENT)
}

// Export default instance
export const securityMiddleware = createWebSecurityMiddleware()