import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkAdminAuth, unauthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!await checkAdminAuth(req)) return unauthorized();
  try {
    const supabaseAdmin = getSupabaseServer(true);

    const results = await Promise.allSettled([
      supabaseAdmin.from('user_profiles').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('purchases').select('id, user_id'),
      supabaseAdmin.from('login_history').select('user_id, created_at').order('created_at', { ascending: false }),
    ]);

    const getData = (r: PromiseSettledResult<any>): any[] => {
      if (r.status === 'rejected') return [];
      const res = r.value;
      if (res.error) { console.error('Users query error:', res.error.message); return []; }
      return res.data ?? [];
    };

    const profiles = getData(results[0]);
    const purchases = getData(results[1]);
    const loginHistory = getData(results[2]);

    const purchaseCountMap = new Map<string, number>();
    purchases.forEach((p: any) => {
      purchaseCountMap.set(p.user_id, (purchaseCountMap.get(p.user_id) ?? 0) + 1);
    });

    const lastLoginMap = new Map<string, string>();
    loginHistory.forEach((l: any) => {
      if (!lastLoginMap.has(l.user_id)) {
        lastLoginMap.set(l.user_id, l.created_at);
      }
    });

    const users = profiles.map((p: any) => ({
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
