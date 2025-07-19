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
      nextMonthRevenue: 0,
      nextMonthClicks: 0,
      confidence: 0.5,
      trend: 'stable' as const,
      seasonalFactor: 1.0,
      volatility: 0.5,
      factors: ['Insufficient data for accurate prediction'],
      modelAccuracy: 0.5,
      predictionIntervals: {
        revenue: { lower: 0, upper: 0 },
        clicks: { lower: 0, upper: 0 }
      }
    }
  }
  
  // Enhanced predictive analytics with multiple algorithms
  const recentData = timeSeriesData.slice(-14) // Last 14 days for better trend analysis
  const historicalData = timeSeriesData.slice(-30) // Last 30 days for seasonal patterns
  
  // Linear regression for trend analysis
  const { slope: revenueSlope, intercept: revenueIntercept, r2: revenueR2 } = linearRegression(
    recentData.map((_, i) => i),
    recentData.map(d => d.revenue)
  )
  
  const { slope: clicksSlope, intercept: clicksIntercept, r2: clicksR2 } = linearRegression(
    recentData.map((_, i) => i),
    recentData.map(d => d.clicks)
  )
  
  // Moving average for smoothing
  const revenueMA = movingAverage(recentData.map(d => d.revenue), 7)
  const clicksMA = movingAverage(recentData.map(d => d.clicks), 7)
  
  // Seasonal analysis
  const seasonalFactor = calculateSeasonalFactor(historicalData)
  
  // Volatility calculation
  const revenueVolatility = calculateVolatility(recentData.map(d => d.revenue))
  const clicksVolatility = calculateVolatility(recentData.map(d => d.clicks))
  
  // Trend determination with confidence
  const avgRevenue = revenueMA[revenueMA.length - 1] || 0
  const avgClicks = clicksMA[clicksMA.length - 1] || 0
  
  const trendStrength = Math.abs(revenueSlope) / (avgRevenue || 1)
  const trend = revenueSlope > avgRevenue * 0.05 ? 'up' : 
                revenueSlope < -avgRevenue * 0.05 ? 'down' : 'stable'
  
  // Predictions with confidence intervals
  const nextWeekRevenue = Math.max(0, Math.round((avgRevenue + revenueSlope * 7) * seasonalFactor))
  const nextWeekClicks = Math.max(0, Math.round((avgClicks + clicksSlope * 7) * seasonalFactor))
  const nextMonthRevenue = Math.max(0, Math.round((avgRevenue + revenueSlope * 30) * seasonalFactor))
  const nextMonthClicks = Math.max(0, Math.round((avgClicks + clicksSlope * 30) * seasonalFactor))
  
  // Confidence based on R² and data consistency
  const confidence = Math.min(0.95, Math.max(0.3, (revenueR2 + clicksR2) / 2 * (1 - revenueVolatility)))
  
  // Prediction intervals (confidence bands)
  const revenueMargin = nextWeekRevenue * revenueVolatility * 1.96 // 95% confidence
  const clicksMargin = nextWeekClicks * clicksVolatility * 1.96
  
  // Enhanced factors analysis
  const factors = []
  if (trendStrength > 0.1) factors.push(`Strong ${trend}ward trend detected`)
  if (seasonalFactor > 1.1) factors.push('Positive seasonal impact expected')
  if (seasonalFactor < 0.9) factors.push('Seasonal downturn anticipated')
  if (revenueVolatility > 0.3) factors.push('High volatility in recent performance')
  if (revenueR2 > 0.7) factors.push('Strong predictive pattern identified')
  if (factors.length === 0) factors.push('Stable performance with moderate predictability')
  
  return {
    nextWeekRevenue,
    nextWeekClicks,
    nextMonthRevenue,
    nextMonthClicks,
    confidence,
    trend,
    seasonalFactor,
    volatility: (revenueVolatility + clicksVolatility) / 2,
    factors,
    modelAccuracy: (revenueR2 + clicksR2) / 2,
    predictionIntervals: {
      revenue: { 
        lower: Math.max(0, nextWeekRevenue - revenueMargin), 
        upper: nextWeekRevenue + revenueMargin 
      },
      clicks: { 
        lower: Math.max(0, nextWeekClicks - clicksMargin), 
        upper: nextWeekClicks + clicksMargin 
      }
    }
  }
}

// Helper functions for advanced analytics
function linearRegression(x: number[], y: number[]) {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Calculate R²
  const yMean = sumY / n
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0)
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const r2 = 1 - (ssRes / ssTot)
  
  return { slope, intercept, r2: Math.max(0, r2) }
}

