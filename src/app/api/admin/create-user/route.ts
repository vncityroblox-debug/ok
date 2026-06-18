import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

async function getCallerRole(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();

  // Verify the token via anon client
  const supabaseAnon = getSupabaseServer(false);
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) return null;

  // Look up role in admin_users (service role to bypass RLS)
  const supabaseAdmin = getSupabaseServer(true);
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('role_type')
    .eq('email', user.email)
    .single();

  return admin?.role_type ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const role = await getCallerRole(req);
    if (role !== 1) {
      return NextResponse.json({ error: 'Không có quyền tạo admin.' }, { status: 403 });
    }

    const { email, password, role_type, permissions } = await req.json();
    if (!email || !password || !role_type) {
      return NextResponse.json({ error: 'Thiếu dữ liệu (email, password, role_type).' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseServer(true);

    // Hash password for our own record
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Supabase Auth user (service role)
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // Insert into admin_users table
    const { data: adminRec, error: insertErr } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        email,
        password_hash: passwordHash,
        role_type,
        permissions: role_type === 2 ? (permissions ?? []) : [],
      })
      .select()
      .single();

    if (insertErr) {
      // Rollback auth user if db insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, admin: adminRec });
  } catch (e: any) {
    console.error('Create admin error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
