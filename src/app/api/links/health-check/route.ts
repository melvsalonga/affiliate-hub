import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LinkManagementService } from '@/lib/services/link-management'
import { prisma } from '@/lib/prisma'

const healthCheckSchema = z.object({
  linkIds: z.array(z.string().uuid()).optional(),
  productId: z.string().uuid().optional(),
  platformId: z.string().uuid().optional(),
  batchSize: z.number().min(1).max(100).default(50),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { linkIds, productId, platformId, batchSize } = healthCheckSchema.parse(body)

    let targetLinkIds: string[] = []

    if (linkIds) {
      targetLinkIds = linkIds
    } else {
      // Get links based on filters
      const whereClause: any = { isActive: true }
      
      if (productId) whereClause.productId = productId
      if (platformId) whereClause.platformId = platformId

      const links = await prisma.affiliateLink.findMany({
        where: whereClause,
        select: { id: true },
        take: batchSize
      })

      targetLinkIds = links.map(link => link.id)
    }

    if (targetLinkIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No links found to check',
          results: []
        }
      })
    }

    // Perform health check
    const healthCheckResults = await LinkManagementService.performHealthCheck(targetLinkIds)

    // Update link status based on results
    const unhealthyLinks = healthCheckResults.filter(result => !result.isHealthy)
    
    if (unhealthyLinks.length > 0) {
      await prisma.affiliateLink.updateMany({
        where: {
          id: { in: unhealthyLinks.map(link => link.linkId) }
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
    }

    // Log health check results (you might want to create a health_check_logs table)
    const summary = {
      totalChecked: healthCheckResults.length,
      healthy: healthCheckResults.filter(r => r.isHealthy).length,
      unhealthy: unhealthyLinks.length,
      averageResponseTime: healthCheckResults.reduce((sum, r) => sum + r.responseTime, 0) / healthCheckResults.length
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        results: healthCheckResults
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Batch health check for all links
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const batchSize = parseInt(searchParams.get('batchSize') || '50')

  try {
    await LinkManagementService.batchHealthCheck(batchSize)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Batch health check completed successfully'
      }
    })

  } catch (error) {
    console.error('Batch health check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Batch health check failed'
    }, { status: 500 })
  }
}