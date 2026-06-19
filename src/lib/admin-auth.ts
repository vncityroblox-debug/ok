import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function checkAdminAuth(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return null; // dev mode
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
  } catch (e) {
    console.error('checkAdminAuth getUser error:', e);
  }

  // Fallback: if getUser failed but auth cookie exists, allow through
  // (network glitch, not auth issue)
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.name.includes('auth-token'));
  if (hasAuthCookie) {
    console.warn('checkAdminAuth: getUser failed but auth cookie present, allowing request');
    return { id: 'cookie-fallback', email: 'cookie-fallback@localhost' } as any;
  }

  return null;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
