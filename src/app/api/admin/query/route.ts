import { getSupabaseServer } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function verifyAdmin() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('email', user.email)
    .single();

  return admin?.role || null;
}

export async function GET(request: Request) {
  try {
    const role = await verifyAdmin();
    if (!role) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || '';

    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
      : getSupabaseServer();

    let data;

    switch (type) {
      case 'dashboard': {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const [totalVisits, recentVisits, totalDownloads, recentDownloads, visitsTimeline] = await Promise.all([
          supabase.from('analytics_visits').select('*', { count: 'exact', head: true }),
          supabase.from('analytics_visits').select('*', { count: 'exact', head: true }).gte('visited_at', thirtyDaysAgo),
          supabase.from('analytics_downloads').select('*', { count: 'exact', head: true }),
          supabase.from('analytics_downloads').select('app_id, apps(name)'),
          supabase.from('analytics_visits').select('visited_at').order('visited_at', { ascending: true }),
        ]);
        data = {
          totalVisits: totalVisits.count,
          recentVisits: recentVisits.count,
          totalDownloads: totalDownloads.count,
          recentDownloads: recentDownloads.data,
          visitsTimeline: visitsTimeline.data,
        };
        break;
      }

      case 'app_names': {
        const res = await supabase.from('apps').select('id, name').order('name', { ascending: true });
        data = res.data;
        break;
      }

      case 'categories': {
        const res = await supabase.from('categories').select('*').order('name', { ascending: true });
        data = res.data;
        break;
      }

      case 'apps': {
        const res = await supabase.from('apps').select('*, categories(name)')
          .eq('app_type', 'app').order('created_at', { ascending: false });
        data = res.data;
        break;
      }

      case 'source_codes': {
        const res = await supabase.from('apps').select('*, categories(name)')
          .eq('app_type', 'source_code').order('created_at', { ascending: false });
        data = res.data;
        break;
      }

      case 'posts': {
        const res = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        data = res.data;
        break;
      }

      case 'keys': {
        const res = await supabase.from('keys')
          .select('*, app_keys(app_id, apps(name))')
          .order('created_at', { ascending: false });
        data = res.data;
        break;
      }

      case 'settings': {
        const res = await supabase.from('site_settings').select('*').eq('id', 1).single();
        data = res.data;
        break;
      }

      default:
        return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    return Response.json({ data });
  } catch (err) {
    console.error('Admin query error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
