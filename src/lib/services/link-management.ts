import { z } from 'zod'
import * as cheerio from 'cheerio'
import { prisma } from '@/lib/prisma'
import { Platform, AffiliateLink } from '@prisma/client'

// Platform detection patterns
const PLATFORM_PATTERNS = {
  amazon: {
    domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.com.au', 'amazon.co.jp'],
    patterns: [/amazon\.[a-z.]+\/.*\/dp\/([A-Z0-9]{10})/i, /amazon\.[a-z.]+\/dp\/([A-Z0-9]{10})/i],
    name: 'amazon'
  },
  shopee: {
    domains: ['shopee.com', 'shopee.sg', 'shopee.my', 'shopee.ph', 'shopee.th', 'shopee.vn', 'shopee.tw', 'shopee.id'],
    patterns: [/shopee\.[a-z.]+\/.*-i\.(\d+)\.(\d+)/i],
    name: 'shopee'
  },
  lazada: {
    domains: ['lazada.com', 'lazada.sg', 'lazada.my', 'lazada.ph', 'lazada.th', 'lazada.vn', 'lazada.co.id'],
    patterns: [/lazada\.[a-z.]+\/products\/.*-i(\d+)/i],
    name: 'lazada'
  },
  aliexpress: {
    domains: ['aliexpress.com', 'aliexpress.us'],
    patterns: [/aliexpress\.[a-z.]+\/item\/(\d+)\.html/i],
    name: 'aliexpress'
  },
  ebay: {
    domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es', 'ebay.ca', 'ebay.com.au'],
    patterns: [/ebay\.[a-z.]+\/itm\/(\d+)/i],
    name: 'ebay'
  }
}

// Types
export interface PlatformDetectionResult {
  platform: string
  productId?: string
  isAffiliate: boolean
  confidence: number
}

export interface ProductExtractionResult {
  title?: string
  description?: string
  price?: {
    current: number
    original?: number
    currency: string
  }
  images?: string[]
  rating?: number
  reviewCount?: number
  availability?: string
  brand?: string
  category?: string
}

export interface LinkValidationResult {
  isValid: boolean
  status: number
  redirectUrl?: string
  error?: string
  responseTime: number
}

export interface LinkHealthCheck {
  linkId: string
  isHealthy: boolean
  lastChecked: Date
  status: number
  responseTime: number
  error?: string
}

// Validation schemas
export const urlProcessingSchema = z.object({
  url: z.string().url('Invalid URL'),
  extractProductInfo: z.boolean().default(true),
  validateLink: z.boolean().default(true),
})

export const linkRotationConfigSchema = z.object({
  productId: z.string().uuid(),
  strategy: z.enum(['round_robin', 'weighted', 'performance_based', 'random']),
  weights: z.record(z.string().uuid(), z.number().min(0).max(1)).optional(),
  testDuration: z.number().min(1).max(365).default(30), // days
  trafficSplit: z.number().min(0.1).max(1).default(1), // percentage of traffic to test
})

