import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMarketTrendSchema = z.object({
  categoryId: z.string().uuid().optional(),
  trendType: z.enum(['PRICE', 'DEMAND', 'MARKET_SHARE', 'SEASONAL', 'COMPETITIVE', 'TECHNOLOGY', 'CONSUMER_BEHAVIOR']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  confidence: z.number().min(0).max(1),
  dataPoints: z.array(z.object({
    date: z.string(),
    value: z.number(),
    metadata: z.record(z.any()).optional()
  })),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const categoryId = searchParams.get('categoryId')
    const trendType = searchParams.get('trendType')
    const impact = searchParams.get('impact')
    const isActive = searchParams.get('active')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (categoryId) {
      where.categoryId = categoryId
    }

    if (trendType) {
      where.trendType = trendType
    }

    if (impact) {
      where.impact = impact
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [trends, total] = await Promise.all([
      prisma.marketTrend.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.marketTrend.count({ where })
    ])

    return NextResponse.json({
      trends,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching market trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market trends' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createMarketTrendSchema.parse(body)

    const trend = await prisma.marketTrend.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(trend, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating market trend:', error)
    return NextResponse.json(
      { error: 'Failed to create market trend' },
      { status: 500 }
    )
  }
}