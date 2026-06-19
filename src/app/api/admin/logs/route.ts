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

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    const supabaseAdmin = getSupabaseServer(true);

    let loginQuery = supabaseAdmin
      .from('login_history')
      .select('*')
      .order('created_at', { ascending: false });
    let activityQuery = supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      loginQuery = loginQuery.eq('user_id', userId).limit(50);
      activityQuery = activityQuery.eq('user_id', userId).limit(50);
    } else {
      loginQuery = loginQuery.limit(200);
      activityQuery = activityQuery.limit(200);
    }

    const [loginHistory, activityLogs] = await Promise.all([
      loginQuery,
      activityQuery,
    ]);

    return NextResponse.json({
      loginHistory: loginHistory.data || [],
      activityLogs: activityLogs.data || [],
    });
  } catch (e: any) {
    console.error('Admin logs error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
