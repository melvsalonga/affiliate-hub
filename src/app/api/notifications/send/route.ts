import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'
import { z } from 'zod'

// Configure web-push
webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@linkvaultpro.com'),
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

const sendNotificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  image: z.string().optional(),
  tag: z.string().optional(),
  data: z.any().optional(),
  actions: z.array(z.object({
    action: z.string(),
    title: z.string(),
    icon: z.string().optional()
  })).optional(),
  requireInteraction: z.boolean().optional(),
  silent: z.boolean().optional(),
  vibrate: z.array(z.number()).optional(),
  userIds: z.array(z.string()).optional(), // If specified, send only to these users
  broadcast: z.boolean().optional() // If true, send to all subscribed users
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const notification = sendNotificationSchema.parse(body)

    // Get push subscriptions
    let query = supabase
      .from('push_subscriptions')
      .select(`
        endpoint,
        p256dh_key,
        auth_key,
        user_profiles!inner(user_id)
      `)

    if (notification.userIds && notification.userIds.length > 0) {
      query = query.in('user_profiles.user_id', notification.userIds)
    }

    const { data: subscriptions, error: subscriptionsError } = await query

    if (subscriptionsError) {
      console.error('Failed to get push subscriptions:', subscriptionsError)
      return NextResponse.json({ error: 'Failed to get subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' }, { status: 200 })
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      image: notification.image,
      tag: notification.tag,
      data: notification.data,
      actions: notification.actions,
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
      vibrate: notification.vibrate || [100, 50, 100],
      timestamp: Date.now()
    })

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
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
              urgency: 'normal'
            }
          )
          return { success: true, endpoint: subscription.endpoint }
        } catch (error) {
          console.error('Failed to send notification:', error)
          
          // If subscription is invalid, remove it
          if (error instanceof Error && (
            error.message.includes('410') || 
            error.message.includes('invalid') ||
            error.message.includes('expired')
          )) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint)
          }
          
          return { success: false, endpoint: subscription.endpoint, error: error.message }
        }
      })
    )

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.length - successful

    // Log notification
    await supabase
      .from('notification_logs')
      .insert({
        type: 'push',
        title: notification.title,
        body: notification.body,
        recipients_count: subscriptions.length,
        successful_count: successful,
        failed_count: failed,
        sent_by: user.id,
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
      total: subscriptions.length
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}