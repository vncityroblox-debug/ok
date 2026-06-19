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
    if (!caller || caller.role !== 1) {
      return NextResponse.json({ error: 'Forbidden: Chỉ Full Admin mới xem được.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    if (!user_id) {
      return NextResponse.json({ error: 'Thiếu user_id.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseServer(true);

    const { data: activities, error: actErr } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (actErr) {
      return NextResponse.json({ error: actErr.message }, { status: 500 });
    }

    const { data: logins, error: loginErr } = await supabaseAdmin
      .from('login_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (loginErr) {
      return NextResponse.json({ error: loginErr.message }, { status: 500 });
    }

    const { data: purchases, error: purchaseErr } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({
      activities: activities || [],
      logins: logins || [],
      purchases: purchases || [],
    });
  } catch (e: any) {
    console.error('User activity error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
