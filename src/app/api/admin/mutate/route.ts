import { getSupabaseServer } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function verifyAdmin() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: admin } = await supabase.from('admin_users').select('role').eq('email', user.email).single();
  return !!admin?.role;
}

const db = () => supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : getSupabaseServer();

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { resource, action, data, id, filters } = body;

    if (!resource || !action) return Response.json({ error: 'Missing resource or action' }, { status: 400 });

    const supabase = db();
    let query;

    switch (`${resource}:${action}`) {
      case 'app:insert':
      case 'source_code:insert': {
        const { error } = await supabase.from('apps').insert(data);
        if (error) throw error;
        break;
      }
      case 'app:update':
      case 'source_code:update': {
        const { error } = await supabase.from('apps').update(data).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'app:delete':
      case 'source_code:delete': {
        const { error } = await supabase.from('apps').delete().eq('id', id);
        if (error) throw error;
        break;
      }
      case 'category:insert': {
        const { error } = await supabase.from('categories').insert(data);
        if (error) throw error;
        break;
      }
      case 'category:update': {
        const { error } = await supabase.from('categories').update(data).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'category:delete': {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        break;
      }
      case 'post:insert': {
        const { error } = await supabase.from('posts').insert(data);
        if (error) throw error;
        break;
      }
      case 'post:update': {
        const { error } = await supabase.from('posts').update(data).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'post:delete': {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) throw error;
        break;
      }
      case 'key:insert': {
        const { data: keyData, error: keyErr } = await supabase.from('keys').insert(data.key).select('id').single();
        if (keyErr) throw keyErr;
        if (data.appKeys?.length) {
          const { error: jErr } = await supabase.from('app_keys').insert(data.appKeys.map((ak: any) => ({ key_id: keyData.id, app_id: ak })));
          if (jErr) throw jErr;
        }
        break;
      }
      case 'key:update': {
        const { error: keyErr } = await supabase.from('keys').update(data.key).eq('id', id);
        if (keyErr) throw keyErr;
        await supabase.from('app_keys').delete().eq('key_id', id);
        if (data.appKeys?.length) {
          const { error: jErr } = await supabase.from('app_keys').insert(data.appKeys.map((ak: any) => ({ key_id: id, app_id: ak })));
          if (jErr) throw jErr;
        }
        break;
      }
      case 'key:delete': {
        await supabase.from('app_keys').delete().eq('key_id', id);
        const { error } = await supabase.from('keys').delete().eq('id', id);
        if (error) throw error;
        break;
      }
      case 'settings:upsert': {
        const { error } = await supabase.from('site_settings').upsert({ id: 1, ...data, updated_at: new Date().toISOString() });
        if (error) throw error;
        break;
      }
      default:
        return Response.json({ error: 'Invalid resource/action' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Mutation error' }, { status: 500 });
  }
}
