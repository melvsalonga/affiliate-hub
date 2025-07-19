import { prisma } from '@/lib/prisma'

export interface EmailProvider {
  id: string
  name: string
  type: 'mailchimp' | 'convertkit' | 'mailerlite' | 'sendinblue'
  apiKey: string
  apiUrl?: string
  listId?: string
  isActive: boolean
  settings?: Record<string, any>
}

export interface EmailCampaign {
  id: string
  providerId: string
  name: string
  subject: string
  content: string
  type: 'newsletter' | 'price_alert' | 'deal_notification' | 'welcome' | 'abandoned_cart'
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  scheduledAt?: Date
  sentAt?: Date
  recipients: number
  opens: number
  clicks: number
  unsubscribes: number
}

export interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
}

export class EmailMarketingService {
  /**
   * Mailchimp Integration
   */
  static async mailchimpRequest(apiKey: string, endpoint: string, method: string = 'GET', data?: any) {
    const datacenter = apiKey.split('-')[1]
    const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Mailchimp API error: ${response.statusText}`)
    }

    return await response.json()
  }

  static async addToMailchimpList(apiKey: string, listId: string, email: string, mergeFields?: Record<string, any>) {
    return await this.mailchimpRequest(apiKey, `/lists/${listId}/members`, 'POST', {
      email_address: email,
      status: 'subscribed',
      merge_fields: mergeFields || {},
    })
  }

  static async createMailchimpCampaign(apiKey: string, listId: string, campaign: {
    subject: string
    title: string
    fromName: string
    fromEmail: string
    htmlContent: string
  }) {
    // Create campaign
    const campaignData = await this.mailchimpRequest(apiKey, '/campaigns', 'POST', {
      type: 'regular',
      recipients: {
        list_id: listId,
      },
      settings: {
        subject_line: campaign.subject,
        title: campaign.title,
        from_name: campaign.fromName,
        reply_to: campaign.fromEmail,
      },
    })

    // Set campaign content
    await this.mailchimpRequest(apiKey, `/campaigns/${campaignData.id}/content`, 'PUT', {
      html: campaign.htmlContent,
    })

    return campaignData
  }

  /**
   * ConvertKit Integration
   */
  static async convertkitRequest(apiKey: string, endpoint: string, method: string = 'GET', data?: any) {
    const baseUrl = 'https://api.convertkit.com/v3'
    const url = new URL(`${baseUrl}${endpoint}`)
    
    if (method === 'GET') {
      url.searchParams.append('api_key', apiKey)
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify({ ...data, api_key: apiKey }) : undefined,
    })

    if (!response.ok) {
      throw new Error(`ConvertKit API error: ${response.statusText}`)
    }

    return await response.json()
  }

  static async addToConvertkitForm(apiKey: string, formId: string, email: string, firstName?: string) {
    return await this.convertkitRequest(apiKey, `/forms/${formId}/subscribe`, 'POST', {
      email,
      first_name: firstName,
    })
  }

  static async createConvertkitBroadcast(apiKey: string, broadcast: {
    subject: string
    content: string
    description?: string
  }) {
    return await this.convertkitRequest(apiKey, '/broadcasts', 'POST', {
      subject: broadcast.subject,
      content: broadcast.content,
      description: broadcast.description,
    })
  }

  /**
   * Generic Email Marketing Operations
   */
  static async getProviders(): Promise<EmailProvider[]> {
    // In a real implementation, this would fetch from database
    // For now, return mock data
    return [
      {
        id: '1',
        name: 'Mailchimp',
        type: 'mailchimp',
        apiKey: process.env.MAILCHIMP_API_KEY || '',
        listId: process.env.MAILCHIMP_LIST_ID || '',
        isActive: !!process.env.MAILCHIMP_API_KEY,
      },
      {
        id: '2',
        name: 'ConvertKit',
        type: 'convertkit',
        apiKey: process.env.CONVERTKIT_API_KEY || '',
        listId: process.env.CONVERTKIT_FORM_ID || '',
        isActive: !!process.env.CONVERTKIT_API_KEY,
      },
    ]
  }

  static async subscribeToNewsletter(email: string, firstName?: string, lastName?: string) {
    const providers = await this.getProviders()
    const results = []

    for (const provider of providers.filter(p => p.isActive)) {
      try {
        let result
        
        switch (provider.type) {
          case 'mailchimp':
            result = await this.addToMailchimpList(
              provider.apiKey,
              provider.listId!,
              email,
              {
                FNAME: firstName,
                LNAME: lastName,
              }
            )
            break
            
          case 'convertkit':
            result = await this.addToConvertkitForm(
              provider.apiKey,
              provider.listId!,
              email,
              firstName
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

  static async sendPriceAlert(email: string, product: any, oldPrice: number, newPrice: number) {
    const template = await this.getEmailTemplate('price_alert')
    if (!template) {
      throw new Error('Price alert template not found')
    }

    const variables = {
      product_name: product.title,
      product_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
      old_price: oldPrice.toFixed(2),
      new_price: newPrice.toFixed(2),
      savings: (oldPrice - newPrice).toFixed(2),
      savings_percent: Math.round(((oldPrice - newPrice) / oldPrice) * 100),
      currency: product.currency || 'USD',
    }

    const htmlContent = this.replaceTemplateVariables(template.htmlContent, variables)
    const subject = this.replaceTemplateVariables(template.subject, variables)

    return await this.sendEmail({
      to: email,
      subject,
      htmlContent,
      type: 'price_alert',
    })
  }

  static async sendDealNotification(emails: string[], deal: any) {
    const template = await this.getEmailTemplate('deal_notification')
    if (!template) {
      throw new Error('Deal notification template not found')
    }

    const variables = {
      deal_title: deal.title,
      deal_description: deal.description,
      deal_url: `${process.env.NEXT_PUBLIC_APP_URL}/deals/${deal.slug}`,
      original_price: deal.originalPrice?.toFixed(2) || '',
      sale_price: deal.currentPrice.toFixed(2),
      discount_percent: deal.discountPercent || 0,
      expires_at: deal.expiresAt ? new Date(deal.expiresAt).toLocaleDateString() : '',
    }

    const htmlContent = this.replaceTemplateVariables(template.htmlContent, variables)
    const subject = this.replaceTemplateVariables(template.subject, variables)

    const results = []
    for (const email of emails) {
      try {
        const result = await this.sendEmail({
          to: email,
          subject,
          htmlContent,
          type: 'deal_notification',
        })
        results.push({ email, success: true, result })
      } catch (error) {
        results.push({
          email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  static async createAutomatedCampaign(type: string, config: {
    name: string
    trigger: 'user_signup' | 'price_drop' | 'new_product' | 'abandoned_cart'
    delay?: number // minutes
    conditions?: Record<string, any>
    templateId: string
  }) {
    // This would integrate with email providers' automation features
    // For now, we'll store the configuration for manual processing
    
    const campaign = {
      id: crypto.randomUUID(),
      name: config.name,
      type,
      trigger: config.trigger,
      delay: config.delay || 0,
      conditions: config.conditions || {},
      templateId: config.templateId,
      isActive: true,
      createdAt: new Date(),
    }

    // In a real implementation, save to database
    console.log('Created automated campaign:', campaign)
    
    return campaign
  }

  static async getEmailTemplate(type: string): Promise<EmailTemplate | null> {
    // Mock templates - in real implementation, fetch from database
    const templates: Record<string, EmailTemplate> = {
      price_alert: {
        id: '1',
        name: 'Price Alert',
        type: 'price_alert',
        subject: '🔥 Price Drop Alert: {{product_name}} is now {{new_price}} {{currency}}!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Price Drop Alert!</h2>
            <p>Great news! The price for <strong>{{product_name}}</strong> has dropped!</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><s style="color: #6c757d;">Was: {{old_price}} {{currency}}</s></p>
              <p style="margin: 0; font-size: 24px; color: #e74c3c; font-weight: bold;">Now: {{new_price}} {{currency}}</p>
              <p style="margin: 0; color: #28a745; font-weight: bold;">You save: {{savings}} {{currency}} ({{savings_percent}}%)</p>
            </div>
            <a href="{{product_url}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Deal</a>
          </div>
        `,
        variables: ['product_name', 'product_url', 'old_price', 'new_price', 'savings', 'savings_percent', 'currency'],
      },
      deal_notification: {
        id: '2',
        name: 'Deal Notification',
        type: 'deal_notification',
        subject: '🎉 New Deal: {{deal_title}} - {{discount_percent}}% Off!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">New Deal Available!</h2>
            <h3>{{deal_title}}</h3>
            <p>{{deal_description}}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><s style="color: #6c757d;">Regular Price: {{original_price}}</s></p>
              <p style="margin: 0; font-size: 24px; color: #e74c3c; font-weight: bold;">Sale Price: {{sale_price}}</p>
              <p style="margin: 0; color: #28a745; font-weight: bold;">{{discount_percent}}% Off!</p>
              {{#expires_at}}<p style="margin: 0; color: #dc3545;">Expires: {{expires_at}}</p>{{/expires_at}}
            </div>
            <a href="{{deal_url}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Get This Deal</a>
          </div>
        `,
        variables: ['deal_title', 'deal_description', 'deal_url', 'original_price', 'sale_price', 'discount_percent', 'expires_at'],
      },
    }

    return templates[type] || null
  }

  static replaceTemplateVariables(template: string, variables: Record<string, any>): string {
    let result = template
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    })

    return result
  }

  static async sendEmail(options: {
    to: string
    subject: string
    htmlContent: string
    textContent?: string
    type: string
  }) {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll use a mock implementation
    
    console.log('Sending email:', {
      to: options.to,
      subject: options.subject,
      type: options.type,
    })

    // Mock successful send
    return {
      id: crypto.randomUUID(),
      status: 'sent',
      sentAt: new Date(),
    }
  }

  static async getCampaignStats(campaignId: string) {
    // Mock campaign statistics
    return {
      campaignId,
      sent: 1250,
      delivered: 1200,
      opens: 480,
      clicks: 96,
      unsubscribes: 3,
      bounces: 50,
      openRate: 40.0,
      clickRate: 8.0,
      unsubscribeRate: 0.25,
      bounceRate: 4.17,
    }
  }

  static async getSubscriberStats() {
    // Mock subscriber statistics
    return {
      total: 5420,
      active: 5200,
      unsubscribed: 180,
      bounced: 40,
      growth: {
        thisMonth: 245,
        lastMonth: 198,
        growthRate: 23.7,
      },
    }
  }
}