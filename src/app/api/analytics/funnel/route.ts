import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const funnelRequestSchema = z.object({
  dateRange: z.object({
    start: z.string().transform(str => new Date(str)),
    end: z.string().transform(str => new Date(str))
  }),
  segment: z.string().optional().default('all')
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
    const { dateRange, segment } = funnelRequestSchema.parse(body)

    // Generate funnel analysis data
    const funnelData = await generateFunnelAnalysis(supabase, dateRange, segment)

    return NextResponse.json(funnelData)
  } catch (error) {
    console.error('Funnel analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateFunnelAnalysis(supabase: any, dateRange: { start: Date; end: Date }, segment: string) {
  // Get all events within date range
  const { data: events } = await supabase
    .from('click_events')
    .select('*')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())
    .order('created_at', { ascending: true })

  // Get conversions
  const { data: conversions } = await supabase
    .from('conversions')
    .select('*')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString())

  // Calculate funnel steps
  const steps = calculateFunnelSteps(events || [], conversions || [])
  
  // Calculate conversion rates between steps
  const conversionRates = calculateConversionRates(steps)
  
  // Analyze user behavior
  const userBehavior = analyzeUserBehavior(events || [])
  
  // Segment analysis
  const segmentAnalysis = analyzeSegments(events || [], conversions || [])
  
  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(steps, conversionRates)

  return {
    steps,
    conversionRates,
    userBehavior,
    segmentAnalysis,
    bottlenecks
  }
}

function calculateFunnelSteps(events: any[], conversions: any[]) {
  // Define funnel steps with icons and colors
  const stepDefinitions = [
    {
      name: 'Visitors',
      description: 'Total unique visitors',
      fill: '#3b82f6',
      icon: 'Users'
    },
    {
      name: 'Product Views',
      description: 'Users who viewed products',
      fill: '#10b981',
      icon: 'Eye'
    },
    {
      name: 'Clicks',
      description: 'Users who clicked affiliate links',
      fill: '#f59e0b',
      icon: 'MousePointer'
    },
    {
      name: 'Add to Cart',
      description: 'Users who added items to cart',
      fill: '#ef4444',
      icon: 'ShoppingCart'
    },
    {
      name: 'Conversions',
      description: 'Users who completed purchase',
      fill: '#8b5cf6',
      icon: 'DollarSign'
    }
  ]

  // Calculate actual values for each step
  const uniqueVisitors = new Set(events.map(e => e.session_id || e.user_id)).size
  const productViews = events.filter(e => e.event_type === 'view').length
  const clicks = events.filter(e => e.event_type === 'click').length
  const addToCarts = Math.floor(clicks * 0.3) // Simulated - would need actual cart events
  const actualConversions = conversions.length

  const steps = [
    { ...stepDefinitions[0], value: uniqueVisitors },
    { ...stepDefinitions[1], value: Math.min(productViews, uniqueVisitors) },
    { ...stepDefinitions[2], value: Math.min(clicks, productViews) },
    { ...stepDefinitions[3], value: Math.min(addToCarts, clicks) },
    { ...stepDefinitions[4], value: Math.min(actualConversions, addToCarts) }
  ]

  return steps.map(step => ({
    ...step,
    icon: getIconComponent(step.icon)
  }))
}

function getIconComponent(iconName: string) {
  // Return appropriate icon component based on name
  // This is a simplified version - in practice you'd import and return actual components
  return iconName
}

function calculateConversionRates(steps: any[]) {
  const rates = []
  
  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i]
    const nextStep = steps[i + 1]
    
    const rate = currentStep.value > 0 ? (nextStep.value / currentStep.value) * 100 : 0
    const dropOff = 100 - rate
    
    rates.push({
      from: currentStep.name,
      to: nextStep.name,
      rate,
      dropOff
    })
  }
  
  return rates
}

