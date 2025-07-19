import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCompetitorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  domain: z.string().url().optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const competitor = await prisma.competitor.findUnique({
      where: { id: params.id },
      include: {
        analytics: true,
        products: {
          include: {
            priceHistory: {
              take: 10,
              orderBy: { recordedAt: 'desc' }
            }
          },
          orderBy: { updatedAt: 'desc' }
        },
        priceHistory: {
          take: 50,
          orderBy: { recordedAt: 'desc' }
        },
        _count: {
          select: {
            products: true,
            priceHistory: true
          }
        }
      }
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Error fetching competitor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch competitor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateCompetitorSchema.parse(body)

    const competitor = await prisma.competitor.update({
      where: { id: params.id },
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

    return NextResponse.json(competitor)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating competitor:', error)
    return NextResponse.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.competitor.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competitor:', error)
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}