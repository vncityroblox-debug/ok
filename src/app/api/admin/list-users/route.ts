import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

async function getCallerRole(req: NextRequest): Promise<number | null> {
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

  return admin?.role_type ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const role = await getCallerRole(req);
    if (role !== 1) {
      return NextResponse.json({ error: 'Forbidden: Chỉ Full Admin mới xem được.' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseServer(true);
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role_type, permissions, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (e: any) {
    console.error('List admin users error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
