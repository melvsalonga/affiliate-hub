import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhook-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { WebhookEvent } from '@prisma/client'

const triggerWebhookSchema = z.object({
  event: z.nativeEnum(WebhookEvent),
  data: z.record(z.any()),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, data } = triggerWebhookSchema.parse(body)

    const result = await WebhookService.triggerWebhook(event, data)

    return NextResponse.json({
      success: true,
      data: result,
      message: `Triggered ${result.triggered} webhooks for event ${event}`,
    })
  } catch (error) {
    console.error('Error triggering webhook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to trigger webhook' },
      { status: 500 }
    )
  }
}