import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { filters } = await request.json()

    const where: any = {}
    
    if (filters?.trendType) {
      where.trendType = filters.trendType
    }

    if (filters?.impact) {
      where.impact = filters.impact
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId
    }

    const trends = await prisma.marketTrend.findMany({
      where,
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Generate CSV content
    const csvHeaders = [
      'Title',
      'Type',
      'Impact',
      'Confidence',
      'Category',
      'Start Date',
      'End Date',
      'Insights',
      'Recommendations'
    ]

    const csvRows = trends.map(trend => [
      trend.title,
      trend.trendType,
      trend.impact,
      Math.round(trend.confidence * 100) + '%',
      trend.category?.name || 'N/A',
      new Date(trend.startDate).toLocaleDateString(),
      trend.endDate ? new Date(trend.endDate).toLocaleDateString() : 'Ongoing',
      trend.insights.join('; '),
      trend.recommendations.join('; ')
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="market-trends-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting market trends:', error)
    return NextResponse.json(
      { error: 'Failed to export market trends' },
      { status: 500 }
    )
  }
}