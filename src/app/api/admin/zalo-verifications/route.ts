import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkAdminAuth, unauthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await checkAdminAuth(req);
    if (!user) return unauthorized();

    const supabase = getSupabaseServer(true);

    const { data: profiles, error: profileErr } = await supabase
      .from('user_profiles')
      .select('id, username, email, full_name, is_verified, created_at')
      .order('created_at', { ascending: false });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    const { data: verifications } = await supabase
      .from('zalo_verifications')
      .select('user_id, zalo_id, display_name, avatar_url, verification_code, verified_at');

    const zaloMap = new Map<string, any>();
    (verifications || []).forEach((v: any) => {
      zaloMap.set(v.user_id, v);
    });

    const users = (profiles || []).map((p: any) => ({
      ...p,
      zalo: zaloMap.get(p.id) || null,
    }));

    return NextResponse.json({ users });
  } catch (e: any) {
    console.error('Zalo verifications error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
