import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseServer(true);

    // Find user by email in user_profiles
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (profileErr) {
      console.error('Profile lookup error', profileErr);
      return NextResponse.json({ error: 'Lỗi khi tìm kiếm tài khoản.' }, { status: 500 });
    }

    // Always return success to prevent email enumeration
    if (!profile) {
      return NextResponse.json({
        data: { message: 'Nếu email tồn tại, bạn sẽ nhận được liên kết đặt lại mật khẩu.' },
      });
    }

    // Generate a random token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Delete any existing unused tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', profile.id)
      .eq('used', false);

    // Insert new token
    const { error: tokenErr } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        token,
        expires_at: expiresAt,
        used: false,
      });

    if (tokenErr) {
      console.error('Token insert error', tokenErr);
      return NextResponse.json({ error: 'Lỗi khi tạo token đặt lại mật khẩu.' }, { status: 500 });
    }

    // Get site origin
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetLink = `${origin}/quen-mat-khau?token=${token}`;

    // Try to send email via SMTP from site_settings
    try {
      const { data: settings } = await supabaseAdmin
        .from('site_settings')
        .select('smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, site_name')
        .eq('id', 1)
        .single();

      if (settings?.smtp_host && settings?.smtp_user) {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: settings.smtp_host,
          port: Number(settings.smtp_port) || 587,
          secure: Number(settings.smtp_port) === 465,
          auth: {
            user: settings.smtp_user,
            pass: settings.smtp_pass || '',
          },
        });

        await transporter.sendMail({
          from: settings.smtp_from || settings.smtp_user,
          to: email.trim(),
          subject: `[${settings.site_name || 'Website'}] Đặt lại mật khẩu`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #333;">Đặt lại mật khẩu</h2>
              <p style="color: #555; line-height: 1.6;">
                Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào liên kết bên dưới để đặt lại:
              </p>
              <a href="${resetLink}" style="
                display: inline-block;
                padding: 12px 24px;
                background: #4f46e5;
                color: #fff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 16px 0;
              ">Đặt lại mật khẩu</a>
              <p style="color: #999; font-size: 0.85rem;">
                Liên kết này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
              </p>
            </div>
          `,
        });

        console.log(`Reset email sent to ${email.trim()}`);
      } else {
        console.log('SMTP not configured. Reset token:', token);
        console.log('Reset link:', resetLink);
      }
    } catch (smtpErr) {
      console.error('SMTP send error (fallback to console):', smtpErr);
      console.log('Reset token:', token);
      console.log('Reset link:', resetLink);
    }

    return NextResponse.json({
      data: { message: 'Nếu email tồn tại, bạn sẽ nhận được liên kết đặt lại mật khẩu.' },
    });
  } catch (e: any) {
    console.error('Reset password request error', e);
    return NextResponse.json({ error: 'Lỗi server.' }, { status: 500 });
  }
}
