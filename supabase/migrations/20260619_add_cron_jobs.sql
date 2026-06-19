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
CREATE POLICY "Allow all" ON cron_jobs FOR ALL USING (true) WITH CHECK (true);
