import { NextRequest, NextResponse } from 'next/server'
import { EmailMarketingService } from '@/lib/services/email-marketing'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  source: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, source } = subscribeSchema.parse(body)

    const results = await EmailMarketingService.subscribeToNewsletter(
      email,
      firstName,
      lastName
    )

    // Log subscription for analytics
    console.log('Newsletter subscription:', {
      email,
      firstName,
      lastName,
      source,
      results,
      timestamp: new Date().toISOString(),
    })

    const successfulSubscriptions = results.filter(r => r.success)
    const failedSubscriptions = results.filter(r => !r.success)

    return NextResponse.json({
      success: successfulSubscriptions.length > 0,
      data: {
        successful: successfulSubscriptions.length,
        failed: failedSubscriptions.length,
        results,
      },
      message: successfulSubscriptions.length > 0
        ? 'Successfully subscribed to newsletter'
        : 'Failed to subscribe to newsletter',
    })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    )
  }
}