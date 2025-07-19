import { NextRequest, NextResponse } from 'next/server'
import { SocialMediaService } from '@/lib/services/social-media'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const shareSchema = z.object({
  type: z.enum(['product', 'deal']),
  itemId: z.string(),
  platforms: z.array(z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'pinterest'])),
  customMessage: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, itemId, platforms, customMessage } = shareSchema.parse(body)

    let item
    let results

    if (type === 'product') {
      // Fetch product data
      const { data: product } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          category:categories(name, slug)
        `)
        .eq('id', itemId)
        .single()

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      results = await SocialMediaService.shareProduct(product, platforms, customMessage)
    } else {
      // For deals, we'll use the same product structure for now
      const { data: deal } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          category:categories(name, slug)
        `)
        .eq('id', itemId)
        .single()

      if (!deal) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
      }

      results = await SocialMediaService.shareDeal(deal, platforms, customMessage)
    }

    // Log the social media share for analytics
    console.log('Social media share:', {
      type,
      itemId,
      platforms,
      results,
      userId: user.id,
      timestamp: new Date().toISOString(),
    })

    const successfulShares = results.filter(r => r.success)
    const failedShares = results.filter(r => !r.success)

    return NextResponse.json({
      success: successfulShares.length > 0,
      data: {
        successful: successfulShares.length,
        failed: failedShares.length,
        results,
      },
      message: successfulShares.length > 0
        ? `Successfully shared to ${successfulShares.length} platform(s)`
        : 'Failed to share to any platforms',
    })
  } catch (error) {
    console.error('Social media share error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to share to social media' },
      { status: 500 }
    )
  }
}