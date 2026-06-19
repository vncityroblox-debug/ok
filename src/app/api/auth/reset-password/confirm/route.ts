import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token không hợp lệ.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseServer(true);

    // Find valid, unused token
    const { data: tokenRecord, error: tokenErr } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .maybeSingle();

    if (tokenErr) {
      console.error('Token lookup error', tokenErr);
      return NextResponse.json({ error: 'Lỗi khi kiểm tra token.' }, { status: 500 });
    }

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã được sử dụng.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token đã hết hạn. Vui lòng yêu cầu lại.' },
        { status: 400 }
      );
    }

    // Update password via Supabase Auth admin
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      tokenRecord.user_id,
      { password }
    );

    if (updateErr) {
      console.error('Password update error', updateErr);
      return NextResponse.json(
        { error: 'Không thể cập nhật mật khẩu. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    // Mark token as used
    const { error: markErr } = await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenRecord.id);

    if (markErr) {
      console.error('Token mark used error', markErr);
    }

    // Log activity
    const { error: logErr } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: tokenRecord.user_id,
        action: 'reset_password',
        details: { token_id: tokenRecord.id },
      });

    if (logErr) {
      console.error('Activity log error', logErr);
    }

    return NextResponse.json({
      data: { message: 'Đặt lại mật khẩu thành công.' },
    });
  } catch (e: any) {
    console.error('Reset password confirm error', e);
    return NextResponse.json({ error: 'Lỗi server.' }, { status: 500 });
  }
}
