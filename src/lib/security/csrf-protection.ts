import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// CSRF configuration
export interface CSRFConfig {
  secret: string
  cookieName?: string
  headerName?: string
  tokenLength?: number
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
  httpOnly?: boolean
  maxAge?: number
  ignoreMethods?: string[]
  trustedOrigins?: string[]
}

// Default CSRF configuration
const DEFAULT_CSRF_CONFIG: Required<CSRFConfig> = {
  secret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // Must be false so client can read it
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  trustedOrigins: []
}

// CSRF Protection class
export class CSRFProtection {
  private config: Required<CSRFConfig>

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config }
  }

  /**
   * Generate CSRF token
   */
  generateToken(): string {
    const randomToken = randomBytes(this.config.tokenLength).toString('hex')
    const timestamp = Date.now().toString()
    const payload = `${randomToken}.${timestamp}`
    
    // Create HMAC signature
    const signature = createHash('sha256')
      .update(payload + this.config.secret)
      .digest('hex')
    
    return `${payload}.${signature}`
  }

  /**
   * Verify CSRF token
   */
  verifyToken(token: string): boolean {
    if (!token) return false
    
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return false
      
      const [randomToken, timestamp, signature] = parts
      const payload = `${randomToken}.${timestamp}`
      
      // Verify signature
      const expectedSignature = createHash('sha256')
        .update(payload + this.config.secret)
        .digest('hex')
      
      if (signature !== expectedSignature) return false
      
      // Check token age
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > this.config.maxAge) return false
      
      return true
    } catch {
      return false
    }
  }

  /**
   * Set CSRF token in response
   */
  setTokenCookie(response: NextResponse, token?: string): void {
    const csrfToken = token || this.generateToken()
    
    response.cookies.set(this.config.cookieName, csrfToken, {
      maxAge: this.config.maxAge / 1000, // Convert to seconds
      sameSite: this.config.sameSite,
      secure: this.config.secure,
      httpOnly: this.config.httpOnly,
      path: '/'
    })
  }

  /**
   * Get CSRF token from request
   */
  getTokenFromRequest(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(this.config.headerName)
    if (headerToken) return headerToken
    
    // Try cookie
    const cookieToken = request.cookies.get(this.config.cookieName)?.value
    if (cookieToken) return cookieToken
    
    // Try form data for POST requests
    if (request.method === 'POST') {
      try {
        const formData = request.formData()
        // Note: This is async, so we can't use it here directly
        // The caller should handle form data extraction
      } catch {
        // Ignore form data parsing errors
      }
    }
    
    return null
  }

  /**
   * Check if request should be protected
   */
  shouldProtectRequest(request: NextRequest): boolean {
    // Skip ignored methods
    if (this.config.ignoreMethods.includes(request.method)) {
      return false
    }
    
    // Skip if origin is trusted
    const origin = request.headers.get('origin')
    if (origin && this.config.trustedOrigins.includes(origin)) {
      return false
    }
    
    return true
  }

  /**
   * Validate CSRF protection for request
   */
  async validateRequest(request: NextRequest): Promise<CSRFValidationResult> {
    if (!this.shouldProtectRequest(request)) {
      return { valid: true, reason: 'Request method ignored' }
    }
    
    const token = this.getTokenFromRequest(request)
    
    if (!token) {
      return { valid: false, reason: 'CSRF token missing' }
    }
    
    if (!this.verifyToken(token)) {
      return { valid: false, reason: 'CSRF token invalid' }
    }
    
    // Additional origin validation
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')
    
    if (origin) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return { valid: false, reason: 'Origin mismatch' }
      }
    } else if (referer) {
      const refererHost = new URL(referer).host
      if (refererHost !== host) {
        return { valid: false, reason: 'Referer mismatch' }
      }
    } else {
      return { valid: false, reason: 'Missing origin and referer headers' }
    }
    
    return { valid: true }
  }

  /**
   * Create CSRF middleware
   */
  middleware() {
    return async (request: NextRequest) => {
      const validation = await this.validateRequest(request)
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'CSRF validation failed', reason: validation.reason },
          { status: 403 }
        )
      }
      
      return NextResponse.next()
    }
  }
}

// CSRF validation result
export interface CSRFValidationResult {
  valid: boolean
  reason?: string
}

// CSRF Error class
export class CSRFError extends Error {
  constructor(message: string, public reason?: string) {
    super(message)
    this.name = 'CSRFError'
  }
}

