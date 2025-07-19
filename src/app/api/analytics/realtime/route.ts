import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { realTimeAnalytics } from '@/lib/services/realtime-analytics'
import { wsManager } from '@/lib/websocket/server'

// GET - Get current real-time metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await realTimeAnalytics.getCurrentMetrics()
    
    // Add WebSocket connection info
    const connectionInfo = {
      connectedClients: wsManager.getConnectedClients(),
      analyticsSubscribers: wsManager.getClientsByChannel('analytics'),
      notificationSubscribers: wsManager.getClientsByChannel('notifications')
    }

    return NextResponse.json({
      ...metrics,
      connectionInfo
    })
  } catch (error) {
    console.error('Real-time analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Record a real-time event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventType, productId, orderValue, commission, userAgent, referrer } = body

    if (!eventType || !['click', 'conversion', 'view'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Record the event
    await realTimeAnalytics.recordEvent(eventType, {
      productId,
      orderValue,
      commission,
      userAgent: userAgent || request.headers.get('user-agent'),
      referrer: referrer || request.headers.get('referer'),
      ipAddress: ip
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Real-time event recording error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Trigger manual analytics update
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Trigger manual update
    await realTimeAnalytics.triggerUpdate()

    return NextResponse.json({ success: true, message: 'Analytics update triggered' })
  } catch (error) {
    console.error('Manual analytics update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}