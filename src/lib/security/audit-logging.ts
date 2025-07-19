import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Audit log levels
export enum AuditLogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGE = 'auth.password.change',
  PASSWORD_RESET = 'auth.password.reset',
  MFA_ENABLED = 'auth.mfa.enabled',
  MFA_DISABLED = 'auth.mfa.disabled',
  
  // User management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role.changed',
  USER_ACTIVATED = 'user.activated',
  USER_DEACTIVATED = 'user.deactivated',
  
  // Product management
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_PUBLISHED = 'product.published',
  PRODUCT_UNPUBLISHED = 'product.unpublished',
  
  // Link management
  LINK_CREATED = 'link.created',
  LINK_UPDATED = 'link.updated',
  LINK_DELETED = 'link.deleted',
  LINK_CLICKED = 'link.clicked',
  
  // System events
  SYSTEM_BACKUP = 'system.backup',
  SYSTEM_RESTORE = 'system.restore',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_ERROR = 'system.error',
  
  // Security events
  SECURITY_BREACH_ATTEMPT = 'security.breach.attempt',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
  PERMISSION_DENIED = 'security.permission.denied',
  
  // Data events
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_DELETION = 'data.deletion',
  
  // Configuration changes
  CONFIG_UPDATED = 'config.updated',
  SETTINGS_CHANGED = 'settings.changed'
}

// Audit log entry interface
export interface AuditLogEntry {
  id?: string
  timestamp: Date
  level: AuditLogLevel
  eventType: AuditEventType
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  resourceId?: string
  action: string
  details?: Record<string, any>
  metadata?: {
    request?: {
      method: string
      url: string
      headers?: Record<string, string>
      body?: any
    }
    response?: {
      status: number
      headers?: Record<string, string>
    }
    duration?: number
    error?: {
      message: string
      stack?: string
      code?: string
    }
  }
  tags?: string[]
  correlationId?: string
  parentId?: string
}

// Audit logger configuration
export interface AuditLoggerConfig {
  enabled: boolean
  logLevel: AuditLogLevel
  includeRequestBody: boolean
  includeResponseHeaders: boolean
  maxBodySize: number
  sensitiveFields: string[]
  retentionDays: number
  batchSize: number
  flushInterval: number
}

// Default configuration
const DEFAULT_CONFIG: AuditLoggerConfig = {
  enabled: true,
  logLevel: AuditLogLevel.INFO,
  includeRequestBody: false,
  includeResponseHeaders: false,
  maxBodySize: 10000,
  sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
  retentionDays: 90,
  batchSize: 100,
  flushInterval: 5000 // 5 seconds
}

