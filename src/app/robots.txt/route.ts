import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://linkvault-pro.com'
  
  const robotsTxt = `User-agent: *
Allow: /

# Allow crawling of product pages
Allow: /products/
Allow: /categories/
Allow: /reviews/
Allow: /comparisons/
Allow: /buying-guides/

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /l/

# Disallow search and filter pages with parameters
Disallow: /*?*
Disallow: /search?*

# Allow specific search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  })
}