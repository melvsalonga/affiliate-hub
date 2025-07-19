import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeSEOScore } from '@/lib/seo-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        slug: true
      }
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const seoData = {
      title: content.metaTitle || content.title,
      description: content.metaDescription || '',
      keywords: content.keywords || [],
      canonicalUrl: `/content/${content.slug}`
    }

    const analysis = analyzeSEOScore(content.content, seoData)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing SEO:', error)
    return NextResponse.json({ error: 'Failed to analyze SEO' }, { status: 500 })
  }
}