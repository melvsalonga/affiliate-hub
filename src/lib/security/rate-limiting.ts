import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string // Custom key generator
  onLimitReached?: (req: NextRequest) => void // Callback when limit is reached
  message?: string // Custom error message
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  SIGNUP: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many signup attempts. Please try again in 1 hour.'
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please try again in 1 hour.'
  },
  
  // API endpoints
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many API requests. Please slow down.'
  },
  API_STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Rate limit exceeded for this endpoint.'
  },
  
  // File uploads
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many upload attempts. Please wait before uploading again.'
  },
  
  // Search endpoints
  SEARCH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many search requests. Please slow down.'
  },
  
  // Admin actions
  ADMIN_ACTIONS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many admin actions. Please slow down.'
  }
} as const

// Rate limiter class
export class RateLimiter {
  private redis: Redis
  private defaultConfig: RateLimitConfig

  constructor(redisUrl?: string, defaultConfig?: Partial<RateLimitConfig>) {
    this.redis = new Redis({
      url: redisUrl || process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
    
    this.defaultConfig = {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
      message: 'Too many requests. Please try again later.',
      ...defaultConfig
    }
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(
    req: NextRequest,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const key = this.generateKey(req, finalConfig)
    
    try {
      // Get current count
      const current = await this.redis.get(key) as number || 0
      
      // Check if limit exceeded
      if (current >= finalConfig.maxRequests) {
        // Get TTL for reset time
        const ttl = await this.redis.ttl(key)
        const resetTime = new Date(Date.now() + (ttl * 1000))
        
        return {
          success: false,
          limit: finalConfig.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter: ttl,
          message: finalConfig.message
        }
      }
      
      // Increment counter
      const newCount = await this.redis.incr(key)
      
      // Set expiration on first request
      if (newCount === 1) {
        await this.redis.expire(key, Math.ceil(finalConfig.windowMs / 1000))
      }
      
      // Get TTL for reset time
      const ttl = await this.redis.ttl(key)
      const resetTime = new Date(Date.now() + (ttl * 1000))
      
      return {
        success: true,
        limit: finalConfig.maxRequests,
        remaining: Math.max(0, finalConfig.maxRequests - newCount),
        resetTime,
        retryAfter: 0
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fail open - allow request if Redis is down
      return {
        success: true,
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - 1,
        resetTime: new Date(Date.now() + finalConfig.windowMs),
        retryAfter: 0
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetRateLimit(req: NextRequest, config: Partial<RateLimitConfig> = {}): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const key = this.generateKey(req, finalConfig)
    
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Error resetting rate limit:', error)
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(
    req: NextRequest,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitStatus> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const key = this.generateKey(req, finalConfig)
    
    try {
      const current = await this.redis.get(key) as number || 0
      const ttl = await this.redis.ttl(key)
      const resetTime = new Date(Date.now() + (ttl * 1000))
      
      return {
        limit: finalConfig.maxRequests,
        remaining: Math.max(0, finalConfig.maxRequests - current),
        resetTime,
        used: current
      }
    } catch (error) {
      console.error('Error getting rate limit status:', error)
      return {
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests,
        resetTime: new Date(Date.now() + finalConfig.windowMs),
        used: 0
      }
    }
  }

  /**
   * Generate rate limit key
   */
  private generateKey(req: NextRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req)
    }
    
    // Default key generation based on IP and endpoint
    const ip = this.getClientIP(req)
    const endpoint = req.nextUrl.pathname
    const method = req.method
    
    return `rate_limit:${ip}:${method}:${endpoint}`
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
    // Check various headers for the real IP
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    // Fallback to a default value for development
    return req.ip || '127.0.0.1'
  }
}

// Rate limit result interface
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter: number
  message?: string
}

// Rate limit status interface
export interface RateLimitStatus {
  limit: number
  remaining: number
  resetTime: Date
  used: number
}

// Rate limit error class
export class RateLimitError extends Error {
  constructor(
    message: string,
    public limit: number,
    public remaining: number,
    public resetTime: Date,
    public retryAfter: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Middleware factory for rate limiting
export function createRateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const rateLimiter = new RateLimiter()
  
  return async (req: NextRequest) => {
    const result = await rateLimiter.checkRateLimit(req, config)
    
    if (!result.success) {
      throw new RateLimitError(
        result.message || 'Rate limit exceeded',
        result.limit,
        result.remaining,
        result.resetTime,
        result.retryAfter
      )
    }
    
    return result
  }
}

// Sliding window rate limiter for more precise control
export class SlidingWindowRateLimiter {
  private redis: Redis
  
  constructor(redisUrl?: string) {
    this.redis = new Redis({
      url: redisUrl || process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  }

  /**
   * Check rate limit using sliding window algorithm
   */
  async checkSlidingWindow(
    key: string,
    windowMs: number,
    maxRequests: number
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - windowMs
    
    try {
      // Remove old entries
      await this.redis.zremrangebyscore(key, 0, windowStart)
      
      // Count current requests in window
      const currentCount = await this.redis.zcard(key)
      
      if (currentCount >= maxRequests) {
        // Get oldest entry to calculate reset time
        const oldest = await this.redis.zrange(key, 0, 0, { withScores: true })
        const resetTime = oldest.length > 0 
          ? new Date((oldest[1] as number) + windowMs)
          : new Date(now + windowMs)
        
        return {
          success: false,
          limit: maxRequests,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime.getTime() - now) / 1000),
          message: 'Rate limit exceeded'
        }
      }
      
      // Add current request
      await this.redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })
      
      // Set expiration
      await this.redis.expire(key, Math.ceil(windowMs / 1000))
      
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - currentCount - 1,
        resetTime: new Date(now + windowMs),
        retryAfter: 0
      }
    } catch (error) {
      console.error('Sliding window rate limiting error:', error)
      // Fail open
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetTime: new Date(now + windowMs),
        retryAfter: 0
      }
    }
  }
}

// Distributed rate limiter for multiple instances
export class DistributedRateLimiter extends RateLimiter {
  /**
   * Check rate limit with distributed locking
   */
  async checkDistributedRateLimit(
    req: NextRequest,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const key = this.generateKey(req, finalConfig)
    const lockKey = `${key}:lock`
    
    try {
      // Acquire distributed lock
      const lockAcquired = await this.redis.set(lockKey, '1', {
        px: 1000, // 1 second expiration
        nx: true // Only set if not exists
      })
      
      if (!lockAcquired) {
        // If we can't acquire lock, check current status
        return this.getRateLimitStatus(req, config).then(status => ({
          success: status.remaining > 0,
          limit: status.limit,
          remaining: status.remaining,
          resetTime: status.resetTime,
          retryAfter: status.remaining > 0 ? 0 : Math.ceil((status.resetTime.getTime() - Date.now()) / 1000),
          message: status.remaining > 0 ? undefined : finalConfig.message
        }))
      }
      
      try {
        // Perform rate limit check
        const result = await this.checkRateLimit(req, config)
        return result
      } finally {
        // Release lock
        await this.redis.del(lockKey)
      }
    } catch (error) {
      console.error('Distributed rate limiting error:', error)
      // Fallback to regular rate limiting
      return this.checkRateLimit(req, config)
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter()
export const slidingWindowRateLimiter = new SlidingWindowRateLimiter()
export const distributedRateLimiter = new DistributedRateLimiter()