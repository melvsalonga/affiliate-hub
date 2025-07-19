import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailMarketingService } from '@/lib/services/email-marketing'
import { WebhookTriggers } from '@/lib/webhooks/triggers'
import webpush from 'web-push'

// Configure web-push
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@linkvaultpro.com'),
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all active price alerts where current price <= target price
    const { data: triggeredAlerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select(`
        *,
        products (
          id,
          title,
          current_price,
          currency,
          images
        ),
        user_profiles (
          user_id
        )
      `)
      .eq('is_active', true)
      .lte('products.current_price', 'target_price')

    if (alertsError) {
      console.error('Failed to get triggered alerts:', alertsError)
      return NextResponse.json({ error: 'Failed to get alerts' }, { status: 500 })
    }

    if (!triggeredAlerts || triggeredAlerts.length === 0) {
      return NextResponse.json({ message: 'No triggered alerts found' })
    }

    const processedAlerts = []

    for (const alert of triggeredAlerts) {
      try {
        // Get user's push subscription
        const { data: subscription } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh_key, auth_key')
          .eq('user_profile_id', alert.user_profile_id)
          .single()

        if (subscription) {
          // Calculate discount percentage
          const discount = ((alert.target_price - alert.products.current_price) / alert.target_price * 100).toFixed(0)
          
          // Prepare notification payload
          const payload = JSON.stringify({
            title: '🔥 Price Drop Alert!',
            body: `${alert.products.title} is now ${alert.products.currency}${alert.products.current_price} (${discount}% off!)`,
            icon: '/icon-price-alert.png',
            image: alert.products.images?.[0]?.url,
            tag: `price-alert-${alert.product_id}`,
            data: {
              type: 'price-alert',
              productId: alert.product_id,
              url: `/products/${alert.product_id}`,
              alertId: alert.id
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
            vibrate: [200, 100, 200],
            timestamp: Date.now()
          })

          // Send push notification
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh_key,
                auth: subscription.auth_key
              }
            },
            payload,
            {
              TTL: 24 * 60 * 60, // 24 hours
              urgency: 'high'
            }
          )
        }

        // Get user email for email notification
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', alert.user_profiles.user_id)
          .single()

        // Send email notification
        if (userData?.email) {
          try {
            await EmailMarketingService.sendPriceAlert(
              userData.email,
              alert.products,
              alert.target_price,
              alert.products.current_price
            )
          } catch (emailError) {
            console.error('Failed to send price alert email:', emailError)
          }
        }

        // Trigger webhook for price alert
        await WebhookTriggers.priceAlertTriggered({
          id: alert.id,
          targetPrice: alert.target_price,
          currentPrice: alert.products.current_price,
          triggeredAt: new Date().toISOString(),
          product: alert.products,
          userProfile: {
            userId: alert.user_profiles.user_id,
            user: userData,
          },
        })

        // Mark alert as triggered
        await supabase
          .from('price_alerts')
          .update({
            is_active: false,
            triggered_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', alert.id)

        // Log the alert
        await supabase
          .from('price_alert_logs')
          .insert({
            price_alert_id: alert.id,
            triggered_price: alert.products.current_price,
            target_price: alert.target_price,
            triggered_at: new Date().toISOString()
          })

        processedAlerts.push({
          productId: alert.product_id,
          productTitle: alert.products.title,
          currentPrice: alert.products.current_price,
          targetPrice: alert.target_price,
          currency: alert.products.currency,
          imageUrl: alert.products.images?.[0]?.url
        })

      } catch (error) {
        console.error(`Failed to process alert ${alert.id}:`, error)
        
        // If subscription is invalid, remove it
        if (error instanceof Error && (
          error.message.includes('410') || 
          error.message.includes('invalid') ||
          error.message.includes('expired')
        )) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_profile_id', alert.user_profile_id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedAlerts: processedAlerts.length,
      alerts: processedAlerts
    })

  } catch (error) {
    console.error('Check price alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Cron job endpoint for automated price checking
export async function GET(request: NextRequest) {
  // Verify cron job authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Call the POST method to check alerts
  return POST(request)
}