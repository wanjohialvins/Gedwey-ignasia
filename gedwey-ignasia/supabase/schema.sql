-- ====================================================
-- GEDWEY IGNASIA — DATABASE SCHEMA
-- ====================================================

-- 1. Create Couples table
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL
);

-- 2. Create Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  display_name TEXT,
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  app_mode TEXT DEFAULT 'discovery' CHECK (app_mode IN ('discovery', 'early_dating', 'couples')),
  relationship_stage TEXT,
  invite_code TEXT UNIQUE,
  expo_push_token TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'default' CHECK (theme_preference IN ('default', 'dark', 'soft')),
  accent_color TEXT DEFAULT '#2563EB',
  mature_mode_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  mature_mode_age_verified BOOLEAN DEFAULT FALSE NOT NULL,
  dev_mode BOOLEAN DEFAULT TRUE NOT NULL,
  bio TEXT,
  love_language TEXT,
  birthday DATE,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- 3. Create Cards table (prompts)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('discovery', 'intimacy', 'fun', 'relationship_health')),
  min_relationship_stage TEXT
);

-- 4. Create Discovery Sessions table (viral sharing/early stage)
CREATE TABLE IF NOT EXISTS discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_answer TEXT NOT NULL,
  guest_name TEXT,
  guest_answer TEXT,
  token TEXT UNIQUE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create Sessions table (couple sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user1_mood TEXT,
  user2_mood TEXT,
  user1_answer TEXT,
  user2_answer TEXT,
  user1_voice_url TEXT,
  user2_voice_url TEXT,
  user1_voice_duration INTEGER,
  user2_voice_duration INTEGER,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT
);

-- 7. Create Health Checkins table
CREATE TABLE IF NOT EXISTS health_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 10),
  intimacy INTEGER NOT NULL CHECK (intimacy >= 1 AND intimacy <= 10),
  trust INTEGER NOT NULL CHECK (trust >= 1 AND trust <= 10),
  connection INTEGER NOT NULL CHECK (connection >= 1 AND connection <= 10),
  conflict INTEGER NOT NULL CHECK (conflict >= 1 AND conflict <= 10)
);

-- 8. Create Time Capsules table
CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  open_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_opened BOOLEAN DEFAULT FALSE NOT NULL
);

-- 9. Create Hourly Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('session', 'game', 'todo', 'bucket', 'music', 'profile', 'voice')),
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 10. Create Shared To-Do / Bucket List table
CREATE TABLE IF NOT EXISTS shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('todo', 'bucket')),
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;

-- Couples policies
CREATE POLICY "Users can view their own couple profile" ON couples
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.couple_id = couples.id AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own couple profile" ON couples
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.couple_id = couples.id AND profiles.id = auth.uid()
    )
  );

-- Profiles policies
CREATE OR REPLACE FUNCTION public.get_my_couple_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT couple_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view profiles in same couple" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    (couple_id IS NOT NULL AND couple_id = public.get_my_couple_id())
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Cards policies
CREATE POLICY "Anyone can view cards" ON cards
  FOR SELECT TO public USING (true);

-- Discovery Sessions policies
CREATE POLICY "Users can view discovery sessions they created" ON discovery_sessions
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can create discovery sessions" ON discovery_sessions
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

-- Public guest access to discovery sessions via URL token
CREATE POLICY "Guests can read discovery sessions via token" ON discovery_sessions
  FOR SELECT TO public USING (true);

CREATE POLICY "Guests can update discovery sessions via token" ON discovery_sessions
  FOR UPDATE TO public USING (true);

-- Sessions policies
CREATE POLICY "Couple members can view sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = sessions.couple_id
    )
  );

CREATE POLICY "Couple members can insert sessions" ON sessions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = sessions.couple_id
    )
  );

CREATE POLICY "Couple members can update sessions" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = sessions.couple_id
    )
  );

-- Journal Entries policies
CREATE POLICY "Couple members can view journal entries" ON journal_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = journal_entries.couple_id
    )
  );

CREATE POLICY "Couple members can manage journal entries" ON journal_entries
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = journal_entries.couple_id
    )
  );

-- Health Checkins policies
CREATE POLICY "Couple members can view health checkins" ON health_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = health_checkins.couple_id
    )
  );

CREATE POLICY "Couple members can add health checkin" ON health_checkins
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = health_checkins.couple_id
    )
  );

-- Time Capsules policies
CREATE POLICY "Couple members can view time capsules" ON time_capsules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = time_capsules.couple_id
    )
  );

CREATE POLICY "Couple members can manage time capsules" ON time_capsules
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.couple_id = time_capsules.couple_id
    )
  );

-- Activity Logs policies
CREATE POLICY "Couple members can view activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.couple_id = activity_logs.couple_id
    )
  );

CREATE POLICY "Couple members can add activity logs" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.couple_id = activity_logs.couple_id
    )
  );

-- Shared Items policies
CREATE POLICY "Couple members can view shared items" ON shared_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.couple_id = shared_items.couple_id
    )
  );

CREATE POLICY "Couple members can manage shared items" ON shared_items
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.couple_id = shared_items.couple_id
    )
  );

-- ====================================================
-- PROFILE AUTO-CREATION ON SIGNUP
-- ====================================================

-- Storage buckets for profile photos and voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-notes', 'voice-notes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload voice notes" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voice-notes');

CREATE POLICY "Public can read Gedwey media" ON storage.objects
  FOR SELECT TO public USING (bucket_id IN ('profile-images', 'voice-notes'));

-- Trigger function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, app_mode)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'discovery'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user() on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
