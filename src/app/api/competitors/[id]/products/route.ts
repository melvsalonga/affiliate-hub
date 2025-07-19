import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCompetitorProductSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1).max(500),
  url: z.string().url(),
  currentPrice: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  currency: z.string().default('USD'),
  availability: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'LIMITED_STOCK', 'DISCONTINUED', 'UNKNOWN']).default('IN_STOCK'),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {
      competitorId: params.id
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.competitorProduct.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              currentPrice: true,
              currency: true
            }
          },
          priceHistory: {
            take: 10,
            orderBy: { recordedAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.competitorProduct.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching competitor products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitor products' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = createCompetitorProductSchema.parse(body)

    // Check if competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: params.id }
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const competitorProduct = await prisma.competitorProduct.create({
      data: {
        ...validatedData,
        competitorId: params.id,
        lastChecked: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            currentPrice: true,
            currency: true
          }
        }
      }
    })

    // Create initial price history entry
    await prisma.competitorPriceHistory.create({
      data: {
        competitorId: params.id,
        competitorProductId: competitorProduct.id,
        price: validatedData.currentPrice,
        originalPrice: validatedData.originalPrice,
        currency: validatedData.currency,
        availability: validatedData.availability
      }
    })

    return NextResponse.json(competitorProduct, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating competitor product:', error)
    return NextResponse.json(
      { error: 'Failed to create competitor product' },
      { status: 500 }
    )
  }
}