import { NextRequest, NextResponse } from 'next/server'
import { seoManager } from '@/lib/seo-manager'

export async function GET(request: NextRequest) {
  try {
    const audit = await seoManager.auditSiteSEO()
    
    return NextResponse.json({
      success: true,
      audit
    })
  } catch (error) {
    console.error('Error performing SEO audit:', error)
    return NextResponse.json(
      { error: 'Failed to perform SEO audit' },
      { status: 500 }
    )
  }
}