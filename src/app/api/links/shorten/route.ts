import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LinkManagementService } from '@/lib/services/link-management'
import { prisma } from '@/lib/prisma'

const shortenLinkSchema = z.object({
  url: z.string().url('Invalid URL'),
  customDomain: z.string().url().optional(),
  customSlug: z.string().min(3).max(50).regex(/^[a-zA-Z0-9-_]+$/, 'Custom slug can only contain letters, numbers, hyphens, and underscores').optional(),
  linkId: z.string().uuid().optional(), // If provided, update existing affiliate link
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, customDomain, customSlug, linkId } = shortenLinkSchema.parse(body)

    // Create shortened URL
    const shortenedUrl = await LinkManagementService.createShortenedUrl(
      url,
      customDomain,
      customSlug
    )

    // If linkId is provided, update the existing affiliate link
    if (linkId) {
      const updatedLink = await prisma.affiliateLink.update({
        where: { id: linkId },
        data: { shortenedUrl },
        include: {
          platform: true,
          product: true
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          originalUrl: url,
          shortenedUrl,
          affiliateLink: updatedLink
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        originalUrl: url,
        shortenedUrl
      }
    })

  } catch (error) {
    console.error('URL shortening error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// Validate custom slug availability
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const domain = searchParams.get('domain')

  if (!slug) {
    return NextResponse.json({
      success: false,
      error: 'Slug parameter is required'
    }, { status: 400 })
  }

  try {
    const baseUrl = domain || process.env.NEXT_PUBLIC_APP_URL || 'https://linkvault.pro'
    const fullUrl = `${baseUrl}/l/${slug}`

    const existing = await prisma.affiliateLink.findFirst({
      where: { shortenedUrl: fullUrl }
    })

    return NextResponse.json({
      success: true,
      data: {
        slug,
        available: !existing,
        fullUrl: existing ? undefined : fullUrl
      }
    })

  } catch (error) {
    console.error('Slug validation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to validate slug'
    }, { status: 500 })
  }
}