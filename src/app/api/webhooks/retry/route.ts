import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhook-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process failed webhook deliveries
    const result = await WebhookService.retryFailedDeliveries()

    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} failed deliveries`,
    })
  } catch (error) {
    console.error('Error retrying webhook deliveries:', error)
    return NextResponse.json(
      { error: 'Failed to retry webhook deliveries' },
      { status: 500 }
    )
  }
}