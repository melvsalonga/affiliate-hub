import { NextRequest, NextResponse } from 'next/server'
import { FeatureFlagManager } from '@/lib/feature-flags/feature-flags'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flag = await FeatureFlagManager.toggleFlag(params.key)

    return NextResponse.json({
      success: true,
      data: flag,
      message: `Feature flag ${flag.isActive ? 'enabled' : 'disabled'} successfully`,
    })
  } catch (error) {
    console.error('Error toggling feature flag:', error)
    return NextResponse.json(
      { error: 'Failed to toggle feature flag' },
      { status: 500 }
    )
  }
}