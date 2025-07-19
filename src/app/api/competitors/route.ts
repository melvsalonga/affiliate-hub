import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCompetitorSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().url(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
})

const updateCompetitorSchema = createCompetitorSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const isActive = searchParams.get('active')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [competitors, total] = await Promise.all([
      prisma.competitor.findMany({
        where,
        include: {
          analytics: true,
          products: {
            take: 5,
            orderBy: { updatedAt: 'desc' }
          },
          _count: {
            select: {
              products: true,
              priceHistory: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.competitor.count({ where })
    ])

    return NextResponse.json({
      competitors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching competitors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCompetitorSchema.parse(body)

    const competitor = await prisma.competitor.create({
      data: validatedData,
      include: {
        analytics: true,
        _count: {
          select: {
            products: true,
            priceHistory: true
          }
        }
      }
    })

    return NextResponse.json(competitor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating competitor:', error)
    return NextResponse.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    )
  }
}