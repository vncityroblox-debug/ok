import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

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

export async function DELETE(req: NextRequest) {
  try {
    const caller = await getCallerInfo(req);
    if (!caller || caller.role !== 1) {
      return NextResponse.json({ error: 'Forbidden: Chỉ Full Admin mới xóa được.' }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Thiếu id admin cần xóa.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseServer(true);

    // Prevent self-deletion – find email of target
    const { data: target } = await supabaseAdmin
      .from('admin_users')
      .select('email')
      .eq('id', id)
      .single();

    if (target?.email === caller.email) {
      return NextResponse.json({ error: 'Không thể tự xóa tài khoản của mình.' }, { status: 400 });
    }

    // Delete from Supabase Auth
    const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authDelErr) {
      return NextResponse.json({ error: authDelErr.message }, { status: 400 });
    }

    // Delete from admin_users table
    const { error: dbErr } = await supabaseAdmin.from('admin_users').delete().eq('id', id);
    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Delete admin error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