// Audit Logger class
export class AuditLogger {
  private config: AuditLoggerConfig
  private logQueue: AuditLogEntry[] = []
  private flushTimer?: NodeJS.Timeout

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    if (this.config.enabled) {
      this.startFlushTimer()
    }
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return

    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
      details: this.sanitizeData(entry.details),
      metadata: entry.metadata ? {
        ...entry.metadata,
        request: entry.metadata.request ? {
          ...entry.metadata.request,
          body: this.sanitizeData(entry.metadata.request.body)
        } : undefined
      } : undefined
    }

    // Add to queue for batch processing
    this.logQueue.push(auditEntry)

    // Flush immediately for critical events
    if (entry.level === AuditLogLevel.CRITICAL) {
      await this.flush()
    }

    // Flush if queue is full
    if (this.logQueue.length >= this.config.batchSize) {
      await this.flush()
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    eventType: AuditEventType,
    userId: string | null,
    success: boolean,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      level: success ? AuditLogLevel.INFO : AuditLogLevel.WARN,
      eventType,
      userId: userId || undefined,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      action: success ? 'Authentication successful' : 'Authentication failed',
      details,
      metadata: request ? {
        request: {
          method: request.method,
          url: request.url,
          headers: this.sanitizeHeaders(Object.fromEntries(request.headers.entries()))
        }
      } : undefined
    })
  }

  /**
   * Log user action
   */
  async logUserAction(
    eventType: AuditEventType,
    userId: string,
    action: string,
    resource?: string,
    resourceId?: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      level: AuditLogLevel.INFO,
      eventType,
      userId,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      resource,
      resourceId,
      action,
      details,
      metadata: request ? {
        request: {
          method: request.method,
          url: request.url
        }
      } : undefined
    })
  }

  /**
   * Log security event
   */
  async logSecurity(
    eventType: AuditEventType,
    level: AuditLogLevel,
    action: string,
    details?: Record<string, any>,
    request?: NextRequest,
    userId?: string
  ): Promise<void> {
    await this.log({
      level,
      eventType,
      userId,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      action,
      details,
      tags: ['security'],
      metadata: request ? {
        request: {
          method: request.method,
          url: request.url,
          headers: this.sanitizeHeaders(Object.fromEntries(request.headers.entries()))
        }
      } : undefined
    })
  }

  /**
   * Log system event
   */
  async logSystem(
    eventType: AuditEventType,
    level: AuditLogLevel,
    action: string,
    details?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    await this.log({
      level,
      eventType,
      action,
      details,
      tags: ['system'],
      metadata: error ? {
        error: {
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        }
      } : undefined
    })
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    action: 'read' | 'write' | 'delete' | 'export' | 'import',
    resource: string,
    resourceId?: string,
    userId?: string,
    details?: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    const eventTypeMap = {
      read: AuditEventType.PRODUCT_CREATED, // Placeholder - would need specific read events
      write: AuditEventType.PRODUCT_UPDATED,
      delete: AuditEventType.PRODUCT_DELETED,
      export: AuditEventType.DATA_EXPORT,
      import: AuditEventType.DATA_IMPORT
    }

    await this.log({
      level: action === 'delete' ? AuditLogLevel.WARN : AuditLogLevel.INFO,
      eventType: eventTypeMap[action],
      userId,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      resource,
      resourceId,
      action: `Data ${action}`,
      details,
      tags: ['data-access']
    })
  }

  /**
   * Flush log queue to storage
   */
  async flush(): Promise<void> {
    if (this.logQueue.length === 0) return

    const entries = [...this.logQueue]
    this.logQueue = []

    try {
      await this.persistLogs(entries)
    } catch (error) {
      console.error('Failed to persist audit logs:', error)
      // Re-queue failed entries (with limit to prevent infinite growth)
      if (this.logQueue.length < this.config.batchSize * 2) {
        this.logQueue.unshift(...entries)
      }
    }
  }

  /**
   * Persist logs to database
   */
  private async persistLogs(entries: AuditLogEntry[]): Promise<void> {
    const supabase = await createClient()

    const dbEntries = entries.map(entry => ({
      level: entry.level,
      event_type: entry.eventType,
      user_id: entry.userId,
      session_id: entry.sessionId,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      resource: entry.resource,
      resource_id: entry.resourceId,
      action: entry.action,
      details: entry.details,
      metadata: entry.metadata,
      tags: entry.tags,
      correlation_id: entry.correlationId,
      parent_id: entry.parentId,
      created_at: entry.timestamp.toISOString()
    }))

    const { error } = await supabase
      .from('audit_logs')
      .insert(dbEntries)

    if (error) {
      throw new Error(`Failed to insert audit logs: ${error.message}`)
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error)
    }, this.config.flushInterval)
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  /**
   * Sanitize sensitive data
   */
  private sanitizeData(data: any): any {
    if (!data) return data

    if (typeof data === 'string') {
      return data.length > this.config.maxBodySize 
        ? data.substring(0, this.config.maxBodySize) + '...[truncated]'
        : data
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item))
    }

    if (typeof data === 'object') {
      const sanitized: any = {}
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()
        
        if (this.config.sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitizeData(value)
        }
      }
      
      return sanitized
    }

    return data
  }

  /**
   * Sanitize headers
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {}
    
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase()
      
      if (this.config.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  /**
   * Get client IP address
   */
  private getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined

    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    return request.ip
  }

  /**
   * Cleanup old logs
   */
  async cleanup(): Promise<void> {
    if (!this.config.enabled) return

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Failed to cleanup old audit logs:', error)
      }
    } catch (error) {
      console.error('Error during audit log cleanup:', error)
    }
  }

  /**
   * Shutdown logger
   */
  async shutdown(): Promise<void> {
    this.stopFlushTimer()
    await this.flush()
  }
}

