import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Zalo webhook is running' });
}

async function sendZaloMessage(zaloId: string, text: string) {
  const supabase = getSupabaseServer(true);
  const { data: config } = await supabase
    .from('chatbot_configs')
    .select('zalo_token')
    .eq('id', 1)
    .single();

  const token = config?.zalo_token || process.env.ZALO_BOT_TOKEN || '';
  if (!token) return;

  try {
    await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': token,
      },
      body: JSON.stringify({
        recipient: { user_id: zaloId },
        message: { text },
      }),
    });
  } catch (e) {
    console.error('Failed to send Zalo message:', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const eventName = body.event_name;
    const data = body.data;

    if (!eventName || !data) {
      return NextResponse.json({ ok: true });
    }

    if (eventName === 'oa_message') {
      const fromUser = data.from;
      const message = data.message;

      if (!fromUser?.id || !message?.text) {
        return NextResponse.json({ ok: true });
      }

      const text = message.text.trim();
      const zaloId = fromUser.id;
      const displayName = fromUser.display_name || '';
      const avatar = fromUser.avatar || '';

      const supabase = getSupabaseServer(true);

      if (text.toLowerCase().startsWith('/xt ')) {
        const code = text.slice(4).trim();

        if (!code) {
          await sendZaloMessage(zaloId, 'Vui lòng nhập mã xác thực. Ví dụ: /xt ABC123');
          return NextResponse.json({ ok: true });
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, username, is_verified')
          .eq('verification_code', code)
          .single();

        if (!profile) {
          await sendZaloMessage(zaloId, 'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại mã trên trang Profile.');
          return NextResponse.json({ ok: true });
        }

        if (profile.is_verified) {
          await sendZaloMessage(zaloId, `Tài khoản ${profile.username} đã được xác thực trước đó rồi!`);
          return NextResponse.json({ ok: true });
        }

        const { error: upsertError } = await supabase
          .from('zalo_verifications')
          .upsert({
            user_id: profile.id,
            zalo_id: zaloId,
            display_name: displayName,
            avatar_url: avatar,
            verification_code: code,
            verified_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Zalo verify upsert error:', upsertError);
          await sendZaloMessage(zaloId, 'Có lỗi xảy ra khi xác thực. Vui lòng thử lại sau.');
          return NextResponse.json({ ok: true });
        }

        await supabase
          .from('user_profiles')
          .update({ is_verified: true })
          .eq('id', profile.id);

        await sendZaloMessage(zaloId, `Xác thực thành công! ✅\nTài khoản ${profile.username} đã được kích hoạt. Bạn có thể sử dụng tất cả tính năng trên trang web.`);
        return NextResponse.json({ ok: true });
      }

      if (text.toLowerCase() === '/help' || text.toLowerCase() === '/xt') {
        const helpText = `📋 Danh sách lệnh:\n\n/xt [MÃ] - Xác thực tài khoản\n/help - Xem danh sách lệnh\n/info - Xem thông tin`;
        await sendZaloMessage(zaloId, helpText);
        return NextResponse.json({ ok: true });
      }

      if (text.toLowerCase() === '/info') {
        const { data: existingVerification } = await supabase
          .from('zalo_verifications')
          .select('verification_code, verified_at')
          .eq('zalo_id', zaloId)
          .single();

        if (existingVerification) {
          await sendZaloMessage(zaloId, `✅ Bạn đã xác thực tài khoản.\nMã: ${existingVerification.verification_code}\nNgày: ${new Date(existingVerification.verified_at).toLocaleDateString('vi-VN')}`);
        } else {
          await sendZaloMessage(zaloId, 'Bạn chưa xác thực tài khoản nào.\nTruy cập trang Profile để lấy mã xác thực, sau đó gửi: /xt [MÃ]');
        }
        return NextResponse.json({ ok: true });
      }

      const { data: config } = await supabase
        .from('chatbot_configs')
        .select('welcome_message, response_rules')
        .eq('id', 1)
        .single();

      const rules = (config?.response_rules || []) as { keyword: string; reply: string }[];
      const matchedRule = rules.find(r =>
        text.toLowerCase().includes(r.keyword.toLowerCase())
      );

      if (matchedRule) {
        await sendZaloMessage(zaloId, matchedRule.reply);
      } else {
        await sendZaloMessage(zaloId, config?.welcome_message || 'Xin chào! Gõ /help để xem danh sách lệnh.');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Zalo webhook error:', e);
    return NextResponse.json({ ok: true });
  }
}
