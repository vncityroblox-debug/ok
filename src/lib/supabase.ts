import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Browser-safe client with automatic cookie sync for Next.js SSR / Middleware
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Server-side Supabase client factory (safe for middleware and server components)
export const getSupabaseServer = (useServiceRole = false) => {
  const key = useServiceRole ? supabaseServiceKey : supabaseAnonKey;
  if (!supabaseUrl || !key) {
    // We fall back to empty client if variables aren't seeded yet to prevent build crashes
    return createClient(supabaseUrl || 'https://placeholder.supabase.co', key || 'placeholder');
  }
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
