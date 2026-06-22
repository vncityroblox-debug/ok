import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const supabase = getSupabaseServer(true);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, username, is_verified')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: verification } = await supabase
      .from('zalo_verifications')
      .select('zalo_id, display_name, avatar_url, verification_code, verified_at')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      is_verified: profile.is_verified || false,
      username: profile.username,
      zalo: verification || null,
    });
  } catch (e) {
    console.error('Verify status error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
