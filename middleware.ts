import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - crucial for RLS
  // Use getUser() instead of getSession() for server-side validation
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  console.log('Middleware Debug:', {
    pathname: request.nextUrl.pathname,
    hasUser: !!user,
    userId: user?.id || null,
    authError: error?.message || null
  });

  // Skip middleware for API routes and static files
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname === '/favicon.ico') {
    return response;
  }

  // Skip middleware for auth callback to prevent redirect loops
  if (request.nextUrl.pathname === '/auth/callback') {
    return response;
  }

  // If user is signed in and trying to access login page, redirect to dashboard
  if (user && request.nextUrl.pathname === '/auth/login') {
    console.log('Redirecting authenticated user from login to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT signed in and trying to access protected routes, redirect to login
  if (!user && 
      !request.nextUrl.pathname.startsWith('/auth') && 
      request.nextUrl.pathname !== '/') {
    console.log('Redirecting unauthenticated user to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If user is NOT signed in and tries to access root, redirect to login
  if (!user && request.nextUrl.pathname === '/') {
    console.log('Redirecting from root to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (png, jpg, jpeg, gif, svg, ico, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
};