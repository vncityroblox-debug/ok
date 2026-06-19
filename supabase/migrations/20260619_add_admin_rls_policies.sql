-- ============================================================
-- Migration: Thêm RLS policies cho admin đọc tất cả dữ liệu
-- and public read policies cho public pages
-- ============================================================

-- Helper: check if current user is admin
-- Admin users are identified by being in admin_users table

-- ── analytics_visits ──────────────────────────────────────────
ALTER TABLE analytics_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all visits" ON analytics_visits;
CREATE POLICY "Admins can read all visits" ON analytics_visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone can insert visits" ON analytics_visits;
CREATE POLICY "Anyone can insert visits" ON analytics_visits
  FOR INSERT WITH CHECK (true);

-- ── analytics_downloads ───────────────────────────────────────
ALTER TABLE analytics_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all downloads" ON analytics_downloads;
CREATE POLICY "Admins can read all downloads" ON analytics_downloads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone can insert downloads" ON analytics_downloads;
CREATE POLICY "Anyone can insert downloads" ON analytics_downloads
  FOR INSERT WITH CHECK (true);

-- ── activity_logs ─────────────────────────────────────────────
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all activity logs" ON activity_logs;
CREATE POLICY "Admins can read all activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can read own activity logs" ON activity_logs;
CREATE POLICY "Users can read own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert activity logs" ON activity_logs;
CREATE POLICY "Anyone can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- ── login_history ─────────────────────────────────────────────
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all login history" ON login_history;
CREATE POLICY "Admins can read all login history" ON login_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can read own login history" ON login_history;
CREATE POLICY "Users can read own login history" ON login_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert login history" ON login_history;
CREATE POLICY "Anyone can insert login history" ON login_history
  FOR INSERT WITH CHECK (true);

-- ── user_profiles ─────────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can insert profiles" ON user_profiles;
CREATE POLICY "Anyone can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- ── purchases ────────────────────────────────────────────────
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all purchases" ON purchases;
CREATE POLICY "Admins can read all purchases" ON purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can read own purchases" ON purchases;
CREATE POLICY "Users can read own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert purchases" ON purchases;
CREATE POLICY "Anyone can insert purchases" ON purchases
  FOR INSERT WITH CHECK (true);

-- ── password_reset_tokens ─────────────────────────────────────
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages tokens" ON password_reset_tokens;
CREATE POLICY "Service role manages tokens" ON password_reset_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- ── apps (public read) ────────────────────────────────────────
-- Enable RLS if not already enabled
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read non-hidden apps" ON apps;
CREATE POLICY "Public can read non-hidden apps" ON apps
  FOR SELECT USING (is_hidden = false OR is_hidden IS NULL);

DROP POLICY IF EXISTS "Admins can read all apps" ON apps;
CREATE POLICY "Admins can read all apps" ON apps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ── categories (public read) ─────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Public can read categories" ON categories
  FOR SELECT USING (true);

-- ── posts (public read) ──────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read posts" ON posts;
CREATE POLICY "Public can read posts" ON posts
  FOR SELECT USING (true);

-- ── site_settings (public read) ──────────────────────────────
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read settings" ON site_settings;
CREATE POLICY "Public can read settings" ON site_settings
  FOR SELECT USING (true);
