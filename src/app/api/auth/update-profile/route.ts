import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name, phone, email } = await request.json();

    const supabaseAdmin = getSupabaseServer(true);

    // 1. If email changes, update auth email first
    if (email && email !== user.email) {
      const { error: emailErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email });
      if (emailErr) {
        console.error('Update email error', emailErr);
        const errMsg = emailErr.message && emailErr.message !== '{}'
          ? emailErr.message
          : 'Lỗi cập nhật email (email đã được sử dụng bởi tài khoản khác hoặc không hợp lệ).';
        return NextResponse.json({ error: errMsg }, { status: 400 });
      }
    }

    // 2. Fetch existing username or generate default
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    const username = existingProfile?.username || user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;

    // 3. Upsert into user_profiles
    const { error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        username,
        full_name,
        phone,
        email: email || user.email,
        updated_at: new Date().toISOString()
      });

    if (profileErr) {
      console.error('Update profile error', profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      user_email: email || user.email,
      action: 'update_profile',
      details: { full_name, phone, email },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update profile error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
