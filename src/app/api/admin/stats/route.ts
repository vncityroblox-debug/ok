import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseServer(true);

    const todayISO = new Date();
    todayISO.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const results = await Promise.allSettled([
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true }).gte('created_at', todayISO.toISOString()),
      supabaseAdmin.from('analytics_downloads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('analytics_downloads').select('app_id, apps(name)'),
      supabaseAdmin.from('analytics_visits').select('created_at').order('created_at', { ascending: true }),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
    ]);

    const getCount = (r: PromiseSettledResult<any>): number => {
      if (r.status === 'rejected') return 0;
      const res = r.value;
      if (res.error) { console.error('Stats query error:', res.error.message); return 0; }
      return res.count ?? 0;
    };

    const getData = (r: PromiseSettledResult<any>): any[] => {
      if (r.status === 'rejected') return [];
      const res = r.value;
      if (res.error) { console.error('Stats query error:', res.error.message); return []; }
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
