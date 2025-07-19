import { NextRequest, NextResponse } from 'next/server'
import { FeatureFlagManager } from '@/lib/feature-flags/feature-flags'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flag = await FeatureFlagManager.getFlag(params.key)

    if (!flag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: flag,
    })
  } catch (error) {
    console.error('Error fetching feature flag:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature flag' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    const flag = await FeatureFlagManager.updateFlag(params.key, updates)

    return NextResponse.json({
      success: true,
      data: flag,
      message: 'Feature flag updated successfully',
    })
  } catch (error) {
    console.error('Error updating feature flag:', error)
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await FeatureFlagManager.deleteFlag(params.key)

    return NextResponse.json({
      success: true,
      message: 'Feature flag deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting feature flag:', error)
    return NextResponse.json(
      { error: 'Failed to delete feature flag' },
      { status: 500 }
    )
  }
}