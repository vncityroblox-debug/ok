import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên tài khoản.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('username', username)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Tên tài khoản không tồn tại.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ email: data.email });
  } catch (e: any) {
    console.error('Login lookup error', e);
    return NextResponse.json({ error: 'Lỗi server.' }, { status: 500 });
  }
}
