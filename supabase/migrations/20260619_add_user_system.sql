-- User profiles: extends Supabase auth.users with extra fields
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Activity logs: track all user/admin actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT DEFAULT '',
  user_type TEXT DEFAULT 'user',
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Purchases / download history
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT DEFAULT '',
  item_type TEXT NOT NULL DEFAULT 'app',
  item_id UUID,
  item_name TEXT DEFAULT '',
  item_slug TEXT DEFAULT '',
  download_url TEXT DEFAULT '',
  key_code TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);

-- Login history
CREATE TABLE IF NOT EXISTS login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  device TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own login history" ON login_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON login_history FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_login_history_user_id ON login_history(user_id);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON password_reset_tokens FOR ALL USING (true) WITH CHECK (true);

-- Add SMTP columns to site_settings
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtp_port TEXT DEFAULT '587';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtp_user TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtp_pass TEXT DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS smtp_from TEXT DEFAULT '';
