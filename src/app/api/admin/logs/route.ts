import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    const supabaseAdmin = getSupabaseServer(true);

    const results = await Promise.allSettled([
      supabaseAdmin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(userId ? 50 : 500),
      supabaseAdmin.from('login_history').select('*').order('created_at', { ascending: false }).limit(userId ? 50 : 500),
    ]);

    const getData = (r: PromiseSettledResult<any>): any[] => {
      if (r.status === 'rejected') return [];
      const res = r.value;
      if (res.error) { console.error('Logs query error:', res.error.message); return []; }
      return res.data ?? [];
    };

    let activities = getData(results[0]);
    let logins = getData(results[1]);

    if (userId) {
      activities = activities.filter((a: any) => a.user_id === userId);
      logins = logins.filter((l: any) => l.user_id === userId);
    }

    return NextResponse.json({
      activityLogs: activities,
      loginHistory: logins,
    });
  } catch (e: any) {
    console.error('Admin logs error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
