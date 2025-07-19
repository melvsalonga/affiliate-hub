import { NextRequest, NextResponse } from 'next/server'
import { EmailMarketingService } from '@/lib/services/email-marketing'
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
    const campaignId = searchParams.get('campaignId')

    if (campaignId) {
      const stats = await EmailMarketingService.getCampaignStats(campaignId)
      return NextResponse.json({
        success: true,
        data: stats,
      })
    }

    // Return overall subscriber stats
    const subscriberStats = await EmailMarketingService.getSubscriberStats()
    
    return NextResponse.json({
      success: true,
      data: {
        subscribers: subscriberStats,
        campaigns: {
          total: 12,
          active: 8,
          scheduled: 2,
          draft: 2,
        },
        performance: {
          averageOpenRate: 42.3,
          averageClickRate: 8.9,
          averageUnsubscribeRate: 0.8,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching email marketing stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}