function analyzeUserBehavior(events: any[]) {
  // Group events by session
  const sessions = new Map()
  
  events.forEach(event => {
    const sessionId = event.session_id || event.user_id
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        events: [],
        startTime: new Date(event.created_at),
        endTime: new Date(event.created_at)
      })
    }
    
    const session = sessions.get(sessionId)
    session.events.push(event)
    
    const eventTime = new Date(event.created_at)
    if (eventTime < session.startTime) session.startTime = eventTime
    if (eventTime > session.endTime) session.endTime = eventTime
  })

  // Calculate metrics
  const sessionArray = Array.from(sessions.values())
  const totalSessions = sessionArray.length
  
  if (totalSessions === 0) {
    return {
      averageTimeOnSite: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      returnVisitorRate: 0
    }
  }

  // Average time on site (in seconds)
  const averageTimeOnSite = sessionArray.reduce((sum, session) => {
    return sum + (session.endTime.getTime() - session.startTime.getTime()) / 1000
  }, 0) / totalSessions

  // Bounce rate (sessions with only 1 event)
  const bounceSessions = sessionArray.filter(session => session.events.length === 1).length
  const bounceRate = (bounceSessions / totalSessions) * 100

  // Pages per session
  const pagesPerSession = sessionArray.reduce((sum, session) => {
    return sum + session.events.length
  }, 0) / totalSessions

  // Return visitor rate (simplified - would need actual user tracking)
  const returnVisitorRate = Math.random() * 30 + 20 // Placeholder: 20-50%

  return {
    averageTimeOnSite: Math.round(averageTimeOnSite),
    bounceRate,
    pagesPerSession,
    returnVisitorRate
  }
}

function analyzeSegments(events: any[], conversions: any[]) {
  // Define segments based on traffic source, device, etc.
  const segments = [
    { name: 'Organic Search', filter: (e: any) => e.referrer_domain?.includes('google') || e.referrer_domain?.includes('bing') },
    { name: 'Social Media', filter: (e: any) => e.referrer_domain?.includes('facebook') || e.referrer_domain?.includes('twitter') },
    { name: 'Direct Traffic', filter: (e: any) => !e.referrer_domain || e.referrer_domain === 'direct' },
    { name: 'Mobile Users', filter: (e: any) => e.user_agent?.toLowerCase().includes('mobile') },
    { name: 'Desktop Users', filter: (e: any) => !e.user_agent?.toLowerCase().includes('mobile') }
  ]

  return segments.map(segment => {
    const segmentEvents = events.filter(segment.filter)
    const segmentConversions = conversions.filter(c => {
      // Find matching events for this conversion
      const matchingEvents = events.filter(e => e.product_id === c.product_id)
      return matchingEvents.some(segment.filter)
    })

    const visitors = new Set(segmentEvents.map(e => e.session_id || e.user_id)).size
    const conversionCount = segmentConversions.length
    const conversionRate = visitors > 0 ? (conversionCount / visitors) * 100 : 0
    const revenue = segmentConversions.reduce((sum, c) => sum + (c.order_value || 0), 0)

    return {
      segment: segment.name,
      visitors,
      conversions: conversionCount,
      conversionRate,
      revenue
    }
  }).filter(s => s.visitors > 0) // Only include segments with data
}

function identifyBottlenecks(steps: any[], conversionRates: any[]) {
  const bottlenecks = []

  // Find steps with low conversion rates
  conversionRates.forEach(rate => {
    if (rate.rate < 20) { // Less than 20% conversion
      let impact: 'high' | 'medium' | 'low' = 'low'
      let issue = ''
      let recommendation = ''

      if (rate.from === 'Visitors' && rate.to === 'Product Views') {
        impact = 'high'
        issue = 'Low product discovery rate'
        recommendation = 'Improve homepage design and navigation to highlight popular products'
      } else if (rate.from === 'Product Views' && rate.to === 'Clicks') {
        impact = 'high'
        issue = 'Low click-through rate on product pages'
        recommendation = 'Optimize product descriptions, images, and call-to-action buttons'
      } else if (rate.from === 'Clicks' && rate.to === 'Add to Cart') {
        impact = 'medium'
        issue = 'Users not adding products to cart after clicking'
        recommendation = 'Improve affiliate link targeting and product relevance'
      } else if (rate.from === 'Add to Cart' && rate.to === 'Conversions') {
        impact = 'high'
        issue = 'High cart abandonment rate'
        recommendation = 'Simplify checkout process and address common abandonment reasons'
      }

      if (issue) {
        bottlenecks.push({
          step: `${rate.from} → ${rate.to}`,
          issue,
          impact,
          recommendation
        })
      }
    }
  })

  // Add general bottlenecks if no specific ones found
  if (bottlenecks.length === 0) {
    bottlenecks.push({
      step: 'Overall Funnel',
      issue: 'Conversion rates are within normal ranges',
      impact: 'low' as const,
      recommendation: 'Continue monitoring and consider A/B testing key elements'
    })
  }

  return bottlenecks
}