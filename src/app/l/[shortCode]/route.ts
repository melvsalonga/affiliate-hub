import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const { shortCode } = params
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkvault.pro'
    const shortenedUrl = `${baseUrl}/l/${shortCode}`

    // Find the affiliate link
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: { 
        shortenedUrl,
        isActive: true 
      },
      include: {
        product: true,
        platform: true,
        analytics: true
      }
    })

    if (!affiliateLink) {
      return NextResponse.redirect(`${baseUrl}/404`)
    }

    // Get request headers for analytics
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const referrer = headersList.get('referer') || ''
    const forwardedFor = headersList.get('x-forwarded-for') || ''
    const realIp = headersList.get('x-real-ip') || ''
    const ipAddress = forwardedFor.split(',')[0] || realIp || ''

    // Generate session ID (you might want to use a more sophisticated method)
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Parse user agent for device/browser info
    const deviceInfo = parseUserAgent(userAgent)

    // Track the click event
    try {
      await prisma.clickEvent.create({
        data: {
          linkId: affiliateLink.id,
          sessionId,
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
          referrer: referrer || undefined,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          timestamp: new Date()
        }
      })

      // Update link analytics
      await prisma.linkAnalytics.upsert({
        where: { linkId: affiliateLink.id },
        update: {
          totalClicks: { increment: 1 },
          lastUpdated: new Date()
        },
        create: {
          linkId: affiliateLink.id,
          totalClicks: 1,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          averageOrderValue: 0
        }
      })

      // Update product analytics
      await prisma.productAnalytics.upsert({
        where: { productId: affiliateLink.productId },
        update: {
          clicks: { increment: 1 },
          lastUpdated: new Date()
        },
        create: {
          productId: affiliateLink.productId,
          views: 0,
          clicks: 1,
          conversions: 0,
          revenue: 0
        }
      })
    } catch (analyticsError) {
      console.error('Failed to track click:', analyticsError)
      // Continue with redirect even if analytics fail
    }

    // Check if this product has link rotation enabled
    const productLinks = await prisma.affiliateLink.findMany({
      where: {
        productId: affiliateLink.productId,
        isActive: true
      },
      include: {
        analytics: true
      }
    })

    let targetUrl = affiliateLink.originalUrl

    // If multiple links exist, apply advanced rotation logic
    if (productLinks.length > 1) {
      try {
        // Extract user context for targeting
        const userContext = {
          device: deviceInfo.device,
          userAgent: userAgent || undefined,
          referrer: referrer || undefined,
          // You could add IP-based country detection here
          country: undefined
        }

        // Simple performance-based rotation configuration
        const weights: Record<string, number> = {}
        const totalConversions = productLinks.reduce((sum, link) => 
          sum + (link.analytics?.totalConversions || 0), 0
        )

        if (totalConversions > 0) {
          productLinks.forEach(link => {
            const conversions = link.analytics?.totalConversions || 0
            weights[link.id] = conversions / totalConversions
          })
        } else {
          // Equal weights if no conversion data
          const equalWeight = 1 / productLinks.length
          productLinks.forEach(link => {
            weights[link.id] = equalWeight
          })
        }

        const rotationConfig = {
          strategy: 'performance_based',
          weights
        }

        // Use the advanced link selection with targeting
        const { LinkManagementService } = await import('@/lib/services/link-management')
        const selectedLink = await LinkManagementService.selectLinkWithTargeting(
          productLinks,
          userContext,
          rotationConfig
        )

        if (selectedLink) {
          targetUrl = selectedLink.originalUrl
        }
      } catch (error) {
        console.error('Link rotation failed, using original link:', error)
        // Fallback to original link if rotation fails
      }
    }

    // Redirect to the target URL
    return NextResponse.redirect(targetUrl, { status: 302 })

  } catch (error) {
    console.error('Redirect error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkvault.pro'
    return NextResponse.redirect(`${baseUrl}/error`)
  }
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 
                /Tablet|iPad/.test(userAgent) ? 'tablet' : 'desktop'
  
  let browser = 'unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  else if (userAgent.includes('Opera')) browser = 'Opera'

  let os = 'unknown'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac OS')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  return { device, browser, os }
}

// Helper function to select link based on weights
function selectLinkByWeight(links: any[], weights: Record<string, number>) {
  const random = Math.random()
  let cumulativeWeight = 0

  for (const link of links) {
    const weight = weights[link.id] || 0
    cumulativeWeight += weight

    if (random <= cumulativeWeight) {
      return link
    }
  }

  return links[0] // Fallback
}