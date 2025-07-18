import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LinkManagementService } from '@/lib/services/link-management'

const bulkProcessSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(100),
  options: z.object({
    extractProductInfo: z.boolean().default(true),
    validateLink: z.boolean().default(true),
    createShortUrl: z.boolean().default(true),
    customDomain: z.string().url().optional(),
    batchSize: z.number().min(1).max(20).default(10),
    autoCreateProduct: z.boolean().default(false),
    categoryId: z.string().uuid().optional(),
  }).default({})
})

const bulkReportSchema = z.object({
  linkIds: z.array(z.string().uuid()).min(1),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'process':
        return await handleBulkProcess(body)
      case 'report':
        return await handleBulkReport(body)
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: process, report'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Bulk operation error:', error)
    
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

async function handleBulkProcess(body: any) {
  const { urls, options } = bulkProcessSchema.parse(body)

  try {
    const results = await LinkManagementService.bulkProcessUrls(urls, options)
    
    const summary = {
      total: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      platforms: {} as Record<string, number>
    }

    // Count platforms
    results.forEach(result => {
      if (result.platformDetection) {
        const platform = result.platformDetection.platform
        summary.platforms[platform] = (summary.platforms[platform] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        summary,
        results
      }
    })

  } catch (error) {
    console.error('Bulk processing failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Bulk processing failed'
    }, { status: 500 })
  }
}

async function handleBulkReport(body: any) {
  const { linkIds, dateRange } = bulkReportSchema.parse(body)

  try {
    const report = await LinkManagementService.generateLinkPerformanceReport(
      linkIds,
      {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      }
    )

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Bulk report generation failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Report generation failed'
    }, { status: 500 })
  }
}