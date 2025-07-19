import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Security-focused validation schemas
export const secureStringSchema = z.string()
  .min(1, 'Field cannot be empty')
  .max(10000, 'Input too long')
  .refine(
    (value) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(value),
    'Script tags are not allowed'
  )
  .refine(
    (value) => !/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi.test(value),
    'Iframe tags are not allowed'
  )
  .refine(
    (value) => !/javascript:/gi.test(value),
    'JavaScript URLs are not allowed'
  )

export const secureEmailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .refine(
    (email) => validator.isEmail(email, { 
      allow_utf8_local_part: false,
      require_tld: true,
      allow_ip_domain: false
    }),
    'Invalid email format'
  )

export const secureUrlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
      } catch {
        return false
      }
    },
    'Only HTTP and HTTPS URLs are allowed'
  )
  .refine(
    (url) => !url.includes('javascript:'),
    'JavaScript URLs are not allowed'
  )

export const securePasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(
    (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password),
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'Password cannot contain more than 2 consecutive identical characters'
  )

export const secureSlugSchema = z.string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .refine(
    (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
    'Slug cannot start or end with a hyphen'
  )
  .refine(
    (slug) => !slug.includes('--'),
    'Slug cannot contain consecutive hyphens'
  )

// Input sanitization functions
export class InputSanitizer {
  /**
   * Sanitize HTML content while preserving safe tags
   */
  static sanitizeHtml(html: string, allowedTags?: string[]): string {
    const defaultAllowedTags = [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
    ]
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags || defaultAllowedTags,
      ALLOWED_ATTR: ['href', 'title', 'alt', 'class'],
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    })
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 10000) // Limit length
  }

  /**
   * Sanitize and validate email
   */
  static sanitizeEmail(email: string): string {
    const sanitized = email.toLowerCase().trim()
    if (!validator.isEmail(sanitized)) {
      throw new Error('Invalid email format')
    }
    return sanitized
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(url: string): string {
    const trimmed = url.trim()
    
    // Check for dangerous protocols
    if (/^(javascript|data|vbscript|file|ftp):/i.test(trimmed)) {
      throw new Error('Unsafe URL protocol')
    }
    
    try {
      const parsed = new URL(trimmed)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed')
      }
      return parsed.toString()
    } catch {
      throw new Error('Invalid URL format')
    }
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe characters
      .replace(/_{2,}/g, '_') // Remove consecutive underscores
      .replace(/^[._]|[._]$/g, '') // Remove leading/trailing dots and underscores
      .slice(0, 255) // Limit length
  }

  /**
   * Sanitize SQL-like input (for search queries)
   */
  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/['"`;\\]/g, '') // Remove SQL injection characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 100) // Limit length
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString)
      return this.deepSanitizeObject(parsed)
    } catch {
      throw new Error('Invalid JSON format')
    }
  }

  /**
   * Deep sanitize object properties
   */
  private static deepSanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitizeObject(item))
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeText(key)
        sanitized[sanitizedKey] = this.deepSanitizeObject(value)
      }
      return sanitized
    }
    
    return obj
  }
}

// Request validation middleware
export interface ValidationOptions {
  sanitizeHtml?: boolean
  maxFileSize?: number
  allowedFileTypes?: string[]
  rateLimitKey?: string
}

export class RequestValidator {
  /**
   * Validate and sanitize request body
   */
  static validateBody<T>(
    schema: z.ZodSchema<T>, 
    body: unknown, 
    options: ValidationOptions = {}
  ): T {
    // Pre-sanitization for string fields
    if (body && typeof body === 'object') {
      body = this.sanitizeRequestObject(body, options)
    }

    const result = schema.safeParse(body)
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      throw new ValidationError('Validation failed', errors)
    }

    return result.data
  }

  /**
   * Validate query parameters
   */
  static validateQuery<T>(
    schema: z.ZodSchema<T>, 
    query: Record<string, string | string[]>
  ): T {
    // Convert query parameters to appropriate types
    const processedQuery = this.processQueryParams(query)
    
    const result = schema.safeParse(processedQuery)
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      throw new ValidationError('Query validation failed', errors)
    }

    return result.data
  }

  /**
   * Validate file upload
   */
  static validateFile(
    file: File, 
    options: ValidationOptions = {}
  ): void {
    const { maxFileSize = 10 * 1024 * 1024, allowedFileTypes = [] } = options

    // Check file size
    if (file.size > maxFileSize) {
      throw new ValidationError(`File size exceeds ${maxFileSize} bytes`)
    }

    // Check file type
    if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
      throw new ValidationError(`File type ${file.type} is not allowed`)
    }

    // Check filename
    const sanitizedName = InputSanitizer.sanitizeFilename(file.name)
    if (sanitizedName !== file.name) {
      throw new ValidationError('Invalid filename')
    }
  }

  /**
   * Sanitize request object
   */
  private static sanitizeRequestObject(obj: any, options: ValidationOptions): any {
    if (typeof obj === 'string') {
      return options.sanitizeHtml 
        ? InputSanitizer.sanitizeHtml(obj)
        : InputSanitizer.sanitizeText(obj)
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeRequestObject(item, options))
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = InputSanitizer.sanitizeText(key)
        sanitized[sanitizedKey] = this.sanitizeRequestObject(value, options)
      }
      return sanitized
    }
    
    return obj
  }

  /**
   * Process query parameters
   */
  private static processQueryParams(query: Record<string, string | string[]>): any {
    const processed: any = {}
    
    for (const [key, value] of Object.entries(query)) {
      const sanitizedKey = InputSanitizer.sanitizeText(key)
      
      if (Array.isArray(value)) {
        processed[sanitizedKey] = value.map(v => InputSanitizer.sanitizeText(v))
      } else {
        // Try to convert to appropriate type
        const sanitizedValue = InputSanitizer.sanitizeText(value)
        
        // Boolean conversion
        if (sanitizedValue === 'true') {
          processed[sanitizedKey] = true
        } else if (sanitizedValue === 'false') {
          processed[sanitizedKey] = false
        }
        // Number conversion
        else if (/^\d+$/.test(sanitizedValue)) {
          processed[sanitizedKey] = parseInt(sanitizedValue, 10)
        } else if (/^\d+\.\d+$/.test(sanitizedValue)) {
          processed[sanitizedKey] = parseFloat(sanitizedValue)
        }
        // String
        else {
          processed[sanitizedKey] = sanitizedValue
        }
      }
    }
    
    return processed
  }
}

// Custom validation error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: Array<{
      field: string
      message: string
      code: string
    }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  // Only alphanumeric and common punctuation
  SAFE_TEXT: /^[a-zA-Z0-9\s.,!?;:()\-_'"]+$/,
  
  // Hex color
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
  
  // UUID v4
  UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Slug (URL-safe)
  SLUG: /^[a-z0-9-]+$/,
  
  // Phone number (international format)
  PHONE: /^\+[1-9]\d{1,14}$/,
  
  // IP address (IPv4)
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  
  // Base64
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/
} as const

// Validation helper functions
export function isValidPattern(value: string, pattern: keyof typeof VALIDATION_PATTERNS): boolean {
  return VALIDATION_PATTERNS[pattern].test(value)
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: ValidationOptions = {}
): T {
  return RequestValidator.validateBody(schema, data, options)
}