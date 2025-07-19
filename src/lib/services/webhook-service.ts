import { prisma } from '@/lib/prisma'
import { WebhookEvent, WebhookDeliveryStatus } from '@prisma/client'
import crypto from 'crypto'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  id: string
}

export interface CreateWebhookData {
  name: string
  description?: string
  url: string
  secret?: string
  events: WebhookEvent[]
  headers?: Record<string, string>
  retryAttempts?: number
  timeout?: number
  createdBy: string
}

export interface UpdateWebhookData {
  name?: string
  description?: string
  url?: string
  secret?: string
  events?: WebhookEvent[]
  headers?: Record<string, string>
  retryAttempts?: number
  timeout?: number
  isActive?: boolean
}

export class WebhookService {
  /**
   * Create a new webhook
   */
  static async createWebhook(data: CreateWebhookData) {
    return await prisma.webhook.create({
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        secret: data.secret,
        events: data.events,
        headers: data.headers || {},
        retryAttempts: data.retryAttempts || 3,
        timeout: data.timeout || 30,
        createdBy: data.createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Get all webhooks with optional filtering
   */
  static async getWebhooks(filters?: {
    isActive?: boolean
    event?: WebhookEvent
    createdBy?: string
  }) {
    const where: any = {}
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }
    
    if (filters?.event) {
      where.events = {
        has: filters.event,
      }
    }
    
    if (filters?.createdBy) {
      where.createdBy = filters.createdBy
    }

    return await prisma.webhook.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get webhook by ID
   */
  static async getWebhookById(id: string) {
    return await prisma.webhook.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        deliveries: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  }

  /**
   * Update webhook
   */
  static async updateWebhook(id: string, data: UpdateWebhookData) {
    return await prisma.webhook.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Delete webhook
   */
  static async deleteWebhook(id: string) {
    return await prisma.webhook.delete({
      where: { id },
    })
  }

  /**
   * Trigger webhook for specific event
   */
  static async triggerWebhook(event: WebhookEvent, data: any) {
    // Find all active webhooks that listen to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: event,
        },
      },
    })

    if (webhooks.length === 0) {
      return { triggered: 0, deliveries: [] }
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      id: crypto.randomUUID(),
    }

    // Create delivery records for each webhook
    const deliveries = await Promise.all(
      webhooks.map(webhook =>
        prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload,
            status: WebhookDeliveryStatus.PENDING,
          },
        })
      )
    )

    // Queue deliveries for processing
    await Promise.all(
      deliveries.map(delivery =>
        this.processWebhookDelivery(delivery.id)
      )
    )

    return {
      triggered: webhooks.length,
      deliveries: deliveries.map(d => d.id),
    }
  }

  /**
   * Process webhook delivery
   */
  static async processWebhookDelivery(deliveryId: string) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        webhook: true,
      },
    })

    if (!delivery || !delivery.webhook) {
      throw new Error('Webhook delivery not found')
    }

    const webhook = delivery.webhook
    const startTime = Date.now()

    try {
      // Update status to retrying
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: WebhookDeliveryStatus.RETRYING,
        },
      })

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'LinkVault-Pro-Webhook/1.0',
        ...((webhook.headers as Record<string, string>) || {}),
      }

      // Add signature if secret is provided
      if (webhook.secret) {
        const signature = this.generateSignature(
          JSON.stringify(delivery.payload),
          webhook.secret
        )
        headers['X-Webhook-Signature'] = signature
      }

      // Make HTTP request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout * 1000)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseTime = Date.now() - startTime
      const responseBody = await response.text()

      // Update delivery record
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: response.ok ? WebhookDeliveryStatus.SUCCESS : WebhookDeliveryStatus.FAILED,
          httpStatus: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit response body size
          responseTime,
          deliveredAt: new Date(),
          errorMessage: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
        },
      })

      return {
        success: response.ok,
        status: response.status,
        responseTime,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Check if we should retry
      const shouldRetry = delivery.attempt < webhook.retryAttempts
      const nextRetryAt = shouldRetry
        ? new Date(Date.now() + Math.pow(2, delivery.attempt) * 60000) // Exponential backoff
        : null

      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: shouldRetry ? WebhookDeliveryStatus.PENDING : WebhookDeliveryStatus.FAILED,
          attempt: delivery.attempt + 1,
          responseTime,
          errorMessage,
          nextRetryAt,
        },
      })

      // Schedule retry if needed
      if (shouldRetry && nextRetryAt) {
        // In a real implementation, you'd use a job queue like Bull or Agenda
        setTimeout(() => {
          this.processWebhookDelivery(deliveryId)
        }, nextRetryAt.getTime() - Date.now())
      }

      return {
        success: false,
        error: errorMessage,
        responseTime,
        willRetry: shouldRetry,
      }
    }
  }

  /**
   * Retry failed webhook deliveries
   */
  static async retryFailedDeliveries() {
    const failedDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: WebhookDeliveryStatus.PENDING,
        nextRetryAt: {
          lte: new Date(),
        },
      },
      include: {
        webhook: true,
      },
    })

    const results = await Promise.allSettled(
      failedDeliveries.map(delivery =>
        this.processWebhookDelivery(delivery.id)
      )
    )

    return {
      processed: failedDeliveries.length,
      results,
    }
  }

  /**
   * Get webhook delivery statistics
   */
  static async getWebhookStats(webhookId?: string) {
    const where = webhookId ? { webhookId } : {}

    const [total, successful, failed, pending] = await Promise.all([
      prisma.webhookDelivery.count({ where }),
      prisma.webhookDelivery.count({
        where: { ...where, status: WebhookDeliveryStatus.SUCCESS },
      }),
      prisma.webhookDelivery.count({
        where: { ...where, status: WebhookDeliveryStatus.FAILED },
      }),
      prisma.webhookDelivery.count({
        where: { ...where, status: WebhookDeliveryStatus.PENDING },
      }),
    ])

    const successRate = total > 0 ? (successful / total) * 100 : 0

    return {
      total,
      successful,
      failed,
      pending,
      successRate: Math.round(successRate * 100) / 100,
    }
  }

  /**
   * Get webhook deliveries with pagination
   */
  static async getWebhookDeliveries(
    webhookId?: string,
    options?: {
      page?: number
      limit?: number
      status?: WebhookDeliveryStatus
      event?: WebhookEvent
    }
  ) {
    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}
    if (webhookId) where.webhookId = webhookId
    if (options?.status) where.status = options.status
    if (options?.event) where.event = options.event

    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        include: {
          webhook: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.webhookDelivery.count({ where }),
    ])

    return {
      deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Test webhook by sending a test payload
   */
  static async testWebhook(webhookId: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    })

    if (!webhook) {
      throw new Error('Webhook not found')
    }

    const testPayload = {
      event: 'TEST' as WebhookEvent,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhook: {
          id: webhook.id,
          name: webhook.name,
        },
      },
      id: crypto.randomUUID(),
    }

    // Create test delivery record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: 'PRODUCT_CREATED', // Use a valid enum value for test
        payload: testPayload,
        status: WebhookDeliveryStatus.PENDING,
      },
    })

    // Process the delivery
    const result = await this.processWebhookDelivery(delivery.id)

    return {
      deliveryId: delivery.id,
      result,
    }
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private static generateSignature(payload: string, secret: string): string {
    return `sha256=${crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')}`
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}