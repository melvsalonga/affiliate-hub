import { NextRequest, NextResponse } from 'next/server'
import { EmailMarketingService } from '@/lib/services/email-marketing'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['newsletter', 'price_alert', 'deal_notification', 'welcome', 'abandoned_cart']),
  trigger: z.enum(['user_signup', 'price_drop', 'new_product', 'abandoned_cart']),
  delay: z.number().min(0).optional(),
  conditions: z.record(z.any()).optional(),
  templateId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock campaign data - in real implementation, fetch from database
    const campaigns = [
      {
        id: '1',
        name: 'Welcome Series',
        type: 'welcome',
        status: 'active',
        trigger: 'user_signup',
        subscribers: 1250,
        openRate: 45.2,
        clickRate: 8.7,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: 'Price Drop Alerts',
        type: 'price_alert',
        status: 'active',
        trigger: 'price_drop',
        subscribers: 890,
        openRate: 62.1,
        clickRate: 15.3,
        createdAt: '2024-01-10T14:30:00Z',
      },
      {
        id: '3',
        name: 'Weekly Deals Newsletter',
        type: 'newsletter',
        status: 'scheduled',
        trigger: 'manual',
        subscribers: 2100,
        openRate: 38.9,
        clickRate: 6.2,
        createdAt: '2024-01-20T09:00:00Z',
      },
    ]

    return NextResponse.json({
      success: true,
      data: campaigns,
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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
    const validatedData = createCampaignSchema.parse(body)

    const campaign = await EmailMarketingService.createAutomatedCampaign(
      validatedData.type,
      validatedData
    )

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}