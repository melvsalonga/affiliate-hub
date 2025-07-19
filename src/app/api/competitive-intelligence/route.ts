import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createIntelligenceSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1),
  analysisType: z.enum(['PRICE_ANALYSIS', 'MARKET_POSITIONING', 'FEATURE_COMPARISON', 'CUSTOMER_SENTIMENT', 'MARKET_OPPORTUNITY', 'COMPETITIVE_LANDSCAPE']),
  keyFindings: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  recommendations: z.array(z.string()),
  dataSource: z.string(),
  confidenceLevel: z.number().min(0).max(1),
  impactScore: z.number().int().min(1).max(10),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  validUntil: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const analysisType = searchParams.get('analysisType')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (analysisType) {
      where.analysisType = analysisType
    }

    if (priority) {
      where.priority = priority
    }

    if (status) {
      where.status = status
    }

    const [intelligence, total] = await Promise.all([
      prisma.competitiveIntelligence.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'asc' }, // HIGH first
          { impactScore: 'desc' },
          { updatedAt: 'desc' }
        ]
      }),
      prisma.competitiveIntelligence.count({ where })
    ])

    return NextResponse.json({
      intelligence,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching competitive intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitive intelligence' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createIntelligenceSchema.parse(body)

    const intelligence = await prisma.competitiveIntelligence.create({
      data: {
        ...validatedData,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
      }
    })

    return NextResponse.json(intelligence, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating competitive intelligence:', error)
    return NextResponse.json(
      { error: 'Failed to create competitive intelligence' },
      { status: 500 }
    )
  }
}