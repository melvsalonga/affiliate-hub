import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LinkManagementService } from '@/lib/services/link-management'

const replaceLinksSchema = z.object({
  content: z.string().min(1),
  replacementMap: z.record(z.string().url(), z.string().url()).optional(),
  options: z.object({
    createShortUrls: z.boolean().default(true),
    customDomain: z.string().url().optional(),
    onlyAffiliateLinks: z.boolean().default(true)
  }).default({})
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, replacementMap, options } = replaceLinksSchema.parse(body)

    const processedContent = await LinkManagementService.replaceLinksInContent(
      content,
      replacementMap
    )

    // Extract statistics about the replacement
    const originalUrls = content.match(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi) || []
    const processedUrls = processedContent.match(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi) || []
    
    const stats = {
      originalUrlCount: originalUrls.length,
      processedUrlCount: processedUrls.length,
      replacedCount: originalUrls.length - processedUrls.length + (processedUrls.length - originalUrls.length),
      uniqueOriginalUrls: [...new Set(originalUrls)].length,
      uniqueProcessedUrls: [...new Set(processedUrls)].length
    }

    return NextResponse.json({
      success: true,
      data: {
        originalContent: content,
        processedContent,
        stats
      }
    })

  } catch (error) {
    console.error('Link replacement error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Link replacement failed'
    }, { status: 500 })
  }
}