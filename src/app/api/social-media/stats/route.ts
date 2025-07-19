import { NextRequest, NextResponse } from 'next/server'
import { SocialMediaService } from '@/lib/services/social-media'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (postId) {
      const stats = await SocialMediaService.getEngagementStats(postId)
      return NextResponse.json({
        success: true,
        data: stats,
      })
    }

    // Return overall social media stats
    const stats = await SocialMediaService.getSocialMediaStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching social media stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}