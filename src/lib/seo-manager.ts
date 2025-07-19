import { prisma } from '@/lib/prisma'
import { generateSlug, ensureUniqueSlug, createRedirect } from '@/lib/slug-management'
import { generateMetadata, analyzeSEOScore, extractKeywords, generateMetaDescription } from '@/lib/seo-utils'
import { 
  generateProductStructuredData, 
  generateArticleStructuredData,
  generateBreadcrumbStructuredData,
  generateWebSiteStructuredData,
  generateOrganizationStructuredData
} from '@/lib/structured-data'

export interface SEOManagerOptions {
  baseUrl: string
  siteName: string
  organizationName: string
  organizationLogo?: string
}

export class SEOManager {
  private options: SEOManagerOptions

  constructor(options: SEOManagerOptions) {
    this.options = options
  }

  /**
   * Generate comprehensive SEO data for a product
   */
  async generateProductSEO(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: true,
        affiliateLinks: {
          include: {
            platform: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // Generate SEO metadata
    const keywords = [
      product.title,
      product.category.name,
      ...product.tags.map(pt => pt.tag.name),
      'review',
      'buy online',
      'best price'
    ]

    const metaDescription = product.metaDescription || 
      generateMetaDescription(`${product.title} - ${product.description}`, 160)

    const seoData = {
      title: product.metaTitle || `${product.title} - Best Price & Reviews`,
      description: metaDescription,
      keywords,
      canonicalUrl: `/products/${product.slug}`,
      ogImage: product.images[0]?.url,
      ogType: 'product' as const
    }

    // Generate structured data
    const structuredData = generateProductStructuredData(product, this.options)

    // Analyze SEO score
    const seoAnalysis = analyzeSEOScore(product.description, seoData)

    return {
      metadata: generateMetadata(seoData, this.options),
      structuredData,
      seoAnalysis,
      recommendations: this.generateSEORecommendations(seoAnalysis)
    }
  }

  /**
   * Generate comprehensive SEO data for content
   */
  async generateContentSEO(contentId: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        author: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!content) {
      throw new Error('Content not found')
    }

    const authorName = content.author.profile 
      ? `${content.author.profile.firstName} ${content.author.profile.lastName}`
      : 'LinkVault Pro'

    // Extract keywords from content if not provided
    const keywords = content.keywords.length > 0 
      ? content.keywords 
      : extractKeywords(content.content, 10)

    const seoData = {
      title: content.metaTitle || content.title,
      description: content.metaDescription || generateMetaDescription(content.content, 160),
      keywords,
      canonicalUrl: `/content/${content.slug}`,
      ogType: 'article' as const,
      publishedTime: content.publishedAt?.toISOString(),
      modifiedTime: content.updatedAt.toISOString(),
      author: authorName,
      section: content.type.toLowerCase().replace('_', ' ')
    }

    // Generate structured data
    const structuredData = generateArticleStructuredData({
      title: content.title,
      description: content.metaDescription || content.excerpt,
      slug: content.slug,
      type: content.type.toLowerCase(),
      publishedAt: content.publishedAt,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt
    }, this.options)

    // Analyze SEO score
    const seoAnalysis = analyzeSEOScore(content.content, seoData)

    return {
      metadata: generateMetadata(seoData, this.options),
      structuredData,
      seoAnalysis,
      recommendations: this.generateSEORecommendations(seoAnalysis)
    }
  }

  /**
   * Update product slug and handle redirects
   */
  async updateProductSlug(productId: string, newTitle: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const newSlug = generateSlug(newTitle)
    const uniqueSlug = await ensureUniqueSlug(newSlug, 'product', productId)

    // Create redirect if slug is changing
    if (product.slug !== uniqueSlug) {
      await createRedirect(product.slug, uniqueSlug, 'product')
      
      // Update product with new slug
      await prisma.product.update({
        where: { id: productId },
        data: { slug: uniqueSlug }
      })
    }

    return uniqueSlug
  }

  /**
   * Update content slug and handle redirects
   */
  async updateContentSlug(contentId: string, newTitle: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { slug: true }
    })

    if (!content) {
      throw new Error('Content not found')
    }

    const newSlug = generateSlug(newTitle)
    const uniqueSlug = await ensureUniqueSlug(newSlug, 'content', contentId)

