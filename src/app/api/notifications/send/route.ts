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
  userIds: z.array(z.string()).optional(), // If not provided, send to all users
  targetAudience: z.enum(['all', 'admins', 'subscribers']).optional().default('all')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const notificationData = sendNotificationSchema.parse(body)

    // Get target users' push subscriptions
    let query = supabase
      .from('push_subscriptions')
      .select(`
        *,
        user_profiles!inner (
          user_id,
          role,
          notification_preferences
        )
      `)

    // Filter by target audience
    if (notificationData.targetAudience === 'admins') {
      query = query.eq('user_profiles.role', 'admin')
    } else if (notificationData.userIds && notificationData.userIds.length > 0) {
      query = query.in('user_profiles.user_id', notificationData.userIds)
    }

    const { data: subscriptions, error: subscriptionsError } = await query

    if (subscriptionsError) {
      console.error('Failed to get push subscriptions:', subscriptionsError)
      return NextResponse.json({ error: 'Failed to get subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No subscriptions found',
        sent: 0 
      })
    }

    // Check quiet hours for each user
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

    const validSubscriptions = subscriptions.filter(sub => {
      const prefs = sub.user_profiles?.notification_preferences
      if (!prefs?.quietHours?.enabled) return true

      const start = prefs.quietHours.start
      const end = prefs.quietHours.end
      
      // Simple time range check (doesn't handle overnight ranges perfectly)
      if (start <= end) {
        return currentTime < start || currentTime > end
      } else {
        return currentTime < start && currentTime > end
      }
    })

    // Prepare notification payload
    const payload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.body,
      icon: notificationData.icon || '/icon-192x192.png',
      image: notificationData.image,
      tag: notificationData.tag || `notification-${Date.now()}`,
      data: notificationData.data || {},
      actions: notificationData.actions || [],
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false,
      vibrate: notificationData.vibrate || [100, 50, 100],
      timestamp: Date.now()
    })

    // Send notifications
    const results = await Promise.allSettled(
      validSubscriptions.map(async (subscription) => {
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
          return { success: true, subscriptionId: subscription.id }
        } catch (error) {
          console.error(`Failed to send notification to subscription ${subscription.id}:`, error)
          
          // If subscription is invalid, mark for removal
          if (error instanceof Error && (
            error.message.includes('410') || 
            error.message.includes('invalid') ||
            error.message.includes('expired')
          )) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id)
          }
          
          return { success: false, subscriptionId: subscription.id, error: error.message }
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
        title: notificationData.title,
        body: notificationData.body,
        target_audience: notificationData.targetAudience,
        sent_count: successful,
        failed_count: failed,
        sent_by: user.id,
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length
    })

  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Test notification endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's push subscription
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_profile_id', profile.id)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'No push subscription found' }, { status: 404 })
    }

    // Send test notification
    const payload = JSON.stringify({
      title: '🔔 Test Notification',
      body: 'This is a test notification from LinkVault Pro!',
      icon: '/icon-192x192.png',
      tag: 'test-notification',
      data: { type: 'test' },
      timestamp: Date.now()
    })

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      },
      payload
    )

    return NextResponse.json({ success: true, message: 'Test notification sent' })

  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 })
  }
}