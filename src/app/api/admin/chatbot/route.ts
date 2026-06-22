import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkAdminAuth, unauthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await checkAdminAuth(req);
    if (!user) return unauthorized();

    const supabase = getSupabaseServer(true);
    const { data, error } = await supabase
      .from('chatbot_configs')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data });
  } catch (e: any) {
    console.error('Chatbot config GET error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await checkAdminAuth(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const supabase = getSupabaseServer(true);

    const { error } = await supabase
      .from('chatbot_configs')
      .upsert({
        id: 1,
        bot_enabled: body.bot_enabled ?? true,
        welcome_message: body.welcome_message ?? '',
        response_rules: body.response_rules ?? [],
        zalo_token: body.zalo_token ?? '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Chatbot config POST error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