    // Create redirect if slug is changing
    if (content.slug !== uniqueSlug) {
      await createRedirect(content.slug, uniqueSlug, 'content')
      
      // Update content with new slug
      await prisma.content.update({
        where: { id: contentId },
        data: { slug: uniqueSlug }
      })
    }

    return uniqueSlug
  }

  /**
   * Generate site-wide structured data
   */
  generateSiteStructuredData() {
    const websiteData = generateWebSiteStructuredData(this.options)
    const organizationData = generateOrganizationStructuredData(this.options)
    
    return [websiteData, organizationData]
  }

  /**
   * Generate breadcrumb structured data
   */
  generateBreadcrumbData(breadcrumbs: Array<{ name: string; url: string }>) {
    return generateBreadcrumbStructuredData(breadcrumbs, this.options)
  }

  /**
   * Audit entire site for SEO issues
   */
  async auditSiteSEO() {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check products without meta descriptions
    const productsWithoutMeta = await prisma.product.count({
      where: {
        OR: [
          { metaDescription: null },
          { metaDescription: '' }
        ]
      }
    })

    if (productsWithoutMeta > 0) {
      issues.push(`${productsWithoutMeta} products missing meta descriptions`)
      recommendations.push('Add meta descriptions to all products for better search visibility')
    }

    // Check content without meta descriptions
    const contentWithoutMeta = await prisma.content.count({
      where: {
        OR: [
          { metaDescription: null },
          { metaDescription: '' }
        ]
      }
    })

    if (contentWithoutMeta > 0) {
      issues.push(`${contentWithoutMeta} content pieces missing meta descriptions`)
      recommendations.push('Add meta descriptions to all content for better search visibility')
    }

    // Check for duplicate titles
    const duplicateTitles = await prisma.$queryRaw`
      SELECT title, COUNT(*) as count 
      FROM products 
      GROUP BY title 
      HAVING COUNT(*) > 1
    ` as Array<{ title: string; count: number }>

    if (duplicateTitles.length > 0) {
      issues.push(`${duplicateTitles.length} duplicate product titles found`)
      recommendations.push('Ensure all product titles are unique for better SEO')
    }

    // Check for broken redirects (redirects pointing to non-existent pages)
    const redirects = await prisma.redirect.findMany()
    const brokenRedirects: string[] = []

    for (const redirect of redirects) {
      // Check if target page exists
      const targetExists = await this.checkPageExists(redirect.toPath)
      if (!targetExists) {
        brokenRedirects.push(redirect.fromPath)
      }
    }

    if (brokenRedirects.length > 0) {
      issues.push(`${brokenRedirects.length} broken redirects found`)
      recommendations.push('Fix or remove broken redirects to avoid 404 errors')
    }

    return {
      issues,
      recommendations,
      score: Math.max(0, 100 - (issues.length * 10))
    }
  }

  /**
   * Generate SEO recommendations based on analysis
   */
  private generateSEORecommendations(analysis: { score: number; issues: string[]; suggestions: string[] }) {
    const recommendations: string[] = [...analysis.suggestions]

    if (analysis.score < 60) {
      recommendations.push('Consider hiring an SEO specialist for comprehensive optimization')
    }

    if (analysis.score < 80) {
      recommendations.push('Focus on improving content quality and keyword optimization')
      recommendations.push('Add more internal links to related content')
      recommendations.push('Optimize images with descriptive alt text')
    }

    return recommendations
  }

  /**
   * Check if a page exists (simplified check)
   */
  private async checkPageExists(path: string): Promise<boolean> {
    // Check if it's a product page
    if (path.startsWith('/products/')) {
      const slug = path.replace('/products/', '')
      const product = await prisma.product.findUnique({ where: { slug } })
      return !!product
    }

    // Check if it's a content page
    if (path.startsWith('/content/')) {
      const slug = path.replace('/content/', '')
      const content = await prisma.content.findUnique({ where: { slug } })
      return !!content
    }

    // Check if it's a category page
    if (path.startsWith('/categories/')) {
      const slug = path.replace('/categories/', '')
      const category = await prisma.category.findUnique({ where: { slug } })
      return !!category
    }

    // For other paths, assume they exist (static pages)
    return true
  }
}

// Create default SEO manager instance
export const seoManager = new SEOManager({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://linkvault-pro.com',
  siteName: 'LinkVault Pro',
  organizationName: 'LinkVault Pro',
  organizationLogo: '/images/logo.png'
})