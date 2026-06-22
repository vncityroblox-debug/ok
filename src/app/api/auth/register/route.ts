import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Thiếu dữ liệu (username, email, password).' }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({ error: 'Username phải từ 3-30 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới.' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseServer(true);

    // Check username uniqueness
    const { data: existingProfile, error: lookupErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (lookupErr) {
      console.error('Username lookup error', lookupErr);
      return NextResponse.json({ error: 'Lỗi kiểm tra username.' }, { status: 500 });
    }

    if (existingProfile) {
      return NextResponse.json({ error: 'Username đã tồn tại.' }, { status: 409 });
    }

    // Create Supabase Auth user
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 400 });
    }

    // Insert into user_profiles with verification code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let verifyCode = '';
    for (let i = 0; i < 6; i++) verifyCode += chars.charAt(Math.floor(Math.random() * chars.length));

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        username,
        email,
        verification_code: verifyCode,
      })
      .select()
      .single();

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // Log activity
    const { error: logErr } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: authUser.user.id,
        action: 'register',
        details: { username, email },
      });

    if (logErr) {
      console.error('Activity log error', logErr);
    }

    return NextResponse.json({ data: { user: authUser.user, profile } }, { status: 201 });
  } catch (e: any) {
    console.error('Register error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
