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

    const { full_name, phone, email } = await request.json();

    const supabaseAdmin = getSupabaseServer(true);

    const { error: profileErr } = await supabaseAdmin
      .from('user_profiles')
      .update({ full_name, phone, email, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (profileErr) {
      console.error('Update profile error', profileErr);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    if (email && email !== user.email) {
      const { error: emailErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email });
      if (emailErr) {
        console.error('Update email error', emailErr);
        return NextResponse.json({ error: emailErr.message }, { status: 400 });
      }
    }

    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      user_email: email || user.email,
      action: 'update_profile',
      details: { full_name, phone, email },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update profile error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
