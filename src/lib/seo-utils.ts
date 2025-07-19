import { Metadata } from 'next'

export interface SEOData {
  title: string
  description: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export interface SEOConfig {
  siteName: string
  siteUrl: string
  defaultTitle: string
  defaultDescription: string
  defaultImage: string
  twitterHandle?: string
  facebookAppId?: string
}

const defaultConfig: SEOConfig = {
  siteName: 'LinkVault Pro',
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://linkvault-pro.com',
  defaultTitle: 'LinkVault Pro - Professional Affiliate Marketing Platform',
  defaultDescription: 'Manage your affiliate links, track performance, and create beautiful product showcases with LinkVault Pro.',
  defaultImage: '/images/og-default.jpg',
  twitterHandle: '@linkvaultpro',
  facebookAppId: process.env.FACEBOOK_APP_ID
}

/**
 * Generate Next.js metadata object from SEO data
 */
export function generateMetadata(seoData: SEOData, config: SEOConfig = defaultConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonicalUrl,
    ogImage,
    ogType = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = []
  } = seoData

  const fullTitle = title.includes(config.siteName) ? title : `${title} | ${config.siteName}`
  const imageUrl = ogImage ? `${config.siteUrl}${ogImage}` : `${config.siteUrl}${config.defaultImage}`
  const url = canonicalUrl ? `${config.siteUrl}${canonicalUrl}` : config.siteUrl

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    creator: config.siteName,
    publisher: config.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: ogType,
      title: fullTitle,
      description,
      url,
      siteName: config.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime,
      modifiedTime,
      authors: author ? [author] : undefined,
      section,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: config.twitterHandle,
      site: config.twitterHandle,
    },
    facebook: {
      appId: config.facebookAppId,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
      other: {
        'msvalidate.01': process.env.BING_VERIFICATION || '',
      },
    },
  }
}

/**
 * Generate SEO-friendly URL slug
 */
export function generateSEOSlug(title: string, maxLength: number = 60): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, maxLength)
    .replace(/-+$/, '') // Remove trailing hyphen if truncated
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  // Remove HTML tags and extra whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleanContent.length <= maxLength) {
    return cleanContent
  }

  // Truncate at word boundary
  const truncated = cleanContent.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

/**
 * Extract keywords from content
 */
export function extractKeywords(content: string, maxKeywords: number = 10): string[] {
  // Remove HTML tags and convert to lowercase
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .toLowerCase()

  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ])

  // Extract words and count frequency
  const words = cleanContent
    .match(/\b[a-z]{3,}\b/g) || []
  
  const wordCount = new Map<string, number>()
  
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    }
  })

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * Calculate reading time estimate
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const cleanContent = content.replace(/<[^>]*>/g, '')
  const wordCount = cleanContent.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Generate breadcrumb data for SEO
 */
