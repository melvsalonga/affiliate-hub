import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhook-service'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { WebhookEvent } from '@prisma/client'

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  url: z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.nativeEnum(WebhookEvent)),
  headers: z.record(z.string()).optional(),
  retryAttempts: z.number().min(0).max(10).optional(),
  timeout: z.number().min(5).max(300).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('active')
    const event = searchParams.get('event') as WebhookEvent | null

    const filters: any = {}
    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }
    if (event) {
      filters.event = event
    }

    const webhooks = await WebhookService.getWebhooks(filters)

    return NextResponse.json({
      success: true,
      data: webhooks,
    })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWebhookSchema.parse(body)

    const webhook = await WebhookService.createWebhook({
      ...validatedData,
      createdBy: user.id,
    })

    return NextResponse.json({
      success: true,
      data: webhook,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating webhook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}