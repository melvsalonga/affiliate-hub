import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reportRequestSchema = z.object({
  reportType: z.enum(['performance', 'products', 'traffic', 'conversion', 'custom']),
  dateRange: z.object({
    start: z.string().transform(str => new Date(str)),
    end: z.string().transform(str => new Date(str))
  }),
  metrics: z.array(z.string()).optional(),
  filters: z.object({
    productIds: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    trafficSources: z.array(z.string()).optional(),
    devices: z.array(z.string()).optional()
  }).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'product', 'category', 'source']).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, dateRange, metrics, filters, groupBy, format } = reportRequestSchema.parse(body)

    // Generate custom report
    const reportData = await generateCustomReport(supabase, {
      reportType,
      dateRange,
      metrics,
      filters,
      groupBy,
      format
    })

    if (format === 'csv') {
      return new NextResponse(reportData.csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${Date.now()}.csv"`
        }
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Custom report generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateCustomReport(supabase: any, config: any) {
  const { reportType, dateRange, metrics, filters, groupBy, format } = config

  // Base query for click events
  let clickQuery = supabase
    .from('click_events')
    .select(`
      *,
      products (
        id,
        title,
        current_price,
        currency,
        categories (name)
      )
    `)
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  // Apply filters
  if (filters?.productIds?.length) {
    clickQuery = clickQuery.in('product_id', filters.productIds)
  }

  const { data: clickEvents } = await clickQuery

  // Get conversions
  let conversionQuery = supabase
    .from('conversions')
    .select('*')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  if (filters?.productIds?.length) {
    conversionQuery = conversionQuery.in('product_id', filters.productIds)
  }

  const { data: conversions } = await conversionQuery

  // Process data based on report type
  let reportData
  switch (reportType) {
    case 'performance':
      reportData = generatePerformanceReport(clickEvents || [], conversions || [], groupBy)
      break
    case 'products':
      reportData = generateProductReport(clickEvents || [], conversions || [], groupBy)
      break
    case 'traffic':
      reportData = generateTrafficReport(clickEvents || [], groupBy)
      break
    case 'conversion':
      reportData = generateConversionReport(clickEvents || [], conversions || [], groupBy)
      break
    case 'custom':
      reportData = generateCustomMetricsReport(clickEvents || [], conversions || [], metrics, groupBy)
      break
    default:
      reportData = generatePerformanceReport(clickEvents || [], conversions || [], groupBy)
  }

  // Format output
  if (format === 'csv') {
    return { csv: convertToCSV(reportData) }
  }

  return {
    reportType,
    dateRange,
    generatedAt: new Date().toISOString(),
    data: reportData,
    summary: generateReportSummary(reportData, reportType)
  }
}

function generatePerformanceReport(clickEvents: any[], conversions: any[], groupBy?: string) {
  const grouped = groupData(clickEvents, conversions, groupBy || 'day')
  
  return Object.entries(grouped).map(([key, data]: [string, any]) => ({
    period: key,
    clicks: data.clicks.length,
    views: data.clicks.filter((c: any) => c.event_type === 'view').length,
    conversions: data.conversions.length,
    revenue: data.conversions.reduce((sum: number, c: any) => sum + (c.order_value || 0), 0),
    conversionRate: data.clicks.length > 0 ? (data.conversions.length / data.clicks.length) * 100 : 0,
    averageOrderValue: data.conversions.length > 0 
      ? data.conversions.reduce((sum: number, c: any) => sum + (c.order_value || 0), 0) / data.conversions.length 
      : 0
  }))
}

function generateProductReport(clickEvents: any[], conversions: any[], groupBy?: string) {
  const productMap = new Map()

  // Aggregate by product
  clickEvents.forEach(event => {
    if (event.products) {
      const productId = event.products.id
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: event.products.title,
          category: event.products.categories?.name || 'Uncategorized',
          price: event.products.current_price,
          clicks: [],
          conversions: []
        })
      }
      productMap.get(productId).clicks.push(event)
    }
  })

  conversions.forEach(conversion => {
    const productId = conversion.product_id
    if (productMap.has(productId)) {
      productMap.get(productId).conversions.push(conversion)
    }
  })

  return Array.from(productMap.values()).map(product => ({
    productId: product.id,
    productName: product.name,
    category: product.category,
    price: product.price,
    clicks: product.clicks.length,
    conversions: product.conversions.length,
    revenue: product.conversions.reduce((sum: number, c: any) => sum + (c.order_value || 0), 0),
    conversionRate: product.clicks.length > 0 ? (product.conversions.length / product.clicks.length) * 100 : 0,
    averageOrderValue: product.conversions.length > 0 
      ? product.conversions.reduce((sum: number, c: any) => sum + (c.order_value || 0), 0) / product.conversions.length 
      : 0
  })).sort((a, b) => b.revenue - a.revenue)
}