export function generateBreadcrumbs(path: string, labels?: Record<string, string>) {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs = [{ name: 'Home', url: '/' }]
  
  let currentPath = ''
  segments.forEach(segment => {
    currentPath += `/${segment}`
    const label = labels?.[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    breadcrumbs.push({
      name: label,
      url: currentPath
    })
  })
  
  return breadcrumbs
}

/**
 * Validate and optimize SEO data
 */
export function optimizeSEOData(seoData: Partial<SEOData>): SEOData {
  const optimized: SEOData = {
    title: seoData.title || defaultConfig.defaultTitle,
    description: seoData.description || defaultConfig.defaultDescription,
    keywords: seoData.keywords || [],
    canonicalUrl: seoData.canonicalUrl,
    ogImage: seoData.ogImage,
    ogType: seoData.ogType || 'website',
    publishedTime: seoData.publishedTime,
    modifiedTime: seoData.modifiedTime,
    author: seoData.author,
    section: seoData.section,
    tags: seoData.tags || []
  }

  // Optimize title length (50-60 characters)
  if (optimized.title.length > 60) {
    optimized.title = optimized.title.substring(0, 57) + '...'
  }

  // Optimize description length (150-160 characters)
  if (optimized.description.length > 160) {
    optimized.description = generateMetaDescription(optimized.description, 160)
  }

  // Limit keywords
  if (optimized.keywords.length > 10) {
    optimized.keywords = optimized.keywords.slice(0, 10)
  }

  return optimized
}

/**
 * Generate social media optimized content
 */
export function generateSocialContent(seoData: SEOData, platform: 'twitter' | 'facebook' | 'linkedin') {
  const limits = {
    twitter: { title: 70, description: 200 },
    facebook: { title: 100, description: 300 },
    linkedin: { title: 150, description: 600 }
  }
  
  const limit = limits[platform]
  
  return {
    title: seoData.title.length > limit.title 
      ? seoData.title.substring(0, limit.title - 3) + '...'
      : seoData.title,
    description: seoData.description.length > limit.description
      ? seoData.description.substring(0, limit.description - 3) + '...'
      : seoData.description,
    hashtags: platform === 'twitter' 
      ? seoData.keywords?.slice(0, 3).map(k => `#${k.replace(/\s+/g, '')}`) || []
      : []
  }
}

/**
 * Analyze content for SEO score
 */
export function analyzeSEOScore(content: string, seoData: SEOData): {
  score: number
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // Title analysis
  if (!seoData.title || seoData.title.length < 30) {
    issues.push('Title is too short (should be 30-60 characters)')
    score -= 15
  }
  if (seoData.title && seoData.title.length > 60) {
    issues.push('Title is too long (should be 30-60 characters)')
    score -= 10
  }

  // Description analysis
  if (!seoData.description || seoData.description.length < 120) {
    issues.push('Meta description is too short (should be 120-160 characters)')
    score -= 15
  }
  if (seoData.description && seoData.description.length > 160) {
    issues.push('Meta description is too long (should be 120-160 characters)')
    score -= 10
  }

  // Content analysis
  const wordCount = content.split(/\s+/).length
  if (wordCount < 300) {
    issues.push('Content is too short (should be at least 300 words)')
    score -= 20
  }

  // Keyword analysis
  if (!seoData.keywords || seoData.keywords.length === 0) {
    issues.push('No keywords specified')
    score -= 10
  }

  // Heading analysis
  const headingMatches = content.match(/<h[1-6][^>]*>/gi) || []
  if (headingMatches.length === 0) {
    issues.push('No headings found in content')
    score -= 15
  }

  // Image analysis
  const imageMatches = content.match(/<img[^>]*>/gi) || []
  const imagesWithoutAlt = content.match(/<img(?![^>]*alt=)[^>]*>/gi) || []
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} images missing alt text`)
    score -= 10
  }

  // Generate suggestions
  if (score < 80) {
    suggestions.push('Consider adding more relevant keywords to your content')
    suggestions.push('Use headings (H1, H2, H3) to structure your content')
    suggestions.push('Add internal links to related content')
    suggestions.push('Ensure all images have descriptive alt text')
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions
  }
}

/**
 * Generate schema markup for different content types
 */
export function generateSchemaMarkup(
  contentType: 'article' | 'product' | 'review' | 'faq' | 'howto',
  data: any,
  options: SEOConfig = defaultConfig
) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': contentType === 'article' ? 'Article' : 
             contentType === 'product' ? 'Product' :
             contentType === 'review' ? 'Review' :
             contentType === 'faq' ? 'FAQPage' :
             'HowTo'
  }

  // Add specific properties based on content type
  switch (contentType) {
    case 'article':
      return {
        ...baseSchema,
        headline: data.title,
        description: data.description,
        author: {
          '@type': 'Organization',
          name: options.siteName
        },
        publisher: {
          '@type': 'Organization',
          name: options.siteName
        },
        datePublished: data.publishedAt,
        dateModified: data.updatedAt,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${options.siteUrl}${data.url}`
        }
      }
    
    case 'product':
      return {
        ...baseSchema,
        name: data.title,
        description: data.description,
        image: data.images?.map((img: any) => `${options.siteUrl}${img.url}`) || [],
        offers: {
          '@type': 'Offer',
          price: data.price?.current,
          priceCurrency: data.price?.currency || 'USD',
          availability: 'https://schema.org/InStock'
        }
      }
    
    default:
      return baseSchema
  }
}