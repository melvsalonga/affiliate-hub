import { NextRequest, NextResponse } from 'next/server'
import { CompetitorAnalysisService } from '@/lib/services/competitor-analysis'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { competitorId, action } = body

    switch (action) {
      case 'analyze_competitor':
        if (!competitorId) {
          return NextResponse.json(
            { error: 'Competitor ID is required' },
            { status: 400 }
          )
        }
        
        const analysis = await CompetitorAnalysisService.analyzeCompetitor(competitorId)
        return NextResponse.json(analysis)

      case 'monitor_prices':
        await CompetitorAnalysisService.monitorCompetitorPrices()
        return NextResponse.json({ success: true, message: 'Price monitoring completed' })

      case 'generate_intelligence':
        await CompetitorAnalysisService.generateAutomatedIntelligence()
        return NextResponse.json({ success: true, message: 'Intelligence generation completed' })

      case 'analyze_all':
        // Analyze all active competitors
        const competitors = await prisma.competitor.findMany({
          where: { isActive: true },
          select: { id: true }
        })

        const analyses = await Promise.all(
          competitors.map(c => CompetitorAnalysisService.analyzeCompetitor(c.id))
        )

        return NextResponse.json({
          success: true,
          message: `Analyzed ${analyses.length} competitors`,
          analyses
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in competitor analysis:', error)
    return NextResponse.json(
      { error: 'Failed to perform competitor analysis' },
      { status: 500 }
    )
  }
}