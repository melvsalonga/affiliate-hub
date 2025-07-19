import { NextRequest, NextResponse } from 'next/server'
import { CompetitorAnalysisService } from '@/lib/services/competitor-analysis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const report = await CompetitorAnalysisService.generateMarketIntelligenceReport(
      categoryId || undefined
    )

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating market intelligence report:', error)
    return NextResponse.json(
      { error: 'Failed to generate market intelligence report' },
      { status: 500 }
    )
  }
}