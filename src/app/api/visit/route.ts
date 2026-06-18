import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { z } from 'zod';

const visitSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = visitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Yêu cầu không hợp lệ', details: result.error.format() },
        { status: 400 }
      );
    }

    const { sessionId } = result.data;
    const supabase = getSupabaseServer();

    // Insert the visit record. Public policy allows inserts.
    const { error } = await supabase.from('analytics_visits').insert({
      session_id: sessionId,
    });

    if (error) {
      console.error('Database log visit error:', error);
      return NextResponse.json({ error: 'Lỗi ghi nhận truy cập' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Visit API error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
