import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const key = supabaseServiceKey || supabaseAnonKey;
    const supabase = createClient(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: admin } = await supabase.from('admin_users').select('role').eq('email', email).single();
    if (!admin?.role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { resource, action, data: payload, id } = body;
    if (!resource || !action) return NextResponse.json({ error: 'Missing resource or action' }, { status: 400 });

    switch (`${resource}:${action}`) {
      case 'app:insert':
      case 'source_code:insert': {
        const { error } = await supabase.from('apps').insert(payload);
        if (error) throw error;
        break;
      }
      case 'app:update':
      case 'source_code:update': {
        const { error } = await supabase.from('apps').update(payload).eq('id', id);
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
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        break;
      }
      case 'category:update': {
        const { error } = await supabase.from('categories').update(payload).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'category:delete': {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        break;
      }
      case 'post:insert': {
        const { error } = await supabase.from('posts').insert(payload);
        if (error) throw error;
        break;
      }
      case 'post:update': {
        const { error } = await supabase.from('posts').update(payload).eq('id', id);
        if (error) throw error;
        break;
      }
      case 'post:delete': {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) throw error;
        break;
      }
      case 'key:insert': {
        const { data: keyData, error: keyErr } = await supabase.from('keys').insert(payload.key).select('id').single();
        if (keyErr) { if (keyErr.code === '23505') throw new Error('Key đã tồn tại!'); throw keyErr; }
        if (payload.appKeys?.length) {
          const { error: jErr } = await supabase.from('app_keys').insert(payload.appKeys.map((ak: any) => ({ key_id: keyData.id, app_id: ak })));
          if (jErr) throw jErr;
        }
        break;
      }
      case 'key:update': {
        await supabase.from('keys').update(payload.key).eq('id', id);
        await supabase.from('app_keys').delete().eq('key_id', id);
        if (payload.appKeys?.length) {
          const { error: jErr } = await supabase.from('app_keys').insert(payload.appKeys.map((ak: any) => ({ key_id: id, app_id: ak })));
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
        const { error } = await supabase.from('site_settings').upsert({ id: 1, ...payload, updated_at: new Date().toISOString() });
        if (error) throw error;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid resource/action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin mutate error:', err);
    return NextResponse.json({ error: err.message || 'Mutation error' }, { status: 500 });
  }
}
