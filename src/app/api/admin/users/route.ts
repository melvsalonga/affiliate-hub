import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createUserSchema, updateUserSchema } from '@/lib/validations/user'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        is_active,
        created_at,
        last_login_at,
        profile:user_profiles(
          first_name,
          last_name,
          avatar
        )
      `, { count: 'exact' })

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,profile.first_name.ilike.%${search}%,profile.last_name.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: users, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        first_name: body.firstName,
        last_name: body.lastName,
        role: validatedData.role
      }
    })

    if (authCreateError) {
      return NextResponse.json({ error: authCreateError.message }, { status: 400 })
    }

    // Create user record in our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        role: validatedData.role,
        is_active: validatedData.isActive
      })
      .select()
      .single()

    if (userError) {
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user profile
    if (body.firstName || body.lastName) {
      await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          first_name: body.firstName,
          last_name: body.lastName,
          timezone: 'UTC',
          theme: 'SYSTEM',
          language: 'en'
        })
    }

    return NextResponse.json({ success: true, user: userData })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}