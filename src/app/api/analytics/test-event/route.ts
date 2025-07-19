import { NextRequest, NextResponse } from 'next/server'
import { realTimeAnalytics } from '@/lib/services/realtime-analytics'

// POST - Simulate a real-time event for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType = 'click', productId, orderValue } = body

    // Simulate different types of events
    const eventData = {
      productId: productId || `product_${Math.floor(Math.random() * 100)}`,
      orderValue: orderValue || (eventType === 'conversion' ? Math.floor(Math.random() * 500) + 50 : 0),
      commission: eventType === 'conversion' ? Math.floor(Math.random() * 50) + 10 : 0,
      userAgent: 'Test User Agent',
      referrer: 'https://test-referrer.com',
      ipAddress: '127.0.0.1'
    }

    // Record the test event
    await realTimeAnalytics.recordEvent(eventType, eventData)

    return NextResponse.json({ 
      success: true, 
      message: `Test ${eventType} event recorded`,
      data: eventData
    })
  } catch (error) {
    console.error('Test event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Trigger a random test event
export async function GET() {
  try {
    const eventTypes = ['click', 'conversion', 'view']
    const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    
    const eventData = {
      productId: `product_${Math.floor(Math.random() * 100)}`,
      orderValue: randomEventType === 'conversion' ? Math.floor(Math.random() * 500) + 50 : 0,
      commission: randomEventType === 'conversion' ? Math.floor(Math.random() * 50) + 10 : 0,
      userAgent: 'Test User Agent',
      referrer: 'https://test-referrer.com',
      ipAddress: '127.0.0.1'
    }

    await realTimeAnalytics.recordEvent(randomEventType, eventData)

    return NextResponse.json({ 
      success: true, 
      message: `Random test ${randomEventType} event recorded`,
      eventType: randomEventType,
      data: eventData
    })
  } catch (error) {
    console.error('Random test event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}