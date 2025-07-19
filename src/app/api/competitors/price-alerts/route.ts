import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get recent price changes (simulated for demo)
    // In a real implementation, this would track actual price changes
    const recentPriceHistory = await prisma.competitorPriceHistory.findMany({
      include: {
        competitor: {
          select: {
            name: true
          }
        },
        competitorProduct: {
          select: {
            name: true,
            currentPrice: true
          }
        }
      },
      orderBy: { recordedAt: 'desc' },
      take: limit
    })

    // Generate alerts from price history
    const alerts = []
    const productPriceMap = new Map()

    for (const entry of recentPriceHistory) {
      const productKey = entry.competitorProductId
      
      if (productPriceMap.has(productKey)) {
        const previousEntry = productPriceMap.get(productKey)
        const oldPrice = Number(previousEntry.price)
        const newPrice = Number(entry.price)
        
        if (oldPrice !== newPrice) {
          const changePercent = ((newPrice - oldPrice) / oldPrice) * 100
          
          // Only include significant changes (>5%)
          if (Math.abs(changePercent) > 5) {
            alerts.push({
              id: entry.id,
              productName: entry.competitorProduct.name,
              competitorName: entry.competitor.name,
              oldPrice,
              newPrice,
              changePercent,
              detectedAt: entry.recordedAt
            })
          }
        }
      }
      
      productPriceMap.set(productKey, entry)
    }

    // Sort by most recent and limit results
    alerts.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())

    return NextResponse.json({
      alerts: alerts.slice(0, 20)
    })
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price alerts' },
      { status: 500 }
    )
  }
}