// Audit log query interface
export interface AuditLogQuery {
  userId?: string
  eventType?: AuditEventType
  level?: AuditLogLevel
  resource?: string
  resourceId?: string
  ipAddress?: string
  startDate?: Date
  endDate?: Date
  tags?: string[]
  limit?: number
  offset?: number
}

// Audit log service
export class AuditLogService {
  /**
   * Query audit logs
   */
  static async queryLogs(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    const supabase = await createClient()
    
    let dbQuery = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (query.userId) {
      dbQuery = dbQuery.eq('user_id', query.userId)
    }

    if (query.eventType) {
      dbQuery = dbQuery.eq('event_type', query.eventType)
    }

    if (query.level) {
      dbQuery = dbQuery.eq('level', query.level)
    }

    if (query.resource) {
      dbQuery = dbQuery.eq('resource', query.resource)
    }

    if (query.resourceId) {
      dbQuery = dbQuery.eq('resource_id', query.resourceId)
    }

    if (query.ipAddress) {
      dbQuery = dbQuery.eq('ip_address', query.ipAddress)
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('created_at', query.startDate.toISOString())
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('created_at', query.endDate.toISOString())
    }

    if (query.tags && query.tags.length > 0) {
      dbQuery = dbQuery.contains('tags', query.tags)
    }

    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit)
    }

    if (query.offset) {
      dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 50) - 1)
    }

    const { data, error } = await dbQuery

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`)
    }

    return (data || []).map(row => ({
      id: row.id,
      timestamp: new Date(row.created_at),
      level: row.level,
      eventType: row.event_type,
      userId: row.user_id,
      sessionId: row.session_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      resource: row.resource,
      resourceId: row.resource_id,
      action: row.action,
      details: row.details,
      metadata: row.metadata,
      tags: row.tags,
      correlationId: row.correlation_id,
      parentId: row.parent_id
    }))
  }

  /**
   * Get audit log statistics
   */
  static async getStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalLogs: number
    logsByLevel: Record<AuditLogLevel, number>
    logsByEventType: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
    topIPs: Array<{ ipAddress: string; count: number }>
  }> {
    const supabase = await createClient()
    
    let query = supabase.from('audit_logs').select('*')
    
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get audit log statistics: ${error.message}`)
    }

    const logs = data || []
    
    // Calculate statistics
    const logsByLevel = logs.reduce((acc, log) => {
      acc[log.level as AuditLogLevel] = (acc[log.level as AuditLogLevel] || 0) + 1
      return acc
    }, {} as Record<AuditLogLevel, number>)

    const logsByEventType = logs.reduce((acc, log) => {
      acc[log.event_type] = (acc[log.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const userCounts = logs.reduce((acc, log) => {
      if (log.user_id) {
        acc[log.user_id] = (acc[log.user_id] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const ipCounts = logs.reduce((acc, log) => {
      if (log.ip_address) {
        acc[log.ip_address] = (acc[log.ip_address] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }))

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ipAddress, count]) => ({ ipAddress, count }))

    return {
      totalLogs: logs.length,
      logsByLevel,
      logsByEventType,
      topUsers,
      topIPs
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

// Utility functions
export async function logAuthEvent(
  eventType: AuditEventType,
  userId: string | null,
  success: boolean,
  details?: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  return auditLogger.logAuth(eventType, userId, success, details, request)
}

export async function logUserAction(
  eventType: AuditEventType,
  userId: string,
  action: string,
  resource?: string,
  resourceId?: string,
  details?: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  return auditLogger.logUserAction(eventType, userId, action, resource, resourceId, details, request)
}

export async function logSecurityEvent(
  eventType: AuditEventType,
  level: AuditLogLevel,
  action: string,
  details?: Record<string, any>,
  request?: NextRequest,
  userId?: string
): Promise<void> {
  return auditLogger.logSecurity(eventType, level, action, details, request, userId)
}