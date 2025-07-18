import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LinkManagementService, linkRotationConfigSchema } from '@/lib/services/link-management'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const config = linkRotationConfigSchema.parse(body)

    // Setup link rotation
    const rotationConfig = await LinkManagementService.setupLinkRotation(config)

    return NextResponse.json({
      success: true,
      data: rotationConfig
    })

  } catch (error) {
    console.error('Link rotation setup error:', error)
    
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

// Get rotation configuration for a product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({
      success: false,
      error: 'Product ID is required'
    }, { status: 400 })
  }

  try {
    // Get all affiliate links for the product with analytics
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: {
        productId,
        isActive: true
      },
      include: {
        analytics: true,
        platform: true
      }
    })

    if (affiliateLinks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active affiliate links found for this product'
      }, { status: 404 })
    }

    // Calculate performance metrics for each link
    const linkPerformance = affiliateLinks.map(link => ({
      id: link.id,
      platform: link.platform.displayName,
      originalUrl: link.originalUrl,
      shortenedUrl: link.shortenedUrl,
      commission: link.commission,
      priority: link.priority,
      analytics: {
        totalClicks: link.analytics?.totalClicks || 0,
        totalConversions: link.analytics?.totalConversions || 0,
        totalRevenue: link.analytics?.totalRevenue || 0,
        conversionRate: link.analytics?.conversionRate || 0,
        averageOrderValue: link.analytics?.averageOrderValue || 0
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        productId,
        totalLinks: affiliateLinks.length,
        links: linkPerformance
      }
    })

  } catch (error) {
    console.error('Get rotation config error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get rotation configuration'
    }, { status: 500 })
  }
}