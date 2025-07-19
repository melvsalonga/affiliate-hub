import { Product } from '@prisma/client'

export interface StructuredDataOptions {
  baseUrl: string
  siteName: string
  organizationName: string
  organizationLogo?: string
}

/**
 * Generate Product structured data
 */
export function generateProductStructuredData(
  product: any,
  options: StructuredDataOptions
) {
  const { baseUrl, siteName, organizationName } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images?.map((img: any) => `${baseUrl}${img.url}`) || [],
    url: `${baseUrl}/products/${product.slug}`,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || organizationName
    },
    offers: {
      '@type': 'Offer',
      price: product.price?.current || 0,
      priceCurrency: product.price?.currency || 'USD',
      availability: product.status === 'active' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/products/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: organizationName
      }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    category: product.category?.name
  }
}

/**
 * Generate Review structured data
 */
export function generateReviewStructuredData(
  product: any,
  review: any,
  options: StructuredDataOptions
) {
  const { baseUrl, organizationName } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: product.title,
      image: product.images?.[0]?.url ? `${baseUrl}${product.images[0].url}` : undefined,
      offers: {
        '@type': 'Offer',
        price: product.price?.current || 0,
        priceCurrency: product.price?.currency || 'USD'
      }
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    name: review.title,
    reviewBody: review.content,
    author: {
      '@type': 'Organization',
      name: organizationName
    },
    publisher: {
      '@type': 'Organization',
      name: organizationName
    },
    datePublished: review.publishedAt || review.createdAt,
    dateModified: review.updatedAt
  }
}

/**
 * Generate Article structured data for buying guides and comparisons
 */
export function generateArticleStructuredData(
  article: any,
  options: StructuredDataOptions
) {
  const { baseUrl, organizationName, organizationLogo } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.featuredImage ? `${baseUrl}${article.featuredImage}` : undefined,
    url: `${baseUrl}/${article.type}/${article.slug}`,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Organization',
      name: organizationName,
      logo: organizationLogo ? {
        '@type': 'ImageObject',
        url: `${baseUrl}${organizationLogo}`
      } : undefined
    },
    publisher: {
      '@type': 'Organization',
      name: organizationName,
      logo: organizationLogo ? {
        '@type': 'ImageObject',
        url: `${baseUrl}${organizationLogo}`
      } : undefined
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/${article.type}/${article.slug}`
    }
  }
}

/**
 * Generate HowTo structured data for buying guides
 */
export function generateHowToStructuredData(
  guide: any,
  options: StructuredDataOptions
) {
  const { baseUrl, organizationName } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.description,
    image: guide.featuredImage ? `${baseUrl}${guide.featuredImage}` : undefined,
    totalTime: guide.estimatedReadTime ? `PT${guide.estimatedReadTime}M` : undefined,
    supply: guide.supplies?.map((supply: string) => ({
      '@type': 'HowToSupply',
      name: supply
    })) || [],
    tool: guide.tools?.map((tool: string) => ({
      '@type': 'HowToTool',
      name: tool
    })) || [],
    step: guide.steps?.map((step: any, index: number) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
      image: step.image ? `${baseUrl}${step.image}` : undefined
    })) || [],
    author: {
      '@type': 'Organization',
      name: organizationName
    }
  }
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>,
  options: StructuredDataOptions
) {
  const { baseUrl } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`
    }))
  }
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData(options: StructuredDataOptions) {
  const { baseUrl, organizationName, organizationLogo } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizationName,
    url: baseUrl,
    logo: organizationLogo ? {
      '@type': 'ImageObject',
      url: `${baseUrl}${organizationLogo}`
    } : undefined,
    sameAs: [
      // Add social media URLs here
    ]
  }
}

/**
 * Generate WebSite structured data with search functionality
 */
export function generateWebSiteStructuredData(options: StructuredDataOptions) {
  const { baseUrl, siteName } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Generate ItemList structured data for product roundups
 */
export function generateItemListStructuredData(
  items: any[],
  listName: string,
  options: StructuredDataOptions
) {
  const { baseUrl } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.title,
        description: item.description,
        image: item.image ? `${baseUrl}${item.image}` : undefined,
        url: `${baseUrl}/products/${item.slug}`,
        offers: item.price ? {
          '@type': 'Offer',
          price: item.price.current,
          priceCurrency: item.price.currency || 'USD'
        } : undefined
      }
    }))
  }
}

/**
 * Generate VideoObject structured data
 */
export function generateVideoStructuredData(
  video: any,
  options: StructuredDataOptions
) {
  const { baseUrl, organizationName } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnail ? `${baseUrl}${video.thumbnail}` : undefined,
    uploadDate: video.publishedAt || video.createdAt,
    duration: video.duration,
    embedUrl: video.embedUrl,
    publisher: {
      '@type': 'Organization',
      name: organizationName
    }
  }
}

/**
 * Generate Offer structured data for deals
 */
export function generateOfferStructuredData(
  product: any,
  deal: any,
  options: StructuredDataOptions
) {
  const { baseUrl, organizationName } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.images?.[0]?.url ? `${baseUrl}${product.images[0].url}` : undefined
    },
    price: deal.salePrice,
    priceCurrency: deal.currency || 'USD',
    priceValidUntil: deal.expiresAt,
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: organizationName
    },
    url: `${baseUrl}/products/${product.slug}`,
    validFrom: deal.startsAt,
    validThrough: deal.expiresAt
  }
}

/**
 * Generate LocalBusiness structured data
 */
export function generateLocalBusinessStructuredData(
  business: any,
  options: StructuredDataOptions
) {
  const { baseUrl } = options
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    url: baseUrl,
    telephone: business.phone,
    email: business.email,
    address: business.address ? {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.zip,
      addressCountry: business.address.country
    } : undefined,
    geo: business.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: business.coordinates.lat,
      longitude: business.coordinates.lng
    } : undefined,
    openingHours: business.hours,
    priceRange: business.priceRange,
    aggregateRating: business.rating ? {
      '@type': 'AggregateRating',
      ratingValue: business.rating.average,
      reviewCount: business.rating.count
    } : undefined
  }
}

/**
 * Combine multiple structured data objects
 */
export function combineStructuredData(...dataObjects: any[]) {
  return dataObjects.filter(Boolean)
}

/**
 * Convert structured data to JSON-LD script tag
 */
export function structuredDataToScript(data: any | any[]) {
  const jsonData = Array.isArray(data) ? data : [data]
  
  return {
    __html: JSON.stringify(jsonData.filter(Boolean), null, 2)
  }
}