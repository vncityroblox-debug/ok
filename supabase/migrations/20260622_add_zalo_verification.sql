-- Add is_verified and verification_code columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE DEFAULT '';

-- Generate verification codes for existing users
UPDATE user_profiles SET verification_code = upper(substring(md5(random()::text) from 1 for 6)) WHERE verification_code = '' OR verification_code IS NULL;

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
