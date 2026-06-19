import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return NextResponse.next();
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      },
    },
  });

  let user = null;
  try {
    const { data: { user: u } } = await supabase.auth.getUser();
    user = u;
  } catch (e) {
    console.error('Middleware getUser error:', e);
  }

  const path = request.nextUrl.pathname;

  // Admin page routes: redirect to login if not authenticated
  if (path.startsWith('/admin') && !path.startsWith('/api') && path !== '/admin/login' && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Login page: redirect to dashboard if already authenticated
  if (path === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
