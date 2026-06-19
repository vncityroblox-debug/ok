import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  return runSetup();
}

async function runSetup() {
  try {
    const supabase = getSupabaseServer(true);
    const results: { table: string; exists: boolean; error?: string }[] = [];

    const appsCheck = await supabase.from('apps').select('id').limit(1);
    const hasIsHidden = !appsCheck.error || !appsCheck.error.message?.includes('is_hidden');
    results.push({
      table: 'apps.is_hidden',
      exists: hasIsHidden,
      error: hasIsHidden ? undefined : 'Missing column — run: ALTER TABLE apps ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;',
    });

    const cronCheck = await supabase.from('cron_jobs').select('id').limit(1);
    const cronExists = !cronCheck.error || !cronCheck.error.message?.includes('does not exist');
    results.push({
      table: 'cron_jobs',
      exists: cronExists,
      error: cronExists ? undefined : 'Missing table — see supabase/migrations/20260619_add_cron_jobs.sql',
    });

    return Response.json({
      results,
      message: results.every(r => r.exists) ? 'All DB objects OK' : 'Some objects missing — run SQL migrations in Supabase SQL Editor',
      migrationSQL: results.some(r => !r.exists) ? getMigrationSQL(results) : null,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function getMigrationSQL(results: { table: string; exists: boolean }[]) {
  const parts: string[] = [];
  if (!results.find(r => r.table === 'apps.is_hidden')?.exists) {
    parts.push('-- Add is_hidden column to apps table\nALTER TABLE apps ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;');
  }
  if (!results.find(r => r.table === 'cron_jobs')?.exists) {
    parts.push(`-- Create cron_jobs table
CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  interval_minutes INT NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  total_runs INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON cron_jobs FOR ALL USING (true) WITH CHECK (true);`);
  }
  return parts.join('\n\n');
}
