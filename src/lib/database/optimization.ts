import { PrismaClient } from '@prisma/client'

// Database query optimization utilities
export class QueryOptimizer {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // Optimized product queries with proper indexing
  async getProductsOptimized(params: {
    page?: number
    limit?: number
    categoryId?: string
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      limit = 20,
      categoryId,
      search,
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params

    const offset = (page - 1) * limit

    // Build where clause efficiently
    const where: any = {
      status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    }

    // Use cursor-based pagination for better performance on large datasets
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          tags: {
            select: { id: true, name: true }
          },
          images: {
            select: { id: true, url: true, alt: true, isPrimary: true },
            orderBy: { order: 'asc' }
          },
          affiliateLinks: {
            select: { 
              id: true, 
              platform: true, 
              shortenedUrl: true, 
              isActive: true,
              priority: true
            },
            where: { isActive: true },
            orderBy: { priority: 'desc' }
          },
          _count: {
            select: {
              clickEvents: true,
              conversions: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit
      }),
      this.prisma.product.count({ where })
    ])

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  }

  // Optimized analytics queries with aggregation
  async getAnalyticsOptimized(params: {
    linkId?: string
    productId?: string
    dateFrom?: Date
    dateTo?: Date
    groupBy?: 'day' | 'week' | 'month'
  }) {
    const { linkId, productId, dateFrom, dateTo, groupBy = 'day' } = params

    const where: any = {}
    
    if (linkId) where.linkId = linkId
    if (productId) where.link = { productId }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    // Use raw SQL for complex aggregations
    const dateFormat = {
      day: "DATE_TRUNC('day', created_at)",
      week: "DATE_TRUNC('week', created_at)",
      month: "DATE_TRUNC('month', created_at)"
    }[groupBy]

    const clicksQuery = `
      SELECT 
        ${dateFormat} as date,
        COUNT(*) as clicks,
        COUNT(DISTINCT ip_address) as unique_visitors,
        COUNT(DISTINCT user_agent) as unique_devices
      FROM click_events 
      WHERE ${this.buildWhereClause(where)}
      GROUP BY ${dateFormat}
      ORDER BY date ASC
    `

    const conversionsQuery = `
      SELECT 
        ${dateFormat} as date,
        COUNT(*) as conversions,
        SUM(order_value) as revenue,
        SUM(commission) as commission_earned,
        AVG(order_value) as avg_order_value
      FROM conversions c
      JOIN click_events ce ON c.click_id = ce.id
      WHERE ${this.buildWhereClause(where)}
      GROUP BY ${dateFormat}
      ORDER BY date ASC
    `

    const [clicksData, conversionsData] = await Promise.all([
      this.prisma.$queryRawUnsafe(clicksQuery),
      this.prisma.$queryRawUnsafe(conversionsQuery)
    ])

    return {
      clicks: clicksData,
      conversions: conversionsData,
      summary: await this.getAnalyticsSummary(where)
    }
  }

  // Batch operations for better performance
  async batchUpdateProducts(updates: Array<{ id: string; data: any }>) {
    const operations = updates.map(({ id, data }) =>
      this.prisma.product.update({
        where: { id },
        data
      })
    )

    return await this.prisma.$transaction(operations)
  }

  async batchCreateProducts(products: any[]) {
    // Use createMany for better performance
    return await this.prisma.product.createMany({
      data: products,
      skipDuplicates: true
    })
  }

  // Connection pooling and query optimization
  async withTransaction<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(callback, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
      isolationLevel: 'ReadCommitted'
    })
  }

  // Query performance monitoring
  async executeWithMetrics<T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<{ result: T; metrics: { duration: number; queryName: string } }> {
    const startTime = Date.now()
    
    try {
      const result = await query()
      const duration = Date.now() - startTime
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`)
      }
      
      return {
        result,
        metrics: { duration, queryName }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`Query failed: ${queryName} after ${duration}ms`, error)
      throw error
    }
  }

  // Helper methods
  private buildWhereClause(where: any): string {
    const conditions: string[] = []
    
    if (where.linkId) {
      conditions.push(`link_id = '${where.linkId}'`)
    }
    
    if (where.createdAt?.gte) {
      conditions.push(`created_at >= '${where.createdAt.gte.toISOString()}'`)
    }
    
    if (where.createdAt?.lte) {
      conditions.push(`created_at <= '${where.createdAt.lte.toISOString()}'`)
    }
    
    return conditions.length > 0 ? conditions.join(' AND ') : '1=1'
  }

  private async getAnalyticsSummary(where: any) {
    const [clicksCount, conversionsCount, revenueSum] = await Promise.all([
      this.prisma.clickEvent.count({ where }),
      this.prisma.conversion.count({ 
        where: { clickEvent: where }
      }),
      this.prisma.conversion.aggregate({
        where: { clickEvent: where },
        _sum: { orderValue: true, commission: true }
      })
    ])

    return {
      totalClicks: clicksCount,
      totalConversions: conversionsCount,
      totalRevenue: revenueSum._sum.orderValue || 0,
      totalCommission: revenueSum._sum.commission || 0,
      conversionRate: clicksCount > 0 ? (conversionsCount / clicksCount) * 100 : 0
    }
  }
}

// Database indexing recommendations
export const indexingRecommendations = {
  // Products table indexes
  products: [
    'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
    'CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_products_title_search ON products USING gin(to_tsvector(\'english\', title))',
    'CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING gin(to_tsvector(\'english\', description))',
  ],

  // Click events table indexes
  clickEvents: [
    'CREATE INDEX IF NOT EXISTS idx_click_events_link_id ON click_events(link_id)',
    'CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON click_events(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_click_events_link_date ON click_events(link_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_click_events_ip_address ON click_events(ip_address)',
  ],

  // Conversions table indexes
  conversions: [
    'CREATE INDEX IF NOT EXISTS idx_conversions_click_id ON conversions(click_id)',
    'CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status)',
  ],

  // Affiliate links table indexes
  affiliateLinks: [
    'CREATE INDEX IF NOT EXISTS idx_affiliate_links_product_id ON affiliate_links(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_affiliate_links_platform ON affiliate_links(platform)',
    'CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON affiliate_links(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_affiliate_links_shortened_url ON affiliate_links(shortened_url)',
  ],

  // Categories and tags indexes
  categories: [
    'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)',
    'CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)',
  ],

  tags: [
    'CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)',
  ],

  // Junction table indexes
  productTags: [
    'CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id)',
  ]
}

// Query performance analyzer
export class QueryAnalyzer {
  private prisma: PrismaClient
  private queryLog: Array<{
    query: string
    duration: number
    timestamp: Date
  }> = []

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async analyzeQuery(query: string): Promise<any> {
    const startTime = Date.now()
    
    try {
      const result = await this.prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${query}`)
      const duration = Date.now() - startTime
      
      this.queryLog.push({
        query,
        duration,
        timestamp: new Date()
      })
      
      return result
    } catch (error) {
      console.error('Query analysis failed:', error)
      throw error
    }
  }

  getSlowQueries(threshold: number = 1000): typeof this.queryLog {
    return this.queryLog.filter(log => log.duration > threshold)
  }

  getQueryStats(): {
    totalQueries: number
    averageDuration: number
    slowQueries: number
  } {
    const totalQueries = this.queryLog.length
    const totalDuration = this.queryLog.reduce((sum, log) => sum + log.duration, 0)
    const slowQueries = this.getSlowQueries().length

    return {
      totalQueries,
      averageDuration: totalQueries > 0 ? totalDuration / totalQueries : 0,
      slowQueries
    }
  }

  clearLog(): void {
    this.queryLog = []
  }
}