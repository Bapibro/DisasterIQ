-- ==========================================
-- DisasterIQ PostgreSQL Schema for Supabase
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  college TEXT DEFAULT '',
  course TEXT DEFAULT '',
  year TEXT DEFAULT '',
  city TEXT DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'faculty')) DEFAULT 'student',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EMERGENCY PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.emergency_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  emergency_contact TEXT DEFAULT '',
  blood_group TEXT DEFAULT '',
  medical_notes TEXT DEFAULT '',
  allergies TEXT DEFAULT '',
  special_assistance TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PREPAREDNESS TABLE
CREATE TABLE IF NOT EXISTS public.preparedness (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  kit_items JSONB DEFAULT '{}'::jsonb,
  go_bag_items JSONB DEFAULT '{}'::jsonb,
  emergency_plan JSONB DEFAULT '{}'::jsonb,
  review_status JSONB DEFAULT '{}'::jsonb,
  score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LEARNING PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_topic UNIQUE (user_id, topic)
);

-- 6. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_key)
);

-- 7. EMERGENCY ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Warning', 'Advisory')),
  location TEXT DEFAULT 'Entire Campus',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 8. DRILLS TABLE
CREATE TABLE IF NOT EXISTS public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT DEFAULT 'Campus Quad',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AUTOMATIC TRIGGER FOR NEW USERS & PROFILES
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );

  INSERT INTO public.emergency_profiles (user_id)
  VALUES (NEW.id);

  INSERT INTO public.preparedness (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparedness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is faculty/teacher
CREATE OR REPLACE FUNCTION public.is_teacher_or_faculty()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'faculty')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_teacher_or_faculty());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- EMERGENCY PROFILES POLICIES
CREATE POLICY "Users can manage own emergency profile" ON public.emergency_profiles
  FOR ALL USING (auth.uid() = user_id);

-- PREPAREDNESS POLICIES
CREATE POLICY "Users can read preparedness" ON public.preparedness
  FOR SELECT USING (auth.uid() = user_id OR public.is_teacher_or_faculty());

CREATE POLICY "Users can update own preparedness" ON public.preparedness
  FOR ALL USING (auth.uid() = user_id);

-- QUIZ ATTEMPTS POLICIES
CREATE POLICY "Users can read quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id OR public.is_teacher_or_faculty());

CREATE POLICY "Users can insert own quiz attempt" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- LEARNING PROGRESS POLICIES
CREATE POLICY "Users can read learning progress" ON public.learning_progress
  FOR SELECT USING (auth.uid() = user_id OR public.is_teacher_or_faculty());

CREATE POLICY "Users can manage own learning progress" ON public.learning_progress
  FOR ALL USING (auth.uid() = user_id);

-- ACHIEVEMENTS POLICIES
CREATE POLICY "Users can read own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievement" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- EMERGENCY ALERTS POLICIES
CREATE POLICY "Everyone authenticated can view alerts" ON public.emergency_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Faculty can manage emergency alerts" ON public.emergency_alerts
  FOR ALL USING (public.is_teacher_or_faculty());

-- DRILLS POLICIES
CREATE POLICY "Everyone authenticated can view drills" ON public.drills
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Faculty can manage drills" ON public.drills
  FOR ALL USING (public.is_teacher_or_faculty());

-- ==========================================
-- SUPABASE STORAGE BUCKET FOR AVATARS
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "User Upload Avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User Delete Avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
