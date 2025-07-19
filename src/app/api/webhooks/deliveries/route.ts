import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhook-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WebhookDeliveryStatus, WebhookEvent } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('webhookId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as WebhookDeliveryStatus | null
    const event = searchParams.get('event') as WebhookEvent | null

    const options: any = { page, limit }
    if (status) options.status = status
    if (event) options.event = event

    const result = await WebhookService.getWebhookDeliveries(
      webhookId || undefined,
      options
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook deliveries' },
      { status: 500 }
    )
  }
}