import { NextRequest, NextResponse } from 'next/server'
import { FeatureFlagManager } from '@/lib/feature-flags/feature-flags'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const createFlagSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string(),
  type: z.enum(['boolean', 'string', 'number', 'json']),
  value: z.any(),
  defaultValue: z.any(),
  isActive: z.boolean().default(true),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  conditions: z.array(z.object({
    type: z.enum(['user_role', 'user_id', 'user_attribute', 'date_range', 'random']),
    operator: z.enum(['equals', 'not_equals', 'in', 'not_in', 'greater_than', 'less_than', 'contains']),
    value: z.any(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flags = await FeatureFlagManager.getAllFlags()

    return NextResponse.json({
      success: true,
      data: flags,
    })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
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
    const validatedData = createFlagSchema.parse(body)

    const flag = await FeatureFlagManager.createFlag({
      ...validatedData,
      createdBy: user.id,
    })

    return NextResponse.json({
      success: true,
      data: flag,
      message: 'Feature flag created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating feature flag:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create feature flag' },
      { status: 500 }
    )
  }
}