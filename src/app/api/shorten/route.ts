import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL không hợp lệ.' }, { status: 400 });
    }

    // Get API token from site_settings
    const { data, error } = await supabase
      .from('site_settings')
      .select('link4m_api_token')
      .eq('id', 1)
      .single();

    if (error || !data?.link4m_api_token) {
      return NextResponse.json({ error: 'Chưa cấu hình API Token Link4M trong phần Cài đặt.' }, { status: 400 });
    }

    const apiToken = data.link4m_api_token;
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://link4m.co/st?api=${apiToken}&url=${encodedUrl}`;

    // Perform request without following redirects to capture Location header
    const response = await fetch(apiUrl, { method: 'GET', redirect: 'manual' });
    const location = response.headers.get('location');
    if (location) {
      // Directly return the shortened URL from the Location header
      return NextResponse.json({ shortenedUrl: location });
    }

    // Fallback: try to parse JSON if the service returns JSON
    const json = await response.json();
    if (json.status === 'success' && json.shortenedUrl) {
      return NextResponse.json({ shortenedUrl: json.shortenedUrl });
    }
    return NextResponse.json(
      { error: json.message || 'Link4M trả về lỗi không xác định.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Shorten link error:', err);
    return NextResponse.json({ error: 'Lỗi server khi rút gọn link.' }, { status: 500 });
  }
}
