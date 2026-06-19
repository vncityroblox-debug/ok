import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getCallerInfo(req: NextRequest): Promise<{ role: number; email: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const supabaseAnon = getSupabaseServer(false);
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) return null;
  const supabaseAdmin = getSupabaseServer(true);
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('role_type')
    .eq('email', user.email)
    .single();
  if (!admin) return null;
  return { role: admin.role_type, email: user.email! };
}

export async function GET(req: NextRequest) {
  try {
    const caller = await getCallerInfo(req);
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseServer(true);

    const results = await Promise.allSettled([
      // 0: total visits count
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true }),
      // 1: recent 30-day visits count (use created_at which is the auto-generated timestamp)
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      // 2: total downloads count
      supabaseAdmin.from('analytics_downloads').select('*', { count: 'exact', head: true }),
      // 3: recent downloads with app name
      supabaseAdmin.from('analytics_downloads').select('app_id, apps(name)'),
      // 4: visits timeline (all created_at for chart)
      supabaseAdmin.from('analytics_visits').select('created_at').order('created_at', { ascending: true }),
      // 5: total users count
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
    ]);

    const getCount = (r: PromiseSettledResult<any>): number => {
      if (r.status === 'rejected') return 0;
      const res = r.value;
      if (res.error) {
        console.error('Stats query error:', res.error.message);
        return 0;
      }
      return res.count ?? 0;
    };

    const getData = (r: PromiseSettledResult<any>): any[] => {
      if (r.status === 'rejected') return [];
      const res = r.value;
      if (res.error) {
        console.error('Stats query error:', res.error.message);
        return [];
      }
      return res.data ?? [];
    };

    return NextResponse.json({
      totalVisits: getCount(results[0]),
      recentVisits: getCount(results[1]),
      totalDownloads: getCount(results[2]),
      recentDownloads: getData(results[3]),
      visitsTimeline: getData(results[4]),
      totalUsers: getCount(results[5]),
    });
  } catch (e: any) {
    console.error('Admin stats error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
