import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to handle URL redirects
 * Note: Prisma calls are disabled in middleware due to edge runtime limitations
 */
export async function handleRedirects(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname
  
  // Skip redirect handling for API routes, static files, and admin routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin/') ||
    pathname.includes('.') // Static files
  ) {
    return null
  }
  
  // TODO: Implement redirect handling using edge-compatible storage
  // For now, we'll skip database redirects in middleware
  // Redirects can be handled at the page level instead
  
  return null
}

/**
 * Check if URL needs trailing slash normalization
 */
export function normalizeTrailingSlash(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  
  // Skip for API routes and files
  if (pathname.startsWith('/api/') || pathname.includes('.')) {
    return null
  }
  
  // Remove trailing slash except for root
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(0, -1)
    return NextResponse.redirect(url, 301)
  }
  
  return null
}

/**
 * Handle canonical URL redirects (www vs non-www, http vs https)
 */
export function handleCanonicalRedirects(request: NextRequest): NextResponse | null {
  const url = request.nextUrl
  const host = request.headers.get('host')
  
  if (!host) return null
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && url.protocol === 'http:') {
    const httpsUrl = url.clone()
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }
  
  // Handle www redirect (configure based on your preference)
  const preferWww = process.env.PREFER_WWW === 'true'
  const hasWww = host.startsWith('www.')
  
  if (preferWww && !hasWww) {
    const wwwUrl = url.clone()
    wwwUrl.host = `www.${host}`
    return NextResponse.redirect(wwwUrl, 301)
  } else if (!preferWww && hasWww) {
    const nonWwwUrl = url.clone()
    nonWwwUrl.host = host.replace('www.', '')
    return NextResponse.redirect(nonWwwUrl, 301)
  }
  
  return null
}