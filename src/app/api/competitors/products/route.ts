import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const competitorId = searchParams.get('competitorId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (competitorId) {
      where.competitorId = competitorId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { competitor: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.competitorProduct.findMany({
        where,
        include: {
          competitor: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          },
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
            take: 30,
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