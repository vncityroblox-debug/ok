-- Add is_verified and verification_code columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verification_code TEXT DEFAULT '';

-- Generate verification codes for all users with empty/null codes
DO $$
DECLARE
  r RECORD;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT;
  i INT;
BEGIN
  FOR r IN SELECT id FROM user_profiles WHERE verification_code IS NULL OR verification_code = '' LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    UPDATE user_profiles SET verification_code = code WHERE id = r.id;
  END LOOP;
END $$;

-- Now add UNIQUE constraint after all codes are generated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_verification_code_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_verification_code_key UNIQUE (verification_code);
  END IF;
END $$;

-- Zalo verification table
CREATE TABLE IF NOT EXISTS zalo_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  zalo_id TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  verification_code TEXT UNIQUE NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE zalo_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own zalo verification" ON zalo_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON zalo_verifications FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_zalo_verifications_verification_code ON zalo_verifications(verification_code);
CREATE INDEX idx_zalo_verifications_user_id ON zalo_verifications(user_id);

-- Chatbot config table
CREATE TABLE IF NOT EXISTS chatbot_configs (
  id INTEGER PRIMARY KEY DEFAULT 1,
  bot_enabled BOOLEAN DEFAULT TRUE,
  welcome_message TEXT DEFAULT 'Xin chào! Tôi là trợ lý ảo. Gõ /help để xem danh sách lệnh.',
  response_rules JSONB DEFAULT '[]'::jsonb,
  zalo_token TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chatbot_configs_single_row CHECK (id = 1)
);

ALTER TABLE chatbot_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read chatbot_configs" ON chatbot_configs FOR SELECT USING (true);
CREATE POLICY "Allow admin edit chatbot_configs" ON chatbot_configs FOR ALL USING (true) WITH CHECK (true);

-- Seed default chatbot config
INSERT INTO chatbot_configs (id, bot_enabled, welcome_message, response_rules)
VALUES (1, true, 'Xin chào! Tôi là trợ lý ảo. Gõ /help để xem danh sách lệnh.', '[
  {"keyword": "xin chào", "reply": "Xin chào bạn! Rất vui được gặp bạn. Bạn cần giúp gì không?"},
  {"keyword": "giúp", "reply": "Các lệnh:\n/xt [MÃ] - Xác thực tài khoản\n/help - Xem danh sách lệnh\n/info - Xem thông tin"},
  {"keyword": "help", "reply": "Các lệnh:\n/xt [MÃ] - Xác thực tài khoản\n/help - Xem danh sách lệnh\n/info - Xem thông tin"}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;
