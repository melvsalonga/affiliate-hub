import { NextRequest, NextResponse } from 'next/server'
import { CompetitorMonitoringService } from '@/lib/services/competitor-monitoring'

export async function GET(request: NextRequest) {
  try {
    const status = await CompetitorMonitoringService.getMonitoringStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting monitoring status:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'run_monitoring':
        await CompetitorMonitoringService.runAutomatedMonitoring()
        return NextResponse.json({ 
          success: true, 
          message: 'Automated monitoring completed successfully' 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error running monitoring:', error)
    return NextResponse.json(
      { error: 'Failed to run monitoring' },
      { status: 500 }
    )
  }
}