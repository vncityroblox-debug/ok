import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseServer(true);
    const { data, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return Response.json({ data: [], error: 'Bảng cron_jobs chưa tồn tại. Vui lòng chạy migration.' });
      }
      throw error;
    }
    return Response.json({ data });
  } catch (err: any) {
    return Response.json({ data: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, method, interval_minutes } = body;

    if (!url || !url.trim()) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!interval_minutes || interval_minutes < 1 || interval_minutes < 5) {
      return Response.json({ error: 'Interval must be at least 5 minutes' }, { status: 400 });
    }

    const supabase = getSupabaseServer(true);
    const next_run = new Date(Date.now() + interval_minutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('cron_jobs')
      .insert({
        name: name?.trim() || new URL(url.trim()).hostname,
        url: url.trim(),
        method: method || 'GET',
        interval_minutes: parseInt(interval_minutes),
        is_active: true,
        next_run,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return Response.json({ error: 'Bảng cron_jobs chưa tồn tại. Vui lòng chạy migration trong Supabase SQL Editor.' }, { status: 400 });
      }
      throw error;
    }
    return Response.json({ data });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const supabase = getSupabaseServer(true);
    const { data, error } = await supabase
      .from('cron_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return Response.json({ error: 'Bảng cron_jobs chưa tồn tại.' }, { status: 400 });
      }
      throw error;
    }
    return Response.json({ data });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const supabase = getSupabaseServer(true);
    const { error } = await supabase.from('cron_jobs').delete().eq('id', id);
    if (error) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return Response.json({ error: 'Bảng cron_jobs chưa tồn tại.' }, { status: 400 });
      }
      throw error;
    }
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
