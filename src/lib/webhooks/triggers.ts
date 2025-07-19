import { WebhookService } from '@/lib/services/webhook-service'
import { WebhookEvent } from '@prisma/client'

/**
 * Webhook trigger utility for firing webhooks on various events
 */
export class WebhookTriggers {
  /**
   * Trigger webhook for product created event
   */
  static async productCreated(product: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.PRODUCT_CREATED, {
        product: {
          id: product.id,
          title: product.title,
          slug: product.slug,
          status: product.status,
          currentPrice: product.currentPrice,
          currency: product.currency,
          category: product.category,
          createdAt: product.createdAt,
          createdBy: product.createdBy,
        },
      })
    } catch (error) {
      console.error('Failed to trigger product created webhook:', error)
    }
  }

  /**
   * Trigger webhook for product updated event
   */
  static async productUpdated(product: any, changes: Record<string, any>) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.PRODUCT_UPDATED, {
        product: {
          id: product.id,
          title: product.title,
          slug: product.slug,
          status: product.status,
          currentPrice: product.currentPrice,
          currency: product.currency,
          category: product.category,
          updatedAt: product.updatedAt,
        },
        changes,
      })
    } catch (error) {
      console.error('Failed to trigger product updated webhook:', error)
    }
  }

  /**
   * Trigger webhook for product deleted event
   */
  static async productDeleted(productId: string, productData: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.PRODUCT_DELETED, {
        productId,
        product: productData,
        deletedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to trigger product deleted webhook:', error)
    }
  }

  /**
   * Trigger webhook for product status changed event
   */
  static async productStatusChanged(product: any, oldStatus: string, newStatus: string) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.PRODUCT_STATUS_CHANGED, {
        product: {
          id: product.id,
          title: product.title,
          slug: product.slug,
        },
        statusChange: {
          from: oldStatus,
          to: newStatus,
          changedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Failed to trigger product status changed webhook:', error)
    }
  }

  /**
   * Trigger webhook for link clicked event
   */
  static async linkClicked(clickData: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.LINK_CLICKED, {
        click: {
          id: clickData.id,
          linkId: clickData.linkId,
          sessionId: clickData.sessionId,
          timestamp: clickData.timestamp,
          country: clickData.country,
          device: clickData.device,
          referrer: clickData.referrer,
        },
        product: clickData.product ? {
          id: clickData.product.id,
          title: clickData.product.title,
          slug: clickData.product.slug,
        } : null,
      })
    } catch (error) {
      console.error('Failed to trigger link clicked webhook:', error)
    }
  }

  /**
   * Trigger webhook for conversion tracked event
   */
  static async conversionTracked(conversionData: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.CONVERSION_TRACKED, {
        conversion: {
          id: conversionData.id,
          linkId: conversionData.linkId,
          orderValue: conversionData.orderValue,
          commission: conversionData.commission,
          currency: conversionData.currency,
          status: conversionData.status,
          timestamp: conversionData.timestamp,
        },
        product: conversionData.product ? {
          id: conversionData.product.id,
          title: conversionData.product.title,
          slug: conversionData.product.slug,
        } : null,
      })
    } catch (error) {
      console.error('Failed to trigger conversion tracked webhook:', error)
    }
  }

  /**
   * Trigger webhook for user registered event
   */
  static async userRegistered(user: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.USER_REGISTERED, {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        profile: user.profile ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          timezone: user.profile.timezone,
        } : null,
      })
    } catch (error) {
      console.error('Failed to trigger user registered webhook:', error)
    }
  }

  /**
   * Trigger webhook for user updated event
   */
  static async userUpdated(user: any, changes: Record<string, any>) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.USER_UPDATED, {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt || new Date().toISOString(),
        },
        changes,
      })
    } catch (error) {
      console.error('Failed to trigger user updated webhook:', error)
    }
  }

  /**
   * Trigger webhook for campaign started event
   */
  static async campaignStarted(campaign: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.CAMPAIGN_STARTED, {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          budget: campaign.budget,
          targetRevenue: campaign.targetRevenue,
        },
      })
    } catch (error) {
      console.error('Failed to trigger campaign started webhook:', error)
    }
  }

  /**
   * Trigger webhook for campaign ended event
   */
  static async campaignEnded(campaign: any, results: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.CAMPAIGN_ENDED, {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          budget: campaign.budget,
          targetRevenue: campaign.targetRevenue,
        },
        results: {
          actualRevenue: results.actualRevenue,
          totalClicks: results.totalClicks,
          totalConversions: results.totalConversions,
          conversionRate: results.conversionRate,
          roi: results.roi,
        },
      })
    } catch (error) {
      console.error('Failed to trigger campaign ended webhook:', error)
    }
  }

  /**
   * Trigger webhook for price alert triggered event
   */
  static async priceAlertTriggered(alert: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.PRICE_ALERT_TRIGGERED, {
        alert: {
          id: alert.id,
          targetPrice: alert.targetPrice,
          currentPrice: alert.currentPrice,
          triggeredAt: alert.triggeredAt,
        },
        product: {
          id: alert.product.id,
          title: alert.product.title,
          slug: alert.product.slug,
          currentPrice: alert.product.currentPrice,
          currency: alert.product.currency,
        },
        user: {
          id: alert.userProfile.userId,
          email: alert.userProfile.user?.email,
        },
      })
    } catch (error) {
      console.error('Failed to trigger price alert webhook:', error)
    }
  }

  /**
   * Trigger webhook for analytics milestone event
   */
  static async analyticsMilestone(milestone: any) {
    try {
      await WebhookService.triggerWebhook(WebhookEvent.ANALYTICS_MILESTONE, {
        milestone: {
          type: milestone.type, // 'clicks', 'conversions', 'revenue', etc.
          value: milestone.value,
          threshold: milestone.threshold,
          period: milestone.period,
          achievedAt: milestone.achievedAt,
        },
        metrics: milestone.metrics,
      })
    } catch (error) {
      console.error('Failed to trigger analytics milestone webhook:', error)
    }
  }
}