function generateTrafficReport(clickEvents: any[], groupBy?: string) {
  const trafficSources = new Map()

  clickEvents.forEach(event => {
    const source = event.referrer_domain || 'Direct'
    const device = event.user_agent?.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop'
    const key = groupBy === 'source' ? source : `${source} - ${device}`

    if (!trafficSources.has(key)) {
      trafficSources.set(key, {
        source: key,
        clicks: 0,
        uniqueUsers: new Set(),
        bounceRate: 0,
        avgSessionDuration: 0
      })
    }

    const sourceData = trafficSources.get(key)
    sourceData.clicks++
    sourceData.uniqueUsers.add(event.session_id || event.user_id)
  })

  return Array.from(trafficSources.values()).map(source => ({
    source: source.source,
    clicks: source.clicks,
    uniqueUsers: source.uniqueUsers.size,
    clicksPerUser: source.uniqueUsers.size > 0 ? source.clicks / source.uniqueUsers.size : 0
  })).sort((a, b) => b.clicks - a.clicks)
}

function generateConversionReport(clickEvents: any[], conversions: any[], groupBy?: string) {
  // Create conversion funnel data
  const funnelSteps = [
    { name: 'Visitors', count: new Set(clickEvents.map(e => e.session_id || e.user_id)).size },
    { name: 'Product Views', count: clickEvents.filter(e => e.event_type === 'view').length },
    { name: 'Clicks', count: clickEvents.filter(e => e.event_type === 'click').length },
    { name: 'Conversions', count: conversions.length }
  ]

  const conversionRates = []
  for (let i = 0; i < funnelSteps.length - 1; i++) {
    const current = funnelSteps[i]
    const next = funnelSteps[i + 1]
    conversionRates.push({
      from: current.name,
      to: next.name,
      rate: current.count > 0 ? (next.count / current.count) * 100 : 0,
      dropOff: current.count - next.count
    })
  }

  return {
    funnelSteps,
    conversionRates,
    overallConversionRate: funnelSteps[0].count > 0 
      ? (funnelSteps[funnelSteps.length - 1].count / funnelSteps[0].count) * 100 
      : 0
  }
}

function generateCustomMetricsReport(clickEvents: any[], conversions: any[], metrics?: string[], groupBy?: string) {
  const defaultMetrics = ['clicks', 'conversions', 'revenue', 'conversionRate']
  const selectedMetrics = metrics || defaultMetrics

  const grouped = groupData(clickEvents, conversions, groupBy || 'day')
  
  return Object.entries(grouped).map(([key, data]: [string, any]) => {
    const result: any = { period: key }
    
    selectedMetrics.forEach(metric => {
      switch (metric) {
        case 'clicks':
          result.clicks = data.clicks.length
          break
        case 'views':
          result.views = data.clicks.filter((c: any) => c.event_type === 'view').length
          break
        case 'conversions':
          result.conversions = data.conversions.length
          break
        case 'revenue':
          result.revenue = data.conversions.reduce((sum: number, c: any) => sum + (c.order_value || 0), 0)
          break
        case 'conversionRate':
          result.conversionRate = data.clicks.length > 0 ? (data.conversions.length / data.clicks.length) * 100 : 0
          break
        case 'averageOrderValue':
          result.averageOrderValue = data.conversions.length > 0 
            ? data.conversions.reduce((sum: number, c: any) => sum + (c.order_value || 0), 0) / data.conversions.length 
            : 0
          break
      }
    })
    
    return result
  })
}

function groupData(clickEvents: any[], conversions: any[], groupBy: string) {
  const grouped: any = {}

  const getGroupKey = (date: Date) => {
    switch (groupBy) {
      case 'day':
        return date.toISOString().split('T')[0]
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        return weekStart.toISOString().split('T')[0]
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      default:
        return date.toISOString().split('T')[0]
    }
  }

  // Initialize groups
  clickEvents.forEach(event => {
    const key = getGroupKey(new Date(event.created_at))
    if (!grouped[key]) {
      grouped[key] = { clicks: [], conversions: [] }
    }
    grouped[key].clicks.push(event)
  })

  conversions.forEach(conversion => {
    const key = getGroupKey(new Date(conversion.created_at))
    if (!grouped[key]) {
      grouped[key] = { clicks: [], conversions: [] }
    }
    grouped[key].conversions.push(conversion)
  })

  return grouped
}

function generateReportSummary(data: any, reportType: string) {
  if (Array.isArray(data)) {
    const totalClicks = data.reduce((sum, item) => sum + (item.clicks || 0), 0)
    const totalConversions = data.reduce((sum, item) => sum + (item.conversions || 0), 0)
    const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0)

    return {
      totalRecords: data.length,
      totalClicks,
      totalConversions,
      totalRevenue,
      overallConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      averageOrderValue: totalConversions > 0 ? totalRevenue / totalConversions : 0
    }
  }

  return { totalRecords: 1 }
}

function convertToCSV(data: any): string {
  if (!Array.isArray(data)) {
    data = [data]
  }

  if (data.length === 0) {
    return ''
  }

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}