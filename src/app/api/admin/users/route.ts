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

    // Fetch all user profiles
    const { data: profiles, error: profilesErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesErr) {
      return NextResponse.json({ error: profilesErr.message }, { status: 500 });
    }

    // Fetch purchase counts per user
    const { data: purchases } = await supabaseAdmin
      .from('purchases')
      .select('id, user_id');

    // Fetch last login per user from login_history
    const { data: loginHistory } = await supabaseAdmin
      .from('login_history')
      .select('user_id, created_at')
      .order('created_at', { ascending: false });

    // Build purchase count map
    const purchaseCountMap = new Map<string, number>();
    (purchases ?? []).forEach((p: any) => {
      purchaseCountMap.set(p.user_id, (purchaseCountMap.get(p.user_id) ?? 0) + 1);
    });

    // Build last login map (first record per user since ordered desc)
    const lastLoginMap = new Map<string, string>();
    (loginHistory ?? []).forEach((l: any) => {
      if (!lastLoginMap.has(l.user_id)) {
        lastLoginMap.set(l.user_id, l.created_at);
      }
    });

    // Merge
    const users = (profiles ?? []).map((p: any) => ({
      ...p,
      total_purchases: purchaseCountMap.get(p.id) ?? 0,
      last_login: lastLoginMap.get(p.id) ?? null,
    }));

    return NextResponse.json({ users });
  } catch (e: any) {
    console.error('Admin users error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