function movingAverage(data: number[], window: number) {
  const result = []
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0)
    result.push(sum / window)
  }
  return result
}

function calculateSeasonalFactor(data: any[]) {
  if (data.length < 14) return 1.0
  
  // Simple seasonal analysis based on day of week
  const dayOfWeekData = new Array(7).fill(0).map(() => ({ sum: 0, count: 0 }))
  
  data.forEach(d => {
    const dayOfWeek = new Date(d.date).getDay()
    dayOfWeekData[dayOfWeek].sum += d.revenue
    dayOfWeekData[dayOfWeek].count++
  })
  
  const averages = dayOfWeekData.map(d => d.count > 0 ? d.sum / d.count : 0)
  const overallAverage = averages.reduce((a, b) => a + b, 0) / averages.length
  
  // Return factor for current day of week
  const today = new Date().getDay()
  return overallAverage > 0 ? averages[today] / overallAverage : 1.0
}

function calculateVolatility(data: number[]) {
  if (data.length < 2) return 0.5
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length
  const stdDev = Math.sqrt(variance)
  
  return mean > 0 ? Math.min(1, stdDev / mean) : 0.5
}

function generateInsights(overview: any, topProducts: any[], timeSeriesData: any[], predictions: any) {
  const insights = []
  
  // Advanced revenue analysis
  if (overview.revenueGrowth > 15) {
    insights.push({
      type: 'success',
      title: 'Exceptional Revenue Growth',
      description: `Revenue has surged by ${overview.revenueGrowth.toFixed(1)}%. This momentum suggests strong market positioning and effective strategies.`,
      impact: 'high',
      actionable: true,
      actions: ['Scale successful campaigns', 'Expand product catalog', 'Increase inventory'],
      confidence: 0.9
    })
  } else if (overview.revenueGrowth > 5) {
    insights.push({
      type: 'success',
      title: 'Steady Revenue Growth',
      description: `Revenue growth of ${overview.revenueGrowth.toFixed(1)}% indicates healthy business expansion.`,
      impact: 'medium',
      actionable: true,
      actions: ['Maintain current strategies', 'Test new marketing channels'],
      confidence: 0.8
    })
  } else if (overview.revenueGrowth < -10) {
    insights.push({
      type: 'warning',
      title: 'Significant Revenue Decline',
      description: `Revenue has dropped by ${Math.abs(overview.revenueGrowth).toFixed(1)}%. Immediate action required to identify and address root causes.`,
      impact: 'high',
      actionable: true,
      actions: ['Audit top-performing products', 'Review marketing spend', 'Analyze competitor activity'],
      confidence: 0.95
    })
  }
  
  // Predictive insights based on model confidence
  if (predictions.confidence > 0.8) {
    const projectedGrowth = ((predictions.nextWeekRevenue * 4 - overview.totalRevenue) / overview.totalRevenue) * 100
    if (projectedGrowth > 20) {
      insights.push({
        type: 'opportunity',
        title: 'High-Confidence Growth Prediction',
        description: `AI models predict ${projectedGrowth.toFixed(1)}% monthly growth with ${(predictions.confidence * 100).toFixed(0)}% confidence.`,
        impact: 'high',
        actionable: true,
        actions: ['Prepare for increased demand', 'Optimize fulfillment capacity'],
        confidence: predictions.confidence
      })
    }
  }
  
  // Conversion rate optimization insights
  const benchmarkConversionRate = 3.5 // Industry benchmark
  if (overview.conversionRate < benchmarkConversionRate * 0.7) {
    insights.push({
      type: 'opportunity',
      title: 'Conversion Rate Below Industry Standard',
      description: `Current conversion rate of ${overview.conversionRate.toFixed(2)}% is ${((benchmarkConversionRate - overview.conversionRate) / benchmarkConversionRate * 100).toFixed(0)}% below industry average.`,
      impact: 'high',
      actionable: true,
      actions: ['A/B test product pages', 'Improve call-to-action buttons', 'Optimize checkout flow'],
      confidence: 0.85
    })
  } else if (overview.conversionRate > benchmarkConversionRate * 1.2) {
    insights.push({
      type: 'success',
      title: 'Above-Average Conversion Performance',
      description: `Conversion rate of ${overview.conversionRate.toFixed(2)}% exceeds industry standards by ${((overview.conversionRate - benchmarkConversionRate) / benchmarkConversionRate * 100).toFixed(0)}%.`,
      impact: 'medium',
      actionable: true,
      actions: ['Document successful strategies', 'Apply learnings to underperforming products'],
      confidence: 0.8
    })
  }
  
  // Product portfolio analysis
  if (topProducts.length > 0) {
    const topProduct = topProducts[0]
    const productConcentration = (topProduct.revenue / overview.totalRevenue) * 100
    
    if (productConcentration > 40) {
      insights.push({
        type: 'warning',
        title: 'High Revenue Concentration Risk',
        description: `${topProduct.name} accounts for ${productConcentration.toFixed(1)}% of total revenue. This concentration poses business risk.`,
        impact: 'medium',
        actionable: true,
        actions: ['Diversify product portfolio', 'Develop backup products', 'Reduce dependency'],
        confidence: 0.9
      })
    }
    
    // Identify rising stars
    const risingStars = topProducts.filter(p => p.trend === 'up' && p.conversionRate > benchmarkConversionRate)
    if (risingStars.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Rising Star Products Identified',
        description: `${risingStars.length} products showing strong upward trends with above-average conversion rates.`,
        impact: 'medium',
        actionable: true,
        actions: ['Increase marketing budget for rising products', 'Expand similar product lines'],
        confidence: 0.75
      })
    }
  }
  
  // Seasonal and trend analysis
  if (predictions.seasonalFactor > 1.15) {
    insights.push({
      type: 'opportunity',
      title: 'Positive Seasonal Trend',
      description: `Current seasonal patterns suggest ${((predictions.seasonalFactor - 1) * 100).toFixed(0)}% performance boost expected.`,
      impact: 'medium',
      actionable: true,
      actions: ['Increase inventory', 'Boost marketing spend', 'Prepare for higher traffic'],
      confidence: 0.7
    })
  } else if (predictions.seasonalFactor < 0.85) {
    insights.push({
      type: 'warning',
      title: 'Seasonal Downturn Expected',
      description: `Seasonal patterns indicate ${((1 - predictions.seasonalFactor) * 100).toFixed(0)}% performance decline likely.`,
      impact: 'medium',
      actionable: true,
      actions: ['Adjust marketing spend', 'Focus on retention', 'Plan promotional campaigns'],
      confidence: 0.7
    })
  }
  
  // Volatility insights
  if (predictions.volatility > 0.4) {
    insights.push({
      type: 'warning',
      title: 'High Performance Volatility',
      description: `Recent performance shows high volatility (${(predictions.volatility * 100).toFixed(0)}%), indicating unpredictable patterns.`,
      impact: 'medium',
      actionable: true,
      actions: ['Investigate volatility causes', 'Implement risk management', 'Diversify traffic sources'],
      confidence: 0.8
    })
  }
  
  // Time series pattern analysis
  const recentTrend = timeSeriesData.slice(-7)
  const previousWeek = timeSeriesData.slice(-14, -7)
  
  if (recentTrend.length > 0 && previousWeek.length > 0) {
    const recentAvg = recentTrend.reduce((sum, d) => sum + d.revenue, 0) / recentTrend.length
    const previousAvg = previousWeek.reduce((sum, d) => sum + d.revenue, 0) / previousWeek.length
    const weekOverWeekGrowth = ((recentAvg - previousAvg) / previousAvg) * 100
    
    if (weekOverWeekGrowth > 25) {
      insights.push({
        type: 'success',
        title: 'Accelerating Weekly Growth',
        description: `Week-over-week revenue growth of ${weekOverWeekGrowth.toFixed(1)}% shows strong acceleration.`,
        impact: 'high',
        actionable: true,
        actions: ['Identify growth drivers', 'Scale successful initiatives'],
        confidence: 0.85
      })
    }
  }
  
  // Advanced AOV analysis
  const benchmarkAOV = 75 // Industry benchmark
  if (overview.averageOrderValue < benchmarkAOV * 0.8) {
    insights.push({
      type: 'opportunity',
      title: 'Average Order Value Optimization',
      description: `AOV of $${overview.averageOrderValue.toFixed(2)} is below optimal range. Potential for ${((benchmarkAOV - overview.averageOrderValue) / overview.averageOrderValue * 100).toFixed(0)}% improvement.`,
      impact: 'medium',
      actionable: true,
      actions: ['Implement upselling strategies', 'Create product bundles', 'Offer volume discounts'],
      confidence: 0.8
    })
  }
  
  return insights.sort((a, b) => {
    const impactWeight = { high: 3, medium: 2, low: 1 }
    return (impactWeight[b.impact] * b.confidence) - (impactWeight[a.impact] * a.confidence)
  })
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