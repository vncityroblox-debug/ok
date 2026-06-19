import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseServer(true);

    const todayISO = new Date();
    todayISO.setHours(0, 0, 0, 0);

    const queries = [
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true }).gte('visited_at', todayISO.toISOString()),
      supabaseAdmin.from('analytics_downloads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('analytics_downloads').select('app_id, apps(name)'),
      supabaseAdmin.from('analytics_visits').select('visited_at').order('visited_at', { ascending: true }),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
    ];

    const results = await Promise.allSettled(queries);

    const labels = ['totalVisits', 'todayVisits', 'totalDownloads', 'recentDownloads', 'visitsTimeline', 'totalUsers'];

    const getCount = (r: PromiseSettledResult<any>, i: number): number => {
      if (r.status === 'rejected') { console.error(`Stats query #${i} (${labels[i]}) rejected:`, r.reason); return 0; }
      const res = r.value;
      if (res.error) { console.error(`Stats query #${i} (${labels[i]}) error:`, res.error.message, res.error.details, res.error.hint); return 0; }
      return res.count ?? 0;
    };

    const getData = (r: PromiseSettledResult<any>, i: number): any[] => {
      if (r.status === 'rejected') { console.error(`Stats query #${i} (${labels[i]}) rejected:`, r.reason); return []; }
      const res = r.value;
      if (res.error) { console.error(`Stats query #${i} (${labels[i]}) error:`, res.error.message, res.error.details, res.error.hint); return []; }
      return res.data ?? [];
    };

    return NextResponse.json({
      totalVisits: getCount(results[0], 0),
      recentVisits: getCount(results[1], 1),
      totalDownloads: getCount(results[2], 2),
      recentDownloads: getData(results[3], 3),
      visitsTimeline: getData(results[4], 4),
      totalUsers: getCount(results[5], 5),
    });
  } catch (e: any) {
    console.error('Admin stats error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
