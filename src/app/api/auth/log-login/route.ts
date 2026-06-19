import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseServer(false);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const device = req.headers.get('user-agent') || 'unknown';

    const supabaseAdmin = getSupabaseServer(true);

    await supabaseAdmin.from('login_history').insert({
      user_id: user.id,
      user_email: user.email,
      ip_address: ip,
      device,
      created_at: new Date().toISOString(),
    });

    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action: 'login',
      details: { ip, device },
      ip_address: ip,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Log login error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
