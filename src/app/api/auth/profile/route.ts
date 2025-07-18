import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { userProfileSchema } from '@/lib/validations/user'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data with profile
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        is_active,
        created_at,
        last_login_at,
        profile:user_profiles(
          id,
          first_name,
          last_name,
          avatar,
          timezone,
          theme,
          language,
          email_notifications:email_notification_settings(
            new_conversions,
            weekly_reports,
            system_updates
          ),
          push_notifications:push_notification_settings(
            real_time_alerts,
            daily_summary
          )
        )
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate the profile data
    const validatedData = userProfileSchema.parse(body)

    // Update user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        avatar: validatedData.avatar,
        timezone: validatedData.timezone,
        theme: validatedData.theme,
        language: validatedData.language
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Update notification settings if provided
    if (body.emailNotifications) {
      await supabase
        .from('email_notification_settings')
        .upsert({
          user_profile_id: profileData.id,
          new_conversions: body.emailNotifications.newConversions,
          weekly_reports: body.emailNotifications.weeklyReports,
          system_updates: body.emailNotifications.systemUpdates
        }, {
          onConflict: 'user_profile_id'
        })
    }

    if (body.pushNotifications) {
      await supabase
        .from('push_notification_settings')
        .upsert({
          user_profile_id: profileData.id,
          real_time_alerts: body.pushNotifications.realTimeAlerts,
          daily_summary: body.pushNotifications.dailySummary
        }, {
          onConflict: 'user_profile_id'
        })
    }

    return NextResponse.json({ success: true, profile: profileData })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}