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

    const [
      totalVisitsRes,
      recentVisitsRes,
      totalDownloadsRes,
      recentDownloadsRes,
      visitsTimelineRes,
      totalUsersRes,
    ] = await Promise.all([
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('analytics_visits').select('*', { count: 'exact', head: true })
        .gte('visited_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin.from('analytics_downloads').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('analytics_downloads').select('app_id, apps(name)'),
      supabaseAdmin.from('analytics_visits').select('visited_at').order('visited_at', { ascending: true }),
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      totalVisits: totalVisitsRes.count ?? 0,
      recentVisits: recentVisitsRes.count ?? 0,
      totalDownloads: totalDownloadsRes.count ?? 0,
      recentDownloads: recentDownloadsRes.data ?? [],
      visitsTimeline: visitsTimelineRes.data ?? [],
      totalUsers: totalUsersRes.count ?? 0,
    });
  } catch (e: any) {
    console.error('Admin stats error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