export class LinkManagementService {
  /**
   * Detect platform from URL
   */
  static detectPlatform(url: string): PlatformDetectionResult {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      
      for (const [platformKey, config] of Object.entries(PLATFORM_PATTERNS)) {
        // Check if domain matches
        const domainMatch = config.domains.some(domain => 
          hostname.includes(domain.toLowerCase())
        )
        
        if (domainMatch) {
          // Check for product ID patterns
          let productId: string | undefined
          let confidence = 0.7
          
          for (const pattern of config.patterns) {
            const match = url.match(pattern)
            if (match) {
              productId = match[1]
              confidence = 0.9
              break
            }
          }
          
          // Check for affiliate parameters
          const isAffiliate = this.hasAffiliateParameters(url, platformKey)
          if (isAffiliate) confidence += 0.1
          
          return {
            platform: config.name,
            productId,
            isAffiliate,
            confidence: Math.min(confidence, 1.0)
          }
        }
      }
      
      return {
        platform: 'unknown',
        isAffiliate: false,
        confidence: 0
      }
    } catch (error) {
      return {
        platform: 'unknown',
        isAffiliate: false,
        confidence: 0
      }
    }
  }

  /**
   * Check if URL has affiliate parameters
   */
  private static hasAffiliateParameters(url: string, platform: string): boolean {
    const affiliateParams = {
      amazon: ['tag', 'linkCode', 'ref', 'ref_'],
      shopee: ['af_siteid', 'pid', 'af_click_lookback'],
      lazada: ['aff_short_key', 'aff_platform', 'aff_trace_key'],
      aliexpress: ['aff_platform', 'aff_trace_key', 'terminal_id'],
      ebay: ['campid', 'customid', 'toolid']
    }
    
    const params = affiliateParams[platform as keyof typeof affiliateParams] || []
    const urlObj = new URL(url)
    
    return params.some(param => urlObj.searchParams.has(param))
  }

  /**
   * Extract product information from URL using web scraping
   */
  static async extractProductInfo(url: string): Promise<ProductExtractionResult> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)
      
      const platform = this.detectPlatform(url).platform
      
      switch (platform) {
        case 'amazon':
          return this.extractAmazonProductInfo($)
        case 'shopee':
          return this.extractShopeeProductInfo($)
        case 'lazada':
          return this.extractLazadaProductInfo($)
        case 'aliexpress':
          return this.extractAliexpressProductInfo($)
        case 'ebay':
          return this.extractEbayProductInfo($)
        default:
          return this.extractGenericProductInfo($)
      }
    } catch (error) {
      console.error('Product extraction failed:', error)
      return {}
    }
  }

  /**
   * Extract Amazon product information
   */
  private static extractAmazonProductInfo($: cheerio.CheerioAPI): ProductExtractionResult {
    const title = $('#productTitle').text().trim() || 
                  $('h1.a-size-large').text().trim() ||
                  $('h1 span').first().text().trim()

    const description = $('#feature-bullets ul li span').map((_, el) => $(el).text().trim()).get().join(' ') ||
                       $('#productDescription p').text().trim()

    const priceText = $('.a-price-current .a-offscreen').first().text() ||
                     $('.a-price .a-offscreen').first().text() ||
                     $('#priceblock_dealprice').text() ||
                     $('#priceblock_ourprice').text()

    const originalPriceText = $('.a-price.a-text-price .a-offscreen').text() ||
                             $('#priceblock_listprice').text()

    const images = $('#landingImage').attr('src') ? [this.cleanImageUrl($('#landingImage').attr('src')!)] : []
    
    // Add additional images
    $('#altImages img').each((_, el) => {
      const src = $(el).attr('src')
      if (src) images.push(this.cleanImageUrl(src))
    })

    const rating = parseFloat($('#acrPopover .a-icon-alt').text().match(/(\d+\.?\d*)/)?.[1] || '0')
    const reviewCount = parseInt($('#acrCustomerReviewText').text().match(/(\d+)/)?.[1] || '0')

    const availability = $('#availability span').text().trim() ||
                        $('#merchant-info').text().trim()

    const brand = $('#bylineInfo').text().replace('Brand:', '').trim() ||
                 $('tr:contains("Brand") td').last().text().trim()

    return {
      title: title || undefined,
      description: description || undefined,
      price: this.parsePrice(priceText, originalPriceText),
      images: images.length > 0 ? images : undefined,
      rating: rating > 0 ? rating : undefined,
      reviewCount: reviewCount > 0 ? reviewCount : undefined,
      availability: availability || undefined,
      brand: brand || undefined
    }
  }

  /**
   * Extract Shopee product information
   */
  private static extractShopeeProductInfo($: cheerio.CheerioAPI): ProductExtractionResult {
    // Shopee uses dynamic content, so we'll try to extract from meta tags and structured data
    const title = $('meta[property="og:title"]').attr('content') ||
                  $('title').text().split(' | ')[0]

    const description = $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="description"]').attr('content')

    const priceText = $('script[type="application/ld+json"]').text()
    let price
    try {
      const jsonLd = JSON.parse(priceText)
      if (jsonLd.offers) {
        price = {
          current: parseFloat(jsonLd.offers.price),
          currency: jsonLd.offers.priceCurrency || 'USD'
        }
      }
    } catch (e) {
      // Fallback to meta tags
      const priceContent = $('meta[property="product:price:amount"]').attr('content')
      const currency = $('meta[property="product:price:currency"]').attr('content')
      if (priceContent) {
        price = {
          current: parseFloat(priceContent),
          currency: currency || 'USD'
        }
      }
    }

    const images = [$('meta[property="og:image"]').attr('content')].filter(Boolean) as string[]

    return {
      title: title || undefined,
      description: description || undefined,
      price,
      images: images.length > 0 ? images : undefined
    }
  }

  /**
   * Extract Lazada product information
   */
  private static extractLazadaProductInfo($: cheerio.CheerioAPI): ProductExtractionResult {
    const title = $('meta[property="og:title"]').attr('content') ||
                  $('h1').first().text().trim()

    const description = $('meta[property="og:description"]').attr('content') ||
                       $('.pdp-product-desc').text().trim()

    const priceText = $('.pdp-price_current').text() ||
                     $('.price-current').text()

    const originalPriceText = $('.pdp-price_original').text() ||
                             $('.price-original').text()

    const images = [$('meta[property="og:image"]').attr('content')].filter(Boolean) as string[]

    const rating = parseFloat($('.score-average').text() || '0')
    const reviewCount = parseInt($('.count').text().match(/(\d+)/)?.[1] || '0')

    return {
      title: title || undefined,
      description: description || undefined,
      price: this.parsePrice(priceText, originalPriceText),
      images: images.length > 0 ? images : undefined,
      rating: rating > 0 ? rating : undefined,
      reviewCount: reviewCount > 0 ? reviewCount : undefined
    }
  }

  /**
   * Extract AliExpress product information
   */
  private static extractAliexpressProductInfo($: cheerio.CheerioAPI): ProductExtractionResult {
    const title = $('meta[property="og:title"]').attr('content') ||
                  $('h1').first().text().trim()

    const description = $('meta[property="og:description"]').attr('content')

    const priceText = $('.product-price-current').text() ||
                     $('.uniform-banner-box-price').text()

    const images = [$('meta[property="og:image"]').attr('content')].filter(Boolean) as string[]

    return {
      title: title || undefined,
      description: description || undefined,
      price: this.parsePrice(priceText),
      images: images.length > 0 ? images : undefined
    }
  }

  /**
   * Extract eBay product information
   */
  private static extractEbayProductInfo($: cheerio.CheerioAPI): ProductExtractionResult {
    const title = $('#x-title-label-lbl').text().trim() ||
                  $('h1#it-ttl').text().trim() ||
                  $('meta[property="og:title"]').attr('content')

    const description = $('.u-flL.condText').text().trim() ||
                       $('meta[property="og:description"]').attr('content')

    const priceText = $('.notranslate').first().text() ||
                     $('#prcIsum').text() ||
                     $('#mm-saleDscPrc').text()

    const images = [$('#icImg').attr('src'), $('meta[property="og:image"]').attr('content')].filter(Boolean) as string[]

    return {
      title: title || undefined,
      description: description || undefined,
      price: this.parsePrice(priceText),
      images: images.length > 0 ? images : undefined
    }
  }

  /**
   * Extract generic product information from any website
   */
  private static extractGenericProductInfo($: cheerio.CheerioAPI): ProductExtractionResult {
    const title = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text().trim() ||
                  $('h1').first().text().trim()

    const description = $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="twitter:description"]').attr('content') ||
                       $('meta[name="description"]').attr('content')

    const images = [
      $('meta[property="og:image"]').attr('content'),
      $('meta[name="twitter:image"]').attr('content')
    ].filter(Boolean) as string[]

    // Try to find price in structured data
    let price
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonLd = JSON.parse($(el).text())
        if (jsonLd.offers && jsonLd.offers.price) {
          price = {
            current: parseFloat(jsonLd.offers.price),
            currency: jsonLd.offers.priceCurrency || 'USD'
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    })

    return {
      title: title || undefined,
      description: description || undefined,
      price,
      images: images.length > 0 ? images : undefined
    }
  }

  /**
   * Parse price text and extract numeric values
   */
  private static parsePrice(priceText?: string, originalPriceText?: string) {
    if (!priceText) return undefined

    const cleanPrice = (text: string) => {
      const match = text.replace(/[^\d.,]/g, '').match(/(\d+[.,]?\d*)/)
      return match ? parseFloat(match[1].replace(',', '.')) : 0
    }

    const current = cleanPrice(priceText)
    const original = originalPriceText ? cleanPrice(originalPriceText) : undefined

    if (current === 0) return undefined

    // Extract currency
    const currencyMatch = priceText.match(/([A-Z]{3})|(\$|€|£|¥|₹|₽)/)
    let currency = 'USD'
    
    if (currencyMatch) {
      const symbol = currencyMatch[0]
      const currencyMap: Record<string, string> = {
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        '₹': 'INR',
        '₽': 'RUB'
      }
      currency = currencyMap[symbol] || symbol
    }

    return {
      current,
      original: original && original > current ? original : undefined,
      currency
    }
  }

  /**
   * Clean and normalize image URLs
   */
  private static cleanImageUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      // Remove size parameters for Amazon images
      if (urlObj.hostname.includes('amazon')) {
        urlObj.searchParams.delete('_SX')
        urlObj.searchParams.delete('_SY')
        return urlObj.toString().replace(/\._[A-Z]{2}\d+_/, '.')
      }
      return url
    } catch {
      return url
    }
  }

  /**
   * Validate link and check if it's accessible
   */
  static async validateLink(url: string): Promise<LinkValidationResult> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkVault-Pro/1.0; +https://linkvault.pro/bot)',
        },
        timeout: 10000,
        redirect: 'follow'
      })

      const responseTime = Date.now() - startTime

      return {
        isValid: response.ok,
        status: response.status,
        redirectUrl: response.url !== url ? response.url : undefined,
        responseTime
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        isValid: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      }
    }
  }

  /**
   * Perform health check on multiple links
   */
  static async performHealthCheck(linkIds: string[]): Promise<LinkHealthCheck[]> {
    const links = await prisma.affiliateLink.findMany({
      where: { id: { in: linkIds } },
      select: { id: true, originalUrl: true }
    })

    const healthChecks = await Promise.allSettled(
      links.map(async (link) => {
        const validation = await this.validateLink(link.originalUrl)
        
        return {
          linkId: link.id,
          isHealthy: validation.isValid,
          lastChecked: new Date(),
          status: validation.status,
          responseTime: validation.responseTime,
          error: validation.error
        }
      })
    )

    return healthChecks
      .filter((result): result is PromiseFulfilledResult<LinkHealthCheck> => result.status === 'fulfilled')
      .map(result => result.value)
  }

  /**
   * Generate shortened URL
   */
  static generateShortCode(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  /**
   * Create shortened and cloaked URL
   */
  static async createShortenedUrl(
    originalUrl: string, 
    customDomain?: string,
    customSlug?: string
  ): Promise<string> {
    const baseUrl = customDomain || process.env.NEXT_PUBLIC_APP_URL || 'https://linkvault.pro'
    const shortCode = customSlug || this.generateShortCode()
    
    // Ensure the short code is unique
    let finalShortCode = shortCode
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      const existing = await prisma.affiliateLink.findFirst({
        where: { shortenedUrl: `${baseUrl}/l/${finalShortCode}` }
      })
      
      if (!existing) break
      
      finalShortCode = this.generateShortCode()
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique short code')
    }
    
    return `${baseUrl}/l/${finalShortCode}`
  }

  /**
   * Process URL and extract all information
   */
  static async processUrl(url: string, options: {
    extractProductInfo?: boolean
    validateLink?: boolean
    createShortUrl?: boolean
    customDomain?: string
  } = {}) {
    const {
      extractProductInfo = true,
      validateLink = true,
      createShortUrl = true,
      customDomain
    } = options

    // Detect platform
    const platformDetection = this.detectPlatform(url)
    
    // Validate link
    let validation: LinkValidationResult | undefined
    if (validateLink) {
      validation = await this.validateLink(url)
    }

    // Extract product information
    let productInfo: ProductExtractionResult | undefined
    if (extractProductInfo && validation?.isValid !== false) {
      productInfo = await this.extractProductInfo(url)
    }

    // Create shortened URL
    let shortenedUrl: string | undefined
    if (createShortUrl) {
      shortenedUrl = await this.createShortenedUrl(url, customDomain)
    }

    return {
      originalUrl: url,
      platformDetection,
      validation,
      productInfo,
      shortenedUrl
    }
  }

  /**
   * Get or create platform record
   */
  static async getOrCreatePlatform(platformName: string): Promise<Platform> {
    let platform = await prisma.platform.findFirst({
      where: { name: platformName }
    })

    if (!platform) {
      const platformConfig = PLATFORM_PATTERNS[platformName as keyof typeof PLATFORM_PATTERNS]
      
      platform = await prisma.platform.create({
        data: {
          name: platformName,
          displayName: platformConfig?.name.charAt(0).toUpperCase() + platformConfig?.name.slice(1) || platformName,
          baseUrl: platformConfig?.domains[0] ? `https://${platformConfig.domains[0]}` : '',
          isActive: true
        }
      })
    }

    return platform
  }

  /**
   * Link rotation and A/B testing functionality
   */
  static async setupLinkRotation(config: z.infer<typeof linkRotationConfigSchema>) {
    const { productId, strategy, weights, testDuration, trafficSplit } = config

    // Get all active affiliate links for the product
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: {
        productId,
        isActive: true
      },
      include: {
        analytics: true,
        platform: true
      }
    })

    if (affiliateLinks.length < 2) {
      throw new Error('At least 2 affiliate links are required for rotation')
    }

    // Calculate rotation weights based on strategy
    let rotationWeights: Record<string, number> = {}

    switch (strategy) {
      case 'round_robin':
        const equalWeight = 1 / affiliateLinks.length
        affiliateLinks.forEach(link => {
          rotationWeights[link.id] = equalWeight
        })
        break

      case 'weighted':
        if (!weights) {
          throw new Error('Weights are required for weighted strategy')
        }
        rotationWeights = weights
        break

      case 'performance_based':
        // Calculate weights based on conversion rates
        const totalConversions = affiliateLinks.reduce((sum, link) => 
          sum + (link.analytics?.totalConversions || 0), 0
        )
        
        if (totalConversions === 0) {
          // Fallback to equal weights if no conversion data
          const equalWeight = 1 / affiliateLinks.length
          affiliateLinks.forEach(link => {
            rotationWeights[link.id] = equalWeight
          })
        } else {
          affiliateLinks.forEach(link => {
            const conversions = link.analytics?.totalConversions || 0
            rotationWeights[link.id] = conversions / totalConversions
          })
        }
        break

      case 'random':
        affiliateLinks.forEach(link => {
          rotationWeights[link.id] = Math.random()
        })
        // Normalize weights
        const totalWeight = Object.values(rotationWeights).reduce((sum, weight) => sum + weight, 0)
        Object.keys(rotationWeights).forEach(linkId => {
          rotationWeights[linkId] = rotationWeights[linkId] / totalWeight
        })
        break
    }

    // Store rotation configuration (you might want to create a separate table for this)
    const rotationConfig = {
      productId,
      strategy,
      weights: rotationWeights,
      testDuration,
      trafficSplit,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + testDuration * 24 * 60 * 60 * 1000)
    }

    // For now, we'll store this in a JSON field or create a separate rotation config table
    // This is a simplified implementation
    return rotationConfig
  }

  /**
   * Select link for rotation based on configured strategy
   */
  static selectLinkForRotation(
    affiliateLinks: AffiliateLink[],
    weights: Record<string, number>,
    strategy: string = 'weighted'
  ): AffiliateLink {
    if (affiliateLinks.length === 0) {
      throw new Error('No affiliate links available')
    }

    if (affiliateLinks.length === 1) {
      return affiliateLinks[0]
    }

    // Generate random number between 0 and 1
    const random = Math.random()
    let cumulativeWeight = 0

    for (const link of affiliateLinks) {
      const weight = weights[link.id] || 0
      cumulativeWeight += weight

      if (random <= cumulativeWeight) {
        return link
      }
    }

    // Fallback to first link if something goes wrong
    return affiliateLinks[0]
  }

  /**
   * Batch health check for all links
   */
  static async batchHealthCheck(batchSize: number = 50): Promise<void> {
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const links = await prisma.affiliateLink.findMany({
        where: { isActive: true },
        select: { id: true, originalUrl: true },
        skip: offset,
        take: batchSize
      })

      if (links.length === 0) {
        hasMore = false
        break
      }

      const healthChecks = await this.performHealthCheck(links.map(l => l.id))
      
      // Update link status based on health check results
      for (const healthCheck of healthChecks) {
        if (!healthCheck.isHealthy) {
          await prisma.affiliateLink.update({
            where: { id: healthCheck.linkId },
            data: { 
              isActive: false,
              updatedAt: new Date()
            }
          })
        }
      }

      offset += batchSize
    }
  }

  /**
   * Clean and normalize URLs
   */
  static cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      
      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', 'twclid',
        '_ga', '_gl', 'mc_cid', 'mc_eid'
      ]
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param)
      })
      
      return urlObj.toString()
    } catch {
      return url
    }
  }

  /**
   * Advanced link rotation with geographic and device targeting
   */
  static async selectLinkWithTargeting(
    affiliateLinks: AffiliateLink[],
    userContext: {
      country?: string
      device?: string
      userAgent?: string
      referrer?: string
    },
    rotationConfig?: {
      strategy: string
      weights: Record<string, number>
      geoTargeting?: Record<string, string[]> // linkId -> countries
      deviceTargeting?: Record<string, string[]> // linkId -> devices
    }
  ): Promise<AffiliateLink> {
    if (affiliateLinks.length === 0) {
      throw new Error('No affiliate links available')
    }

    if (affiliateLinks.length === 1) {
      return affiliateLinks[0]
    }

    // Filter links based on targeting rules
    let eligibleLinks = [...affiliateLinks]

    // Apply geographic targeting
    if (rotationConfig?.geoTargeting && userContext.country) {
      const geoFilteredLinks = eligibleLinks.filter(link => {
        const targetCountries = rotationConfig.geoTargeting![link.id]
        return !targetCountries || targetCountries.includes(userContext.country!)
      })
      
      if (geoFilteredLinks.length > 0) {
        eligibleLinks = geoFilteredLinks
      }
    }

    // Apply device targeting
    if (rotationConfig?.deviceTargeting && userContext.device) {
      const deviceFilteredLinks = eligibleLinks.filter(link => {
        const targetDevices = rotationConfig.deviceTargeting![link.id]
        return !targetDevices || targetDevices.includes(userContext.device!)
      })
      
      if (deviceFilteredLinks.length > 0) {
        eligibleLinks = deviceFilteredLinks
      }
    }

    // Apply rotation strategy to eligible links
    if (!rotationConfig || eligibleLinks.length === 1) {
      return eligibleLinks[0]
    }

    return this.selectLinkForRotation(
      eligibleLinks,
      rotationConfig.weights,
      rotationConfig.strategy
    )
  }

  /**
   * Bulk URL processing for multiple links
   */
  static async bulkProcessUrls(
    urls: string[],
    options: {
      extractProductInfo?: boolean
      validateLink?: boolean
      createShortUrl?: boolean
      customDomain?: string
      batchSize?: number
    } = {}
  ) {
    const { batchSize = 10, ...processOptions } = options
    const results = []
    
    // Process URLs in batches to avoid overwhelming external services
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (url) => {
        try {
          return await this.processUrl(url, processOptions)
        } catch (error) {
          return {
            originalUrl: url,
            error: error instanceof Error ? error.message : 'Processing failed'
          }
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            originalUrl: batch[index],
            error: result.reason?.message || 'Processing failed'
          })
        }
      })
      
      // Add delay between batches to be respectful to external services
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  /**
   * Smart link replacement for content
   */
  static async replaceLinksInContent(
    content: string,
    replacementMap?: Record<string, string>
  ): Promise<string> {
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi
    
    let processedContent = content
    const urls = content.match(urlPattern) || []
    
    for (const url of urls) {
      try {
        // Check if we have a replacement mapping
        if (replacementMap && replacementMap[url]) {
          processedContent = processedContent.replace(url, replacementMap[url])
          continue
        }
        
        // Check if this is an affiliate URL we can process
        const platformDetection = this.detectPlatform(url)
        
        if (platformDetection.isAffiliate && platformDetection.confidence > 0.7) {
          // Find existing shortened URL or create new one
          const existingLink = await prisma.affiliateLink.findFirst({
            where: { originalUrl: url }
          })
          
          if (existingLink?.shortenedUrl) {
            processedContent = processedContent.replace(url, existingLink.shortenedUrl)
          } else {
            // Create new shortened URL
            const shortenedUrl = await this.createShortenedUrl(url)
            processedContent = processedContent.replace(url, shortenedUrl)
          }
        }
      } catch (error) {
        console.error(`Failed to process URL ${url}:`, error)
        // Continue with original URL if processing fails
      }
    }
    
    return processedContent
  }

  /**
   * Generate link performance report
   */
  static async generateLinkPerformanceReport(
    linkIds: string[],
    dateRange: {
      startDate: Date
      endDate: Date
    }
  ) {
    const links = await prisma.affiliateLink.findMany({
      where: { id: { in: linkIds } },
      include: {
        platform: true,
        product: true,
        analytics: true
      }
    })

    const clickEvents = await prisma.clickEvent.findMany({
      where: {
        linkId: { in: linkIds },
        timestamp: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        }
      }
    })

    const conversionEvents = await prisma.conversionEvent.findMany({
      where: {
        linkId: { in: linkIds },
        timestamp: {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        }
      }
    })

    const report = links.map(link => {
      const linkClicks = clickEvents.filter(click => click.linkId === link.id)
      const linkConversions = conversionEvents.filter(conv => conv.linkId === link.id)
      
      const totalRevenue = linkConversions.reduce((sum, conv) => sum + Number(conv.orderValue), 0)
      const conversionRate = linkClicks.length > 0 ? linkConversions.length / linkClicks.length : 0
      const averageOrderValue = linkConversions.length > 0 ? totalRevenue / linkConversions.length : 0

      return {
        linkId: link.id,
        platform: link.platform.displayName,
        product: link.product.title,
        originalUrl: link.originalUrl,
        shortenedUrl: link.shortenedUrl,
        metrics: {
          clicks: linkClicks.length,
          conversions: linkConversions.length,
          revenue: totalRevenue,
          conversionRate,
          averageOrderValue,
          commission: totalRevenue * Number(link.commission)
        },
        deviceBreakdown: this.analyzeDeviceBreakdown(linkClicks),
        countryBreakdown: this.analyzeCountryBreakdown(linkClicks),
        referrerBreakdown: this.analyzeReferrerBreakdown(linkClicks)
      }
    })

    return {
      dateRange,
      totalLinks: links.length,
      summary: {
        totalClicks: clickEvents.length,
        totalConversions: conversionEvents.length,
        totalRevenue: conversionEvents.reduce((sum, conv) => sum + Number(conv.orderValue), 0),
        averageConversionRate: report.reduce((sum, r) => sum + r.metrics.conversionRate, 0) / report.length
      },
      linkReports: report
    }
  }

  /**
   * Analyze device breakdown from click events
   */
  private static analyzeDeviceBreakdown(clickEvents: any[]) {
    const deviceCounts: Record<string, number> = {}
    
    clickEvents.forEach(click => {
      const device = click.device || 'unknown'
      deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })
    
    return deviceCounts
  }

  /**
   * Analyze country breakdown from click events
   */
  private static analyzeCountryBreakdown(clickEvents: any[]) {
    const countryCounts: Record<string, number> = {}
    
    clickEvents.forEach(click => {
      const country = click.country || 'unknown'
      countryCounts[country] = (countryCounts[country] || 0) + 1
    })
    
    return countryCounts
  }

  /**
   * Analyze referrer breakdown from click events
   */
  private static analyzeReferrerBreakdown(clickEvents: any[]) {
    const referrerCounts: Record<string, number> = {}
    
    clickEvents.forEach(click => {
      if (click.referrer) {
        try {
          const referrerDomain = new URL(click.referrer).hostname
          referrerCounts[referrerDomain] = (referrerCounts[referrerDomain] || 0) + 1
        } catch {
          referrerCounts['direct'] = (referrerCounts['direct'] || 0) + 1
        }
      } else {
        referrerCounts['direct'] = (referrerCounts['direct'] || 0) + 1
      }
    })
    
    return referrerCounts
  }

  /**
   * Extract affiliate parameters from URL
   */
  static extractAffiliateParams(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url)
      const params: Record<string, string> = {}
      
      // Common affiliate parameters
      const affiliateParams = [
        'tag', 'ref', 'ref_', 'linkCode', 'linkId',
        'aff_short_key', 'aff_platform', 'aff_trace_key',
        'af_siteid', 'pid', 'af_click_lookback',
        'campid', 'customid', 'toolid',
        'terminal_id', 'aff_platform'
      ]
      
      affiliateParams.forEach(param => {
        const value = urlObj.searchParams.get(param)
        if (value) {
          params[param] = value
        }
      })
      
      return params
    } catch {
      return {}
    }
  }
}

// Export types
export type {
  PlatformDetectionResult,
  ProductExtractionResult,
  LinkValidationResult,
  LinkHealthCheck
}