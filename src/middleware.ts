import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if the route is an admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login and signup pages
    if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin/signup') {
      return res;
    }

    // If no user, redirect to login
    if (!user) {
      const redirectUrl = new URL('/admin/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user exists in our users table and has proper role
    const { data: userData, error } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    // If user doesn't exist in our system or is not active, redirect to unauthorized
    if (error || !userData || !userData.is_active) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
    }

    // Check role-based access
    const userRole = userData.role;
    const pathname = req.nextUrl.pathname;

    // Admin-only routes
    if (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/settings')) {
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
      }
    }

    // Editor and Admin routes (content management)
    if (pathname.startsWith('/admin/products') || pathname.startsWith('/admin/categories')) {
      if (!['ADMIN', 'EDITOR'].includes(userRole)) {
        return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
      }
    }

    // Update last login time
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return res;
  }

  // For API routes, check authentication if needed
  if (req.nextUrl.pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role for API access
    const { data: userData } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (!userData || !userData.is_active) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Add user info to headers for API routes
    res.headers.set('x-user-id', user.id);
    res.headers.set('x-user-role', userData.role);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all admin routes except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/admin/:path*',
  ],
};
