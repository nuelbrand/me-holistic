
-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.life_phase AS ENUM ('Student', 'Employee', 'Business Owner', 'In-Transition');
CREATE TYPE public.resource_status AS ENUM ('not-started', 'in-progress', 'completed');
CREATE TYPE public.resource_category AS ENUM ('Faith', 'Mind', 'Body', 'General');
CREATE TYPE public.resource_type AS ENUM ('Books', 'Audio', 'Frameworks', 'Checklists', 'Video');
CREATE TYPE public.mood_label AS ENUM ('Excellent', 'Good', 'Neutral', 'Stressed');

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  life_phase public.life_phase NOT NULL DEFAULT 'Employee',
  detail_a TEXT DEFAULT '',
  detail_b TEXT DEFAULT '',
  focus TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ===== user_roles (separate table per security best practice) =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== journal_entries =====
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_own" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== devotionals (notes + prayer requests) =====
CREATE TABLE public.devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_content TEXT DEFAULT '',
  prayer_request TEXT DEFAULT '',
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devotionals TO authenticated;
GRANT ALL ON public.devotionals TO service_role;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devotionals_own" ON public.devotionals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== resources =====
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  type public.resource_type NOT NULL DEFAULT 'Books',
  category public.resource_category NOT NULL DEFAULT 'General',
  status public.resource_status NOT NULL DEFAULT 'not-started',
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_own" ON public.resources FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== tribes =====
CREATE TABLE public.tribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribes TO authenticated;
GRANT ALL ON public.tribes TO service_role;
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tribes_select_all" ON public.tribes FOR SELECT TO authenticated USING (true);
CREATE POLICY "tribes_insert_self" ON public.tribes FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "tribes_update_creator" ON public.tribes FOR UPDATE TO authenticated USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tribes_delete_creator" ON public.tribes FOR DELETE TO authenticated USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- ===== tribe_members =====
CREATE TABLE public.tribe_members (
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tribe_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_members TO authenticated;
GRANT ALL ON public.tribe_members TO service_role;
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tribe_members_select_all" ON public.tribe_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "tribe_members_join_self" ON public.tribe_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tribe_members_leave_self" ON public.tribe_members FOR DELETE TO authenticated USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.tribes t WHERE t.id = tribe_id AND t.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- ===== mood_logs (for synced weekly chart) =====
CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood public.mood_label NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs TO authenticated;
GRANT ALL ON public.mood_logs TO service_role;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mood_own" ON public.mood_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== Posts (community) =====
CREATE TABLE public.tribe_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tribe_posts TO authenticated;
GRANT ALL ON public.tribe_posts TO service_role;
ALTER TABLE public.tribe_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_all" ON public.tribe_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert_self" ON public.tribe_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_self" ON public.tribe_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "posts_delete_self" ON public.tribe_posts FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- ===== New user trigger: create profile + grant role (first user = admin) =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== updated_at trigger for profiles =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
