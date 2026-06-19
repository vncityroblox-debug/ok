import { getSupabaseServer } from '@/lib/supabase';

async function fetchApps(supabase: ReturnType<typeof getSupabaseServer>, appType: string, limit: number) {
  const selectCols = 'id, name, slug, description, main_image_url, is_locked, category_id, categories(name, slug), app_type';

  let query = supabase.from('apps').select(selectCols).eq('is_hidden', false);
  if (appType) query = query.eq('app_type', appType);
  const res = await query.order('created_at', { ascending: false }).limit(limit);

  if (res.error && (res.error.message?.includes('is_hidden') || res.error.code === '42703')) {
    let fallback = supabase.from('apps').select(selectCols);
    if (appType) fallback = fallback.eq('app_type', appType);
    const fallbackRes = await fallback.order('created_at', { ascending: false }).limit(limit);
    return fallbackRes.data || [];
  }
  return res.data || [];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || '';
    const slug = url.searchParams.get('slug') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const appType = url.searchParams.get('app_type') || '';

    const supabase = getSupabaseServer();

    let data;

    switch (type) {
      case 'home': {
        const [catRes, settRes] = await Promise.all([
          supabase.from('categories').select('*').order('name', { ascending: true }),
          supabase.from('site_settings').select('home_hero_title, home_hero_subtitle').eq('id', 1).single(),
        ]);
        const apps = await fetchApps(supabase, appType || 'app', limit);
        data = { categories: catRes.data, settings: settRes.data, apps };
        break;
      }
      case 'categories': {
        const res = await supabase.from('categories').select('*').order('name', { ascending: true });
        data = res.data;
        break;
      }
      case 'posts': {
        let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (limit > 0) query = query.limit(limit);
        const res = await query;
        data = res.data;
        break;
      }
      case 'post': {
        const res = await supabase.from('posts').select('*').eq('slug', slug).single();
        data = res.data;
        break;
      }
      case 'apps': {
        const apps = await fetchApps(supabase, appType, limit);
        data = apps;
        break;
      }
      case 'app': {
        const [appRes, settRes] = await Promise.all([
          supabase.from('apps').select('*, categories(name)').eq('slug', slug).single(),
          supabase.from('site_settings').select('terms_content').single(),
        ]);
        data = { app: appRes.data, settings: settRes.data };
        break;
      }
      case 'announcement': {
        const res = await supabase.from('site_settings').select('announcement_html').eq('id', 1).single();
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
    console.error('Public API error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
