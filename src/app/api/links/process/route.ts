import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LinkManagementService, urlProcessingSchema } from '@/lib/services/link-management'
import { createAffiliateLinkSchema } from '@/lib/validations/affiliate'
import { prisma } from '@/lib/prisma'

const processLinkSchema = z.object({
  url: z.string().url('Invalid URL'),
  productId: z.string().uuid('Invalid product ID').optional(),
  extractProductInfo: z.boolean().default(true),
  validateLink: z.boolean().default(true),
  createShortUrl: z.boolean().default(true),
  customDomain: z.string().url().optional(),
  autoCreateProduct: z.boolean().default(false),
  categoryId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = processLinkSchema.parse(body)

    // Process the URL
    const result = await LinkManagementService.processUrl(validatedData.url, {
      extractProductInfo: validatedData.extractProductInfo,
      validateLink: validatedData.validateLink,
      createShortUrl: validatedData.createShortUrl,
      customDomain: validatedData.customDomain,
    })

    // If validation failed, return early
    if (result.validation && !result.validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'URL validation failed',
        details: result.validation
      }, { status: 400 })
    }

    // Get or create platform
    const platform = await LinkManagementService.getOrCreatePlatform(
      result.platformDetection.platform
    )

    let productId = validatedData.productId
    let product = null

    // Auto-create product if requested and product info is available
    if (validatedData.autoCreateProduct && result.productInfo && !productId) {
      if (!validatedData.categoryId) {
        return NextResponse.json({
          success: false,
          error: 'Category ID is required for auto-creating products'
        }, { status: 400 })
      }

      // Create product from extracted information
      const productData = {
        title: result.productInfo.title || 'Untitled Product',
        description: result.productInfo.description || 'No description available',
        shortDescription: result.productInfo.description?.substring(0, 200),
        currentPrice: result.productInfo.price?.current || 0,
        originalPrice: result.productInfo.price?.original,
        currency: result.productInfo.price?.currency || 'USD',
        slug: result.productInfo.title?.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50) || `product-${Date.now()}`,
        categoryId: validatedData.categoryId,
        createdBy: 'system', // You might want to get this from auth context
        status: 'DRAFT' as const,
      }

      try {
        product = await prisma.product.create({
          data: productData
        })
        productId = product.id

        // Create product images if available
        if (result.productInfo.images && result.productInfo.images.length > 0) {
          await prisma.productImage.createMany({
            data: result.productInfo.images.map((url, index) => ({
              productId: product!.id,
              url,
              alt: result.productInfo!.title || 'Product image',
              isPrimary: index === 0,
              order: index
            }))
          })
        }
      } catch (error) {
        console.error('Failed to create product:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to create product from extracted information'
        }, { status: 500 })
      }
    }

    // Create affiliate link if product ID is available
    let affiliateLink = null
    if (productId) {
      const affiliateLinkData = {
        productId,
        platformId: platform.id,
        originalUrl: result.originalUrl,
        shortenedUrl: result.shortenedUrl,
        commission: 0, // Default commission, can be updated later
        isActive: true,
        priority: 0
      }

      try {
        affiliateLink = await prisma.affiliateLink.create({
          data: affiliateLinkData,
          include: {
            platform: true,
            product: true
          }
        })
      } catch (error) {
        console.error('Failed to create affiliate link:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to create affiliate link'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        platform,
        product,
        affiliateLink
      }
    })

  } catch (error) {
    console.error('Link processing error:', error)
    
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({
      success: false,
      error: 'URL parameter is required'
    }, { status: 400 })
  }

  try {
    // Just detect platform and validate URL without creating records
    const platformDetection = LinkManagementService.detectPlatform(url)
    const validation = await LinkManagementService.validateLink(url)

    return NextResponse.json({
      success: true,
      data: {
        url,
        platformDetection,
        validation
      }
    })

  } catch (error) {
    console.error('Link analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze URL'
    }, { status: 500 })
  }
}