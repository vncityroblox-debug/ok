import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { z } from 'zod';

const downloadSchema = z.object({
  appId: z.string().uuid('Invalid app ID format'),
  key: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = downloadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Yêu cầu không hợp lệ', details: result.error.format() },
        { status: 400 }
      );
    }

    const { appId, key } = result.data;
    
    // We use the Service Role client because public RLS policy does not allow SELECT on `keys` and `app_keys`
    const supabase = getSupabaseServer(true);

    // 0. Verify user is verified (if authenticated)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const anonSupabase = getSupabaseServer(false);
        const { data: { user } } = await anonSupabase.auth.getUser(token);
        if (user) {
          const { data: profile } = await getSupabaseServer(true)
            .from('user_profiles')
            .select('is_verified')
            .eq('id', user.id)
            .single();
          if (profile && !profile.is_verified) {
            return NextResponse.json(
              { error: 'Vui lòng xác thực tài khoản qua Zalo để sử dụng tính năng này. Truy cập trang Profile để lấy mã xác thực.' },
              { status: 403 }
            );
          }
        }
      } catch {}
    }

    // 1. Fetch app and verify lock status
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id, download_link, is_locked')
      .eq('id', appId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Không tìm thấy ứng dụng' }, { status: 404 });
    }

    // 2. If app is locked, validate the key
    if (app.is_locked) {
      if (!key || key.trim() === '') {
        return NextResponse.json(
          { error: 'Ứng dụng này bị khóa. Vui lòng nhập key để tải về!' },
          { status: 403 }
        );
      }

      // Fetch key info
      const { data: keyData, error: keyError } = await supabase
        .from('keys')
        .select('*')
        .eq('key_value', key.trim())
        .single();

      if (keyError || !keyData) {
        return NextResponse.json({ error: 'Key tải xuống không chính xác.' }, { status: 403 });
      }

      // Verify expiration date
      const now = new Date();
      const expirationDate = new Date(keyData.expiration_date);
      if (now > expirationDate) {
        return NextResponse.json({ error: 'Key này đã hết hạn sử dụng.' }, { status: 403 });
      }

      // Verify usage limits
      if (keyData.usage_count >= keyData.usage_limit) {
        return NextResponse.json(
          { error: 'Key này đã vượt quá giới hạn lượt sử dụng cho phép.' },
          { status: 403 }
        );
      }

      // Verify if key is associated with this app
      const { data: appKeyData, error: appKeyError } = await supabase
        .from('app_keys')
        .select('*')
        .eq('key_id', keyData.id)
        .eq('app_id', appId)
        .maybeSingle();

      if (appKeyError || !appKeyData) {
        return NextResponse.json(
          { error: 'Key này không được cấp quyền cho ứng dụng này.' },
          { status: 403 }
        );
      }

      // Key is valid! Update the key usage count
      const { error: updateKeyError } = await supabase
        .from('keys')
        .update({ usage_count: keyData.usage_count + 1 })
        .eq('id', keyData.id);

      if (updateKeyError) {
        console.error('Failed to increment key usage:', updateKeyError);
        return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu Key' }, { status: 500 });
      }
    }

    // 3. Log the download click in analytics
    const { error: clickLogError } = await supabase
      .from('analytics_downloads')
      .insert({ app_id: appId });

    if (clickLogError) {
      console.error('Failed to log click analytics:', clickLogError);
    }

    // 4. Log purchase record (get user from auth header)
    const purchaseAuthHeader = request.headers.get('authorization');
    if (purchaseAuthHeader?.startsWith('Bearer ')) {
      try {
        const token = purchaseAuthHeader.split(' ')[1];
        const anonSupabase = getSupabaseServer(false);
        const { data: { user } } = await anonSupabase.auth.getUser(token);
        if (user) {
          const { data: appInfo } = await supabase
            .from('apps')
            .select('name')
            .eq('id', appId)
            .single();
          await supabase.from('purchases').insert({
            user_id: user.id,
            user_email: user.email,
            item_type: 'app',
            item_id: appId,
            item_name: appInfo?.name ?? '',
            key_code: key?.trim() || null,
            status: key ? 'key_verified' : 'downloaded',
            created_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('Failed to log purchase:', e);
      }
    }

    // 5. Return the download link
    return Response.json({ downloadLink: app.download_link });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
