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

export async function POST(req: NextRequest) {
  try {
    const caller = await getCallerInfo(req);
    if (!caller || caller.role !== 1) {
      return NextResponse.json({ error: 'Forbidden: Chỉ Full Admin mới cập nhật được.' }, { status: 403 });
    }

    const { user_id, username, full_name, phone, role_type, permissions } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: 'Thiếu user_id.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseServer(true);
    const changes: Record<string, unknown> = {};

    const profileFields: Record<string, unknown> = {};
    if (username !== undefined) profileFields.username = username;
    if (full_name !== undefined) profileFields.full_name = full_name;
    if (phone !== undefined) profileFields.phone = phone;

    if (Object.keys(profileFields).length > 0) {
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update(profileFields)
        .eq('id', user_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      Object.assign(changes, profileFields);
    }

    const adminFields: Record<string, unknown> = {};
    if (role_type !== undefined) adminFields.role_type = role_type;
    if (permissions !== undefined) adminFields.permissions = permissions;

    if (Object.keys(adminFields).length > 0) {
      const { error } = await supabaseAdmin
        .from('admin_users')
        .update(adminFields)
        .eq('id', user_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      Object.assign(changes, adminFields);
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu cập nhật.' }, { status: 400 });
    }

    await supabaseAdmin.from('activity_logs').insert({
      user_id,
      user_email: caller.email,
      action: 'update_user',
      details: { admin_email: caller.email, changes },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update user error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
