import { NextRequest, NextResponse } from 'next/server'
import { SocialMediaService } from '@/lib/services/social-media'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schedulePostSchema = z.object({
  content: z.string().min(1),
  platforms: z.array(z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'pinterest'])),
  scheduledAt: z.string().datetime(),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = schedulePostSchema.parse(body)

    const scheduledPost = await SocialMediaService.schedulePost({
      ...validatedData,
      scheduledAt: new Date(validatedData.scheduledAt),
    })

    return NextResponse.json({
      success: true,
      data: scheduledPost,
      message: 'Post scheduled successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Schedule post error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    )
  }
}