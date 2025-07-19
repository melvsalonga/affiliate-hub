'use client'

import { PushNotificationManager } from '@/lib/pwa/service-worker'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  timestamp?: number
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface PriceAlert {
  productId: string
  productTitle: string
  currentPrice: number
  targetPrice: number
  currency: string
  imageUrl?: string
}

export interface DealNotification {
  dealId: string
  title: string
  description: string
  discount: number
  expiresAt: Date
  productUrl: string
  imageUrl?: string
}

export class NotificationService {
  private pushManager: PushNotificationManager | null = null
  private vapidPublicKey: string

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey
  }

  async initialize(registration: ServiceWorkerRegistration | null) {
    if (registration) {
      this.pushManager = new PushNotificationManager(registration)
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.pushManager) {
      console.warn('Push manager not initialized')
      return false
    }

    try {
      const permission = await this.pushManager.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.pushManager) {
      console.warn('Push manager not initialized')
      return null
    }

    try {
      return await this.pushManager.subscribe(this.vapidPublicKey)
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.pushManager) {
      console.warn('Push manager not initialized')
      return
    }

    try {
      await this.pushManager.unsubscribe()
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.pushManager) {
      return null
    }

    try {
      return await this.pushManager.getSubscription()
    } catch (error) {
      console.error('Failed to get push subscription:', error)
      return null
    }
  }

  // Send subscription to server
  async saveSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to save subscription:', error)
      return false
    }
  }

  // Remove subscription from server
  async removeSubscription(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      return response.ok
    } catch (error) {
      console.error('Failed to remove subscription:', error)
      return false
    }
  }

  // Show local notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        image: payload.image,
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        vibrate: payload.vibrate || [100, 50, 100],
        timestamp: payload.timestamp || Date.now()
      })
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }

  // Price alert notification
  async showPriceAlert(alert: PriceAlert): Promise<void> {
    const discount = ((alert.targetPrice - alert.currentPrice) / alert.targetPrice * 100).toFixed(0)
    
    await this.showNotification({
      title: '🔥 Price Drop Alert!',
      body: `${alert.productTitle} is now ${alert.currency}${alert.currentPrice} (${discount}% off!)`,
      icon: '/icon-price-alert.png',
      image: alert.imageUrl,
      tag: `price-alert-${alert.productId}`,
      data: {
        type: 'price-alert',
        productId: alert.productId,
        url: `/products/${alert.productId}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Product',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-dismiss.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200]
    })
  }

  // Deal notification
  async showDealNotification(deal: DealNotification): Promise<void> {
    const timeLeft = Math.ceil((deal.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
    
    await this.showNotification({
      title: '💰 New Deal Available!',
      body: `${deal.title} - ${deal.discount}% off! Expires in ${timeLeft}h`,
      icon: '/icon-deal.png',
      image: deal.imageUrl,
      tag: `deal-${deal.dealId}`,
      data: {
        type: 'deal',
        dealId: deal.dealId,
        url: deal.productUrl
      },
      actions: [
        {
          action: 'view',
          title: 'View Deal',
          icon: '/icon-view.png'
        },
        {
          action: 'share',
          title: 'Share',
          icon: '/icon-share.png'
        }
      ],
      requireInteraction: true,
      vibrate: [100, 50, 100, 50, 100]
    })
  }

  // Analytics notification
  async showAnalyticsUpdate(data: {
    clicks: number
    conversions: number
    revenue: number
    period: string
  }): Promise<void> {
    await this.showNotification({
      title: '📊 Performance Update',
      body: `${data.period}: ${data.clicks} clicks, ${data.conversions} conversions, $${data.revenue} revenue`,
      icon: '/icon-analytics.png',
      tag: 'analytics-update',
      data: {
        type: 'analytics',
        url: '/admin/analytics'
      },
      actions: [
        {
          action: 'view',
          title: 'View Analytics',
          icon: '/icon-view.png'
        }
      ]
    })
  }

  // System notification
  async showSystemNotification(title: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    const icons = {
      info: '/icon-info.png',
      warning: '/icon-warning.png',
      error: '/icon-error.png'
    }

    await this.showNotification({
      title,
      body: message,
      icon: icons[type],
      tag: `system-${type}`,
      data: {
        type: 'system',
        level: type
      }
    })
  }
}

// Price monitoring service
export class PriceMonitoringService {
  private notificationService: NotificationService

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService
  }

  async checkPriceAlerts(): Promise<void> {
    try {
      const response = await fetch('/api/price-alerts/check', {
        method: 'POST'
      })

      if (response.ok) {
        const alerts = await response.json()
        
        for (const alert of alerts) {
          await this.notificationService.showPriceAlert(alert)
        }
      }
    } catch (error) {
      console.error('Failed to check price alerts:', error)
    }
  }

  async setupPriceAlert(productId: string, targetPrice: number): Promise<boolean> {
    try {
      const response = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          targetPrice
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to setup price alert:', error)
      return false
    }
  }

  async removePriceAlert(productId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/price-alerts/${productId}`, {
        method: 'DELETE'
      })

      return response.ok
    } catch (error) {
      console.error('Failed to remove price alert:', error)
      return false
    }
  }
}

// Notification preferences manager
export class NotificationPreferencesManager {
  async getPreferences(): Promise<any> {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
    }
    return null
  }

  async updatePreferences(preferences: any): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })

      return response.ok
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return false
    }
  }

  async testNotification(): Promise<void> {
    const notificationService = new NotificationService(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
    
    await notificationService.showNotification({
      title: '🔔 Test Notification',
      body: 'This is a test notification from LinkVault Pro!',
      tag: 'test-notification',
      data: {
        type: 'test'
      }
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
)

export const priceMonitoringService = new PriceMonitoringService(notificationService)
export const notificationPreferencesManager = new NotificationPreferencesManager()