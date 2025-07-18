import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/admin'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Create user record in our database if it doesn't exist
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          role: data.user.user_metadata?.role || 'VIEWER',
          is_active: true,
          last_login_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (!userError) {
        // Create user profile if it doesn't exist
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: data.user.id,
            first_name: data.user.user_metadata?.first_name,
            last_name: data.user.user_metadata?.last_name,
            timezone: 'UTC',
            theme: 'SYSTEM',
            language: 'en'
          }, {
            onConflict: 'user_id'
          })
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback_error`)
}