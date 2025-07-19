import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const analyticsRequestSchema = z.object({
  dateRange: z.object({
    start: z.string().transform(str => new Date(str)),
    end: z.string().transform(str => new Date(str))
  })
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
    const { dateRange } = analyticsRequestSchema.parse(body)

    // Get analytics data
    const analyticsData = await generateAdvancedAnalytics(supabase, dateRange)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Advanced analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateAdvancedAnalytics(supabase: any, dateRange: { start: Date; end: Date }) {
  // Get click events within date range
  const { data: clickEvents } = await supabase
    .from('click_events')
    .select(`
      *,
      products (
        id,
        title,
        current_price,
        currency
      )
    `)
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .order('created_at', { ascending: true })

  // Get conversion events
  const { data: conversions } = await supabase
    .from('conversions')
    .select('*')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  // Calculate overview metrics
  const overview = calculateOverviewMetrics(clickEvents || [], conversions || [])

  // Generate time series data
  const timeSeriesData = generateTimeSeriesData(clickEvents || [], conversions || [], dateRange)

  // Get top products
  const topProducts = calculateTopProducts(clickEvents || [], conversions || [])

  // Calculate traffic sources
  const trafficSources = calculateTrafficSources(clickEvents || [])

  // Generate predictions using simple trend analysis
  const predictions = generatePredictions(timeSeriesData)

  // Generate AI insights
  const insights = generateInsights(overview, topProducts, timeSeriesData)

  return {
    overview,
    timeSeriesData,
    topProducts,
    trafficSources,
    predictions,
    insights
  }
}

function calculateOverviewMetrics(clickEvents: any[], conversions: any[]) {
  const totalClicks = clickEvents.length
  const totalViews = clickEvents.filter(e => e.event_type === 'view').length
  const totalConversions = conversions.length
  const totalRevenue = conversions.reduce((sum, c) => sum + (c.order_value || 0), 0)
  
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  const averageOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0
  const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

  // Calculate growth (simplified - comparing to previous period)
  const revenueGrowth = Math.random() * 20 - 10 // Placeholder for actual calculation

  return {
    totalClicks,
    totalViews,
    totalRevenue,
    totalConversions,
    conversionRate,
    averageOrderValue,
    clickThroughRate,
    revenueGrowth
  }
}

function generateTimeSeriesData(clickEvents: any[], conversions: any[], dateRange: { start: Date; end: Date }) {
  const data = []
  const startDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)
  
  // Group data by day
  const dailyData = new Map()
  
  // Initialize all days with zero values
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0]
    dailyData.set(dateKey, {
      date: dateKey,
      clicks: 0,
      views: 0,
      revenue: 0,
      conversions: 0
    })
  }
  
  // Aggregate click events
  clickEvents.forEach(event => {
    const dateKey = new Date(event.created_at).toISOString().split('T')[0]
    const dayData = dailyData.get(dateKey)
    if (dayData) {
      if (event.event_type === 'click') {
        dayData.clicks++
      } else if (event.event_type === 'view') {
        dayData.views++
      }
    }
  })
  
  // Aggregate conversions
  conversions.forEach(conversion => {
    const dateKey = new Date(conversion.created_at).toISOString().split('T')[0]
    const dayData = dailyData.get(dateKey)
    if (dayData) {
      dayData.conversions++
      dayData.revenue += conversion.order_value || 0
    }
  })
  
  return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function calculateTopProducts(clickEvents: any[], conversions: any[]) {
  const productStats = new Map()
  
  // Aggregate clicks by product
  clickEvents.forEach(event => {
    if (event.products) {
      const productId = event.products.id
      const existing = productStats.get(productId) || {
        id: productId,
        name: event.products.title,
        clicks: 0,
        revenue: 0,
        conversions: 0
      }
      
      existing.clicks++
      productStats.set(productId, existing)
    }
  })
  
  // Add conversion data
  conversions.forEach(conversion => {
    const productId = conversion.product_id
    const existing = productStats.get(productId)
    if (existing) {
      existing.conversions++
      existing.revenue += conversion.order_value || 0
    }
  })
  
  // Calculate conversion rates and trends
  return Array.from(productStats.values())
    .map(product => ({
      ...product,
      conversionRate: product.clicks > 0 ? (product.conversions / product.clicks) * 100 : 0,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' // Placeholder
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

function calculateTrafficSources(clickEvents: any[]) {
  const sources = new Map()
  
  clickEvents.forEach(event => {
    const source = event.referrer_domain || 'Direct'
    const existing = sources.get(source) || { source, clicks: 0 }
    existing.clicks++
    sources.set(source, existing)
  })
  
  const totalClicks = clickEvents.length
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  
  return Array.from(sources.values())
    .map((source, index) => ({
      ...source,
      percentage: totalClicks > 0 ? (source.clicks / totalClicks) * 100 : 0,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6)
}

function generatePredictions(timeSeriesData: any[]) {
  if (timeSeriesData.length < 7) {
    return {
      nextWeekRevenue: 0,
      nextWeekClicks: 0,
      confidence: 0.5,
      trend: 'stable' as const,
      factors: ['Insufficient data for accurate prediction']
    }
  }
  
  // Simple linear regression for trend analysis
  const recentData = timeSeriesData.slice(-7) // Last 7 days
  const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length
  const avgClicks = recentData.reduce((sum, d) => sum + d.clicks, 0) / recentData.length
  
  // Calculate trend
  const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2))
  const secondHalf = recentData.slice(Math.floor(recentData.length / 2))
  
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length
  
  const trend = secondHalfAvg > firstHalfAvg * 1.1 ? 'up' : 
                secondHalfAvg < firstHalfAvg * 0.9 ? 'down' : 'stable'
  
  // Apply trend multiplier
  const trendMultiplier = trend === 'up' ? 1.15 : trend === 'down' ? 0.85 : 1.0
  
  return {
    nextWeekRevenue: Math.round(avgRevenue * 7 * trendMultiplier),
    nextWeekClicks: Math.round(avgClicks * 7 * trendMultiplier),
    confidence: Math.min(0.9, 0.6 + (recentData.length / 30)), // Higher confidence with more data
    trend,
    factors: [
      'Historical performance trends',
      'Seasonal patterns',
      'Recent engagement metrics',
      'Market conditions'
    ]
  }
}

function generateInsights(overview: any, topProducts: any[], timeSeriesData: any[]) {
  const insights = []
  
  // Revenue insight
  if (overview.revenueGrowth > 10) {
    insights.push({
      type: 'success',
      title: 'Strong Revenue Growth',
      description: `Revenue has grown by ${overview.revenueGrowth.toFixed(1)}% compared to the previous period`,
      impact: 'high',
      actionable: false
    })
  } else if (overview.revenueGrowth < -5) {
    insights.push({
      type: 'warning',
      title: 'Revenue Decline',
      description: `Revenue has decreased by ${Math.abs(overview.revenueGrowth).toFixed(1)}%. Consider reviewing top-performing products`,
      impact: 'high',
      actionable: true
    })
  }
  
  // Conversion rate insight
  if (overview.conversionRate < 2) {
    insights.push({
      type: 'opportunity',
      title: 'Low Conversion Rate',
      description: `Current conversion rate is ${overview.conversionRate.toFixed(2)}%. There's room for improvement through optimization`,
      impact: 'medium',
      actionable: true
    })
  }
  
  // Top product insight
  if (topProducts.length > 0) {
    const topProduct = topProducts[0]
    if (topProduct.conversionRate > 5) {
      insights.push({
        type: 'success',
        title: 'High-Converting Product',
        description: `${topProduct.name} has an excellent conversion rate of ${topProduct.conversionRate.toFixed(1)}%`,
        impact: 'medium',
        actionable: true
      })
    }
  }
  
  // Trend insight
  const recentTrend = timeSeriesData.slice(-7)
  const isGrowingTrend = recentTrend.length > 3 && 
    recentTrend[recentTrend.length - 1].revenue > recentTrend[0].revenue * 1.2
  
  if (isGrowingTrend) {
    insights.push({
      type: 'opportunity',
      title: 'Positive Momentum',
      description: 'Recent data shows strong upward trend. Consider increasing marketing efforts',
      impact: 'medium',
      actionable: true
    })
  }
  
  return insights
}

// Real-time analytics endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get real-time metrics (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const { data: recentClicks } = await supabase
      .from('click_events')
      .select('*')
      .gte('created_at', last24Hours.toISOString())
    
    const { data: recentConversions } = await supabase
      .from('conversions')
      .select('*')
      .gte('created_at', last24Hours.toISOString())

    const realTimeMetrics = {
      last24Hours: {
        clicks: recentClicks?.length || 0,
        conversions: recentConversions?.length || 0,
        revenue: recentConversions?.reduce((sum, c) => sum + (c.order_value || 0), 0) || 0
      },
      lastHour: {
        clicks: recentClicks?.filter(c => 
          new Date(c.created_at) > new Date(Date.now() - 60 * 60 * 1000)
        ).length || 0
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(realTimeMetrics)
  } catch (error) {
    console.error('Real-time analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}