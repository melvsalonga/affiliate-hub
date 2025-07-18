import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateUserSchema } from '@/lib/validations/user'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or accessing their own profile
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'ADMIN' && user.id !== params.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or updating their own profile
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = currentUser?.role === 'ADMIN'
    const isOwnProfile = user.id === params.id

    if (!currentUser || (!isAdmin && !isOwnProfile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Non-admins can only update certain fields
    if (!isAdmin) {
      const allowedFields = ['email']
      const hasDisallowedFields = Object.keys(body).some(key => 
        !allowedFields.includes(key) && key !== 'profile'
      )
      
      if (hasDisallowedFields) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const validatedData = updateUserSchema.parse(body)

    // Update user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        email: validatedData.email,
        role: validatedData.role,
        is_active: validatedData.isActive,
        last_login_at: validatedData.lastLoginAt
      })
      .eq('id', params.id)
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Update auth user email if changed
    if (validatedData.email) {
      await supabase.auth.admin.updateUserById(params.id, {
        email: validatedData.email
      })
    }

    return NextResponse.json({ success: true, user: userData })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent self-deletion
    if (user.id === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete from auth (this will cascade to our tables due to foreign key constraints)
    const { error: authError } = await supabase.auth.admin.deleteUser(params.id)

    if (authError) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}