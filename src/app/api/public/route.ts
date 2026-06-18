import { getSupabaseServer } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || '';
    const slug = url.searchParams.get('slug') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const appType = url.searchParams.get('app_type') || '';

    const supabase = getSupabaseServer();

    let data;

    switch (type) {
      case 'home': {
        const [catRes, settRes, appsRes] = await Promise.all([
          supabase.from('categories').select('*').order('name', { ascending: true }),
          supabase.from('site_settings').select('home_hero_title, home_hero_subtitle').eq('id', 1).single(),
          supabase.from('apps').select('id, name, slug, description, main_image_url, is_locked, category_id, categories(name, slug), app_type')
            .eq('app_type', appType || 'app').order('created_at', { ascending: false }).limit(limit),
        ]);
        data = { categories: catRes.data, settings: settRes.data, apps: appsRes.data };
        break;
      }
      case 'categories': {
        const res = await supabase.from('categories').select('*').order('name', { ascending: true });
        data = res.data;
        break;
      }
      case 'posts': {
        const res = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        data = res.data;
        break;
      }
      case 'post': {
        const res = await supabase.from('posts').select('*').eq('slug', slug).single();
        data = res.data;
        break;
      }
      case 'apps': {
        let query = supabase.from('apps')
          .select('id, name, slug, description, main_image_url, is_locked, category_id, categories(name, slug), app_type');
        if (appType) query = query.eq('app_type', appType);
        const res = await query.order('created_at', { ascending: false }).limit(limit);
        data = res.data;
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