// Double Submit Cookie pattern implementation
export class DoubleSubmitCSRF extends CSRFProtection {
  /**
   * Generate token pair for double submit pattern
   */
  generateTokenPair(): { cookieToken: string; formToken: string } {
    const baseToken = randomBytes(this.config.tokenLength).toString('hex')
    const timestamp = Date.now().toString()
    
    // Cookie token (httpOnly)
    const cookiePayload = `${baseToken}.${timestamp}.cookie`
    const cookieSignature = createHash('sha256')
      .update(cookiePayload + this.config.secret)
      .digest('hex')
    const cookieToken = `${cookiePayload}.${cookieSignature}`
    
    // Form token (readable by JS)
    const formPayload = `${baseToken}.${timestamp}.form`
    const formSignature = createHash('sha256')
      .update(formPayload + this.config.secret)
      .digest('hex')
    const formToken = `${formPayload}.${formSignature}`
    
    return { cookieToken, formToken }
  }

  /**
   * Verify token pair
   */
  verifyTokenPair(cookieToken: string, formToken: string): boolean {
    if (!cookieToken || !formToken) return false
    
    try {
      const cookieParts = cookieToken.split('.')
      const formParts = formToken.split('.')
      
      if (cookieParts.length !== 4 || formParts.length !== 4) return false
      
      // Extract base tokens and timestamps
      const [cookieBase, cookieTimestamp] = cookieParts
      const [formBase, formTimestamp] = formParts
      
      // Verify base tokens match
      if (cookieBase !== formBase) return false
      
      // Verify timestamps match
      if (cookieTimestamp !== formTimestamp) return false
      
      // Verify signatures
      const cookiePayload = `${cookieBase}.${cookieTimestamp}.cookie`
      const expectedCookieSignature = createHash('sha256')
        .update(cookiePayload + this.config.secret)
        .digest('hex')
      
      const formPayload = `${formBase}.${formTimestamp}.form`
      const expectedFormSignature = createHash('sha256')
        .update(formPayload + this.config.secret)
        .digest('hex')
      
      if (cookieParts[3] !== expectedCookieSignature) return false
      if (formParts[3] !== expectedFormSignature) return false
      
      // Check token age
      const tokenAge = Date.now() - parseInt(cookieTimestamp)
      if (tokenAge > this.config.maxAge) return false
      
      return true
    } catch {
      return false
    }
  }
}

// Synchronizer Token Pattern implementation
export class SynchronizerTokenCSRF extends CSRFProtection {
  private tokenStore: Map<string, { token: string; expires: number }> = new Map()

  /**
   * Generate and store session token
   */
  generateSessionToken(sessionId: string): string {
    const token = this.generateToken()
    const expires = Date.now() + this.config.maxAge
    
    this.tokenStore.set(sessionId, { token, expires })
    
    // Clean up expired tokens
    this.cleanupExpiredTokens()
    
    return token
  }

  /**
   * Verify session token
   */
  verifySessionToken(sessionId: string, token: string): boolean {
    const stored = this.tokenStore.get(sessionId)
    
    if (!stored) return false
    if (Date.now() > stored.expires) {
      this.tokenStore.delete(sessionId)
      return false
    }
    
    return stored.token === token && this.verifyToken(token)
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (now > data.expires) {
        this.tokenStore.delete(sessionId)
      }
    }
  }
}

// Custom header CSRF protection
export class CustomHeaderCSRF {
  private requiredHeader: string
  private expectedValue?: string

  constructor(headerName: string = 'x-requested-with', expectedValue?: string) {
    this.requiredHeader = headerName.toLowerCase()
    this.expectedValue = expectedValue
  }

  /**
   * Validate custom header
   */
  validateHeader(request: NextRequest): boolean {
    const headerValue = request.headers.get(this.requiredHeader)
    
    if (!headerValue) return false
    
    if (this.expectedValue) {
      return headerValue.toLowerCase() === this.expectedValue.toLowerCase()
    }
    
    return true
  }

  /**
   * Create middleware
   */
  middleware() {
    return (request: NextRequest) => {
      if (!this.validateHeader(request)) {
        return NextResponse.json(
          { error: 'Missing required header', header: this.requiredHeader },
          { status: 403 }
        )
      }
      
      return NextResponse.next()
    }
  }
}

// Export instances
export const csrfProtection = new CSRFProtection()
export const doubleSubmitCSRF = new DoubleSubmitCSRF()
export const synchronizerTokenCSRF = new SynchronizerTokenCSRF()
export const customHeaderCSRF = new CustomHeaderCSRF('x-requested-with', 'XMLHttpRequest')

// Utility functions
export function generateCSRFToken(): string {
  return csrfProtection.generateToken()
}

export function verifyCSRFToken(token: string): boolean {
  return csrfProtection.verifyToken(token)
}

export async function validateCSRFRequest(request: NextRequest): Promise<boolean> {
  const result = await csrfProtection.validateRequest(request)
  return result.valid
}

// React hook for CSRF token
export function useCSRFToken(): {
  token: string | null
  refreshToken: () => void
} {
  // This would be implemented on the client side
  // Placeholder for the actual implementation
  return {
    token: null,
    refreshToken: () => {}
  }
}