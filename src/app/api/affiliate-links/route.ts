import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const platformId = searchParams.get('platformId')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}
    
    if (productId) whereClause.productId = productId
    if (platformId) whereClause.platformId = platformId
    if (isActive !== null) whereClause.isActive = isActive === 'true'

    // Get affiliate links with related data
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: whereClause,
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            displayName: true,
            logoUrl: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true
          }
        },
        analytics: {
          select: {
            totalClicks: true,
            totalConversions: true,
            totalRevenue: true,
            conversionRate: true,
            averageOrderValue: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.affiliateLink.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: affiliateLinks,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch affiliate links:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch affiliate links'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productId,
      platformId,
      originalUrl,
      shortenedUrl,
      commission = 0,
      isActive = true,
      priority = 0
    } = body

    // Validate required fields
    if (!productId || !platformId || !originalUrl) {
      return NextResponse.json({
        success: false,
        error: 'Product ID, Platform ID, and Original URL are required'
      }, { status: 400 })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 })
    }

    // Check if platform exists
    const platform = await prisma.platform.findUnique({
      where: { id: platformId }
    })

    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform not found'
      }, { status: 404 })
    }

    // Create affiliate link
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        productId,
        platformId,
        originalUrl,
        shortenedUrl,
        commission,
        isActive,
        priority
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            displayName: true,
            logoUrl: true
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: affiliateLink
    })

  } catch (error) {
    console.error('Failed to create affiliate link:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create affiliate link'
    }, { status: 500 })
  }
}