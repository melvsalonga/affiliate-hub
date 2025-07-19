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
    const type = searchParams.get('type')

    if (type) {
      const template = await EmailMarketingService.getEmailTemplate(type)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: template,
      })
    }

    // Return all available templates
    const templates = [
      await EmailMarketingService.getEmailTemplate('price_alert'),
      await EmailMarketingService.getEmailTemplate('deal_notification'),
    ].filter(Boolean)

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}