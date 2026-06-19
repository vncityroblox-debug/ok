import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { data, error: queryErr } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (queryErr) {
      console.error('Login history query error', queryErr);
      return NextResponse.json({ error: queryErr.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    console.error('Login history error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
