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

    const { action, details } = await request.json();

    const supabaseAdmin = getSupabaseServer(true);

    const { error: insertErr } = await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      details,
    });

    if (insertErr) {
      console.error('Log activity error', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Log activity error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
