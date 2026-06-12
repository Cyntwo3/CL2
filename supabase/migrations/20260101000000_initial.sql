-- RagaMuffin initial schema

-- Profiles: one row per user, extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('dad', 'son')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages: the hidden dad-son chat
CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read all profiles
CREATE POLICY "auth_read_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can upsert their own profile only
CREATE POLICY "auth_upsert_own_profile"
  ON profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Any authenticated user can read all messages
CREATE POLICY "auth_read_messages"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert messages as themselves
CREATE POLICY "auth_insert_own_messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());
