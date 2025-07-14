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

  // Check if the route is an admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (req.nextUrl.pathname === '/admin/login') {
      return res;
    }

    // Check authentication for other admin routes
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session, redirect to login
    if (!session) {
      const redirectUrl = new URL('/admin/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user is an admin
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.user.id)
      .eq('is_active', true)
      .single();

    // If not an admin, redirect to unauthorized page
    if (error || !adminUser) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // User is authenticated and is an admin, allow access
    return res;
  }

  // For non-admin routes, just continue
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
