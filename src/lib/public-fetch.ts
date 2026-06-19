import { supabase } from '@/lib/supabase';

export async function fetchPublicApps(appType: string, limit = 100) {
  const selectCols = 'id, name, slug, description, main_image_url, is_locked, category_id, categories(name, slug), app_type';

  let query = supabase.from('apps').select(selectCols).eq('is_hidden', false);
  if (appType) query = query.eq('app_type', appType);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

  if (error && (error.message?.includes('is_hidden') || error.code === '42703')) {
    let fallback = supabase.from('apps').select(selectCols);
    if (appType) fallback = fallback.eq('app_type', appType);
    const { data: fb } = await fallback.order('created_at', { ascending: false }).limit(limit);
    return (fb || []).map((a: any) => ({ ...a, categories: Array.isArray(a.categories) ? a.categories[0] ?? null : a.categories }));
  }
  return (data || []).map((a: any) => ({ ...a, categories: Array.isArray(a.categories) ? a.categories[0] ?? null : a.categories }));
}

export async function fetchPublicAppBySlug(slug: string) {
  const [appRes, settRes] = await Promise.all([
    supabase.from('apps').select('*, categories(name)').eq('slug', slug).single(),
    supabase.from('site_settings').select('terms_content').single(),
  ]);
  return { app: appRes.data, settings: settRes.data };
}

export async function fetchPublicPosts(limit = 0) {
  let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (limit > 0) query = query.limit(limit);
  const { data } = await query;
  return data || [];
}

export async function fetchPublicPostBySlug(slug: string) {
  const { data } = await supabase.from('posts').select('*').eq('slug', slug).single();
  return data;
}

export async function fetchPublicSettings() {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
  return data;
}

export async function fetchAnnouncement() {
  const { data } = await supabase.from('site_settings').select('announcement_html').eq('id', 1).single();
  return data;
}
