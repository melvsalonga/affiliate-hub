import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://linkvault-pro.com'
    
    // Get all active products
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Get all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      }
    })

    // Get all published content
    const contentPages = await prisma.content.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        type: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Static pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/products', priority: '0.9', changefreq: 'daily' },
      { url: '/categories', priority: '0.8', changefreq: 'weekly' },
      { url: '/deals', priority: '0.8', changefreq: 'daily' },
      { url: '/reviews', priority: '0.7', changefreq: 'weekly' },
      { url: '/comparisons', priority: '0.7', changefreq: 'weekly' },
      { url: '/buying-guides', priority: '0.7', changefreq: 'weekly' },
    ]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  ${products.map(product => `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${categories.map(category => `
  <url>
    <loc>${baseUrl}/categories/${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  ${contentPages.map(content => `
  <url>
    <loc>${baseUrl}/content/${content.slug}</loc>
    <lastmod>${content.updatedAt.toISOString()}</lastmod>
    <changefreq>${content.type === 'REVIEW' ? 'monthly' : 'weekly'}</changefreq>
    <priority>${content.type === 'BUYING_GUIDE' ? '0.9' : content.type === 'REVIEW' ? '0.8' : '0.7'}</priority>
  </url>`).join('')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}