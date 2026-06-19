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
      return NextResponse.json({ error: 'Forbidden: Chỉ Full Admin mới tặng được.' }, { status: 403 });
    }

    const { user_id, user_email, item_type, item_id, key_code } = await req.json();
    if (!user_id || !item_type || !item_id) {
      return NextResponse.json({ error: 'Thiếu dữ liệu bắt buộc (user_id, item_type, item_id).' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseServer(true);

    let item_name = '';
    if (item_type === 'app') {
      const { data: item } = await supabaseAdmin
        .from('apps')
        .select('name')
        .eq('id', item_id)
        .single();
      item_name = item?.name ?? '';
    } else if (item_type === 'source_code') {
      const { data: item } = await supabaseAdmin
        .from('source_codes')
        .select('name')
        .eq('id', item_id)
        .single();
      item_name = item?.name ?? '';
    }

    const { data: purchase, error: insertErr } = await supabaseAdmin
      .from('purchases')
      .insert({
        user_id,
        user_email,
        item_type,
        item_id,
        item_name,
        key_code: key_code ?? null,
        status: 'gifted',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await supabaseAdmin.from('activity_logs').insert({
      user_id,
      user_email: caller.email,
      action: 'gift_purchase',
      details: { admin_email: caller.email, item_type, item_id, item_name },
    });

    return NextResponse.json({ success: true, purchase });
  } catch (e: any) {
    console.error('Gift purchase error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
