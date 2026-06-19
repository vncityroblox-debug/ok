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
      return NextResponse.json({ error: 'Forbidden: Chỉ Full Admin.' }, { status: 403 });
    }

    const { to } = await req.json();
    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Thiếu email người nhận.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseServer(true);
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, site_name')
      .eq('id', 1)
      .single();

    if (!settings?.smtp_host || !settings?.smtp_user) {
      return NextResponse.json({ error: 'SMTP chưa được cấu hình.' }, { status: 400 });
    }

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
      to: to.trim(),
      subject: `[${settings.site_name || 'Website'}] Thử nghiệm gửi email`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #333;">Thử nghiệm gửi email thành công!</h2>
          <p style="color: #555; line-height: 1.6;">
            Đây là email thử nghiệm từ hệ thống <b>${settings.site_name || 'Website'}</b>.
          </p>
          <p style="color: #555; line-height: 1.6;">
            Nếu bạn nhận được email này, cấu hình SMTP đang hoạt động chính xác.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 0.85rem;">
            Gửi bởi: ${settings.smtp_from || settings.smtp_user} • lúc ${new Date().toLocaleString('vi-VN')}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: `Email thử nghiệm đã gửi đến ${to.trim()}.` });
  } catch (e: any) {
    console.error('Test email error', e);
    return NextResponse.json({ error: `Lỗi gửi email: ${e.message || e}` }, { status: 500 });
  }
}
