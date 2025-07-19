import { prisma } from '@/lib/prisma'

export interface SocialMediaProvider {
  id: string
  name: string
  type: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'pinterest'
  accessToken: string
  refreshToken?: string
  accountId?: string
  accountName?: string
  isActive: boolean
  settings?: Record<string, any>
  expiresAt?: Date
}

export interface SocialMediaPost {
  id: string
  providerId: string
  content: string
  mediaUrls?: string[]
  hashtags?: string[]
  scheduledAt?: Date
  postedAt?: Date
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  externalId?: string
  engagement?: {
    likes: number
    shares: number
    comments: number
    clicks: number
  }
}

export interface PostTemplate {
  id: string
  name: string
  type: 'product_launch' | 'deal_alert' | 'price_drop' | 'general'
  content: string
  hashtags: string[]
  variables: string[]
}

export class SocialMediaService {
  /**
   * Twitter/X Integration
   */
  static async twitterRequest(accessToken: string, endpoint: string, method: string = 'GET', data?: any) {
    const baseUrl = 'https://api.twitter.com/2'
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.statusText}`)
    }

    return await response.json()
  }

  static async postToTwitter(accessToken: string, content: string, mediaIds?: string[]) {
    const tweetData: any = { text: content }
    
    if (mediaIds && mediaIds.length > 0) {
      tweetData.media = { media_ids: mediaIds }
    }

    return await this.twitterRequest(accessToken, '/tweets', 'POST', tweetData)
  }

  static async uploadTwitterMedia(accessToken: string, mediaUrl: string) {
    // This would require Twitter API v1.1 for media upload
    // For now, return a mock media ID
    return 'mock_media_id_' + Date.now()
  }

  /**
   * Facebook Integration
   */
  static async facebookRequest(accessToken: string, endpoint: string, method: string = 'GET', data?: any) {
    const baseUrl = 'https://graph.facebook.com/v18.0'
    
    const url = new URL(`${baseUrl}${endpoint}`)
    if (method === 'GET') {
      url.searchParams.append('access_token', accessToken)
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify({ ...data, access_token: accessToken }) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.statusText}`)
    }

    return await response.json()
  }

  static async postToFacebook(accessToken: string, pageId: string, content: string, imageUrl?: string) {
    const postData: any = { message: content }
    
    if (imageUrl) {
      postData.link = imageUrl
    }

    return await this.facebookRequest(accessToken, `/${pageId}/feed`, 'POST', postData)
  }

  /**
   * LinkedIn Integration
   */
  static async linkedinRequest(accessToken: string, endpoint: string, method: string = 'GET', data?: any) {
    const baseUrl = 'https://api.linkedin.com/v2'
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.statusText}`)
    }

    return await response.json()
  }

  static async postToLinkedIn(accessToken: string, personId: string, content: string) {
    const postData = {
      author: `urn:li:person:${personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    return await this.linkedinRequest(accessToken, '/ugcPosts', 'POST', postData)
  }

  /**
   * Generic Social Media Operations
   */
  static async getProviders(): Promise<SocialMediaProvider[]> {
    // In a real implementation, this would fetch from database
    // For now, return mock data based on environment variables
    return [
      {
        id: '1',
        name: 'Twitter',
        type: 'twitter',
        accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
        accountName: process.env.TWITTER_ACCOUNT_NAME || '',
        isActive: !!process.env.TWITTER_ACCESS_TOKEN,
      },
      {
        id: '2',
        name: 'Facebook',
        type: 'facebook',
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
        accountId: process.env.FACEBOOK_PAGE_ID || '',
        accountName: process.env.FACEBOOK_PAGE_NAME || '',
        isActive: !!process.env.FACEBOOK_ACCESS_TOKEN,
      },
      {
        id: '3',
        name: 'LinkedIn',
        type: 'linkedin',
        accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
        accountId: process.env.LINKEDIN_PERSON_ID || '',
        accountName: process.env.LINKEDIN_ACCOUNT_NAME || '',
        isActive: !!process.env.LINKEDIN_ACCESS_TOKEN,
      },
    ]
  }

  static async shareProduct(product: any, platforms: string[], customMessage?: string) {
    const providers = await this.getProviders()
    const activeProviders = providers.filter(p => p.isActive && platforms.includes(p.type))
    
    if (activeProviders.length === 0) {
      throw new Error('No active social media providers found')
    }

    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`
    const imageUrl = product.images?.[0]?.url
    
    const defaultMessage = customMessage || this.generateProductMessage(product)
    
    const results = []

    for (const provider of activeProviders) {
      try {
        let result
        
        switch (provider.type) {
          case 'twitter':
            // Twitter has character limits, so we might need to truncate
            const twitterMessage = this.truncateForTwitter(defaultMessage, productUrl)
            result = await this.postToTwitter(provider.accessToken, twitterMessage)
            break
            
          case 'facebook':
            result = await this.postToFacebook(
              provider.accessToken,
              provider.accountId!,
              defaultMessage,
              imageUrl
            )
            break
            
          case 'linkedin':
            const linkedinMessage = `${defaultMessage}\n\n${productUrl}`
            result = await this.postToLinkedIn(
              provider.accessToken,
              provider.accountId!,
              linkedinMessage
            )
            break
            
          default:
            continue
        }

        results.push({
          provider: provider.name,
          success: true,
          result,
        })
      } catch (error) {
        results.push({
          provider: provider.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  static async shareDeal(deal: any, platforms: string[], customMessage?: string) {
    const providers = await this.getProviders()
    const activeProviders = providers.filter(p => p.isActive && platforms.includes(p.type))
    
    if (activeProviders.length === 0) {
      throw new Error('No active social media providers found')
    }

    const dealUrl = `${process.env.NEXT_PUBLIC_APP_URL}/deals/${deal.slug}`
    const imageUrl = deal.images?.[0]?.url
    
    const defaultMessage = customMessage || this.generateDealMessage(deal)
    
    const results = []

    for (const provider of activeProviders) {
      try {
        let result
        
        switch (provider.type) {
          case 'twitter':
            const twitterMessage = this.truncateForTwitter(defaultMessage, dealUrl)
            result = await this.postToTwitter(provider.accessToken, twitterMessage)
            break
            
          case 'facebook':
            result = await this.postToFacebook(
              provider.accessToken,
              provider.accountId!,
              defaultMessage,
              imageUrl
            )
            break
            
          case 'linkedin':
            const linkedinMessage = `${defaultMessage}\n\n${dealUrl}`
            result = await this.postToLinkedIn(
              provider.accessToken,
              provider.accountId!,
              linkedinMessage
            )
            break
            
          default:
            continue
        }

        results.push({
          provider: provider.name,
          success: true,
          result,
        })
      } catch (error) {
        results.push({
          provider: provider.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  static async schedulePost(post: {
    content: string
    platforms: string[]
    scheduledAt: Date
    mediaUrls?: string[]
    hashtags?: string[]
  }) {
    // In a real implementation, this would save to database and use a job queue
    const scheduledPost = {
      id: crypto.randomUUID(),
      content: post.content,
      platforms: post.platforms,
      scheduledAt: post.scheduledAt,
      mediaUrls: post.mediaUrls || [],
      hashtags: post.hashtags || [],
      status: 'scheduled' as const,
      createdAt: new Date(),
    }

    console.log('Scheduled social media post:', scheduledPost)
    
    return scheduledPost
  }

  static async getPostTemplates(): Promise<PostTemplate[]> {
    // Mock templates - in real implementation, fetch from database
    return [
      {
        id: '1',
        name: 'Product Launch',
        type: 'product_launch',
        content: '🚀 New Product Alert! Check out {{product_name}} - now available for just {{price}} {{currency}}! {{product_url}} #NewProduct #Deal',
        hashtags: ['#NewProduct', '#Deal', '#Shopping'],
        variables: ['product_name', 'price', 'currency', 'product_url'],
      },
      {
        id: '2',
        name: 'Deal Alert',
        type: 'deal_alert',
        content: '🔥 DEAL ALERT! {{product_name}} is now {{discount_percent}}% OFF! Was {{original_price}}, now only {{sale_price}}! Limited time offer! {{product_url}}',
        hashtags: ['#DealAlert', '#Sale', '#Discount', '#LimitedTime'],
        variables: ['product_name', 'discount_percent', 'original_price', 'sale_price', 'product_url'],
      },
      {
        id: '3',
        name: 'Price Drop',
        type: 'price_drop',
        content: '💰 Price Drop Alert! {{product_name}} just dropped to {{new_price}} {{currency}} (was {{old_price}})! Save {{savings_amount}}! {{product_url}}',
        hashtags: ['#PriceDrop', '#Savings', '#Deal'],
        variables: ['product_name', 'new_price', 'currency', 'old_price', 'savings_amount', 'product_url'],
      },
    ]
  }

  static generateProductMessage(product: any): string {
    const price = product.currentPrice ? `${product.currency || '$'}${product.currentPrice}` : ''
    const discount = product.originalPrice && product.currentPrice < product.originalPrice
      ? ` (${Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100)}% OFF!)`
      : ''
    
    return `🛍️ Check out ${product.title}${price ? ` for ${price}` : ''}${discount} #Deal #Shopping #Affiliate`
  }

  static generateDealMessage(deal: any): string {
    const discount = deal.discountPercent ? `${deal.discountPercent}% OFF` : 'Special Deal'
    const price = deal.salePrice ? `${deal.currency || '$'}${deal.salePrice}` : ''
    const originalPrice = deal.originalPrice ? ` (was ${deal.currency || '$'}${deal.originalPrice})` : ''
    
    return `🔥 ${discount}! ${deal.title}${price ? ` now ${price}` : ''}${originalPrice}! Limited time offer! #DealAlert #Sale #Discount`
  }

  static truncateForTwitter(message: string, url: string): string {
    const maxLength = 280
    const urlLength = 23 // Twitter's t.co URL length
    const availableLength = maxLength - urlLength - 1 // -1 for space before URL
    
    if (message.length <= availableLength) {
      return `${message} ${url}`
    }
    
    return `${message.substring(0, availableLength - 3)}... ${url}`
  }

  static replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    })

    return result
  }

  static async getEngagementStats(postId: string) {
    // Mock engagement statistics
    return {
      postId,
      likes: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 50) + 5,
      comments: Math.floor(Math.random() * 20) + 2,
      clicks: Math.floor(Math.random() * 200) + 20,
      reach: Math.floor(Math.random() * 1000) + 100,
      impressions: Math.floor(Math.random() * 2000) + 500,
    }
  }

  static async getSocialMediaStats() {
    // Mock social media statistics
    return {
      totalPosts: 156,
      totalEngagement: 2847,
      averageEngagement: 18.3,
      topPerformingPost: {
        id: '1',
        content: '🔥 DEAL ALERT! Wireless Headphones 50% OFF!',
        platform: 'Twitter',
        engagement: 89,
        date: '2024-01-15',
      },
      platformStats: {
        twitter: {
          posts: 67,
          followers: 1250,
          engagement: 1200,
          growthRate: 12.5,
        },
        facebook: {
          posts: 45,
          followers: 890,
          engagement: 980,
          growthRate: 8.3,
        },
        linkedin: {
          posts: 44,
          followers: 567,
          engagement: 667,
          growthRate: 15.2,
        },
      },
    }
  }
}