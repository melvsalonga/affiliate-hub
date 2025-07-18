import { UserRole } from '@prisma/client'

// Role hierarchy for permission checking
const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3
}

// Permission checking utilities
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

export function canAccessResource(userRole: UserRole, resourcePermissions: UserRole[]): boolean {
  return resourcePermissions.some(role => hasPermission(userRole, role))
}

// Route protection utilities
export function getRequiredRoleForRoute(pathname: string): UserRole[] {
  // Admin-only routes
  if (pathname.startsWith('/admin/users') || 
      pathname.startsWith('/admin/settings') ||
      pathname.startsWith('/admin/system')) {
    return ['ADMIN']
  }

  // Editor and Admin routes
  if (pathname.startsWith('/admin/products') || 
      pathname.startsWith('/admin/categories') ||
      pathname.startsWith('/admin/links') ||
      pathname.startsWith('/admin/campaigns')) {
    return ['ADMIN', 'EDITOR']
  }

  // All authenticated users
  if (pathname.startsWith('/admin')) {
    return ['ADMIN', 'EDITOR', 'VIEWER']
  }

  // Public routes
  return []
}

// User display utilities
export function getUserDisplayName(user: {
  profile?: {
    firstName?: string
    lastName?: string
  }
  email?: string
}): string {
  if (user.profile?.firstName && user.profile?.lastName) {
    return `${user.profile.firstName} ${user.profile.lastName}`
  }
  
  if (user.profile?.firstName) {
    return user.profile.firstName
  }
  
  return user.email || 'Unknown User'
}

export function getUserInitials(user: {
  profile?: {
    firstName?: string
    lastName?: string
  }
  email?: string
}): string {
  if (user.profile?.firstName && user.profile?.lastName) {
    return `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase()
  }
  
  if (user.profile?.firstName) {
    return user.profile.firstName[0].toUpperCase()
  }
  
  if (user.email) {
    return user.email[0].toUpperCase()
  }
  
  return 'U'
}

// Role styling utilities
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800'
    case 'EDITOR':
      return 'bg-blue-100 text-blue-800'
    case 'VIEWER':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Full system access including user management and system settings'
    case 'EDITOR':
      return 'Can manage content including products, categories, and affiliate links'
    case 'VIEWER':
      return 'Read-only access to analytics and reports'
    default:
      return 'Unknown role'
  }
}

// Session utilities
export function isSessionExpired(lastActivity: Date, maxInactiveMinutes: number = 60): boolean {
  const now = new Date()
  const diffInMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
  return diffInMinutes > maxInactiveMinutes
}

export function shouldRefreshToken(tokenExpiry: Date, refreshThresholdMinutes: number = 5): boolean {
  const now = new Date()
  const diffInMinutes = (tokenExpiry.getTime() - now.getTime()) / (1000 * 60)
  return diffInMinutes <= refreshThresholdMinutes
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Security utilities
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000) // Limit length
}

// Audit logging utilities
export interface AuditLogEntry {
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  options: Partial<AuditLogEntry> = {}
): AuditLogEntry {
  return {
    userId,
    action,
    resource,
    timestamp: new Date(),
    ...options
  }
}

// Rate limiting utilities
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
}

// Error handling utilities
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class PermissionError extends AuthError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'PERMISSION_DENIED', 403)
  }
}

export class SessionExpiredError extends AuthError {
  constructor(message: string = 'Session has expired') {
    super(message, 'SESSION_EXPIRED', 401)
  }
}