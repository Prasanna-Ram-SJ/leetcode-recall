-- Run this file in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  username_normalized text NOT NULL UNIQUE,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- 2. PROBLEMS TABLE (User's Solved-Problem Library)
CREATE TABLE IF NOT EXISTS public.problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL,
  canonical_url text NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_slug UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_problems_user ON public.problems(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(user_id, slug);

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own problems"
  ON public.problems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problems"
  ON public.problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems"
  ON public.problems FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems"
  ON public.problems FOR DELETE
  USING (auth.uid() = user_id);


-- 3. RECALL LISTS TABLE
CREATE TABLE IF NOT EXISTS public.recall_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  daily_target integer NOT NULL DEFAULT 3 CHECK (daily_target > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recall_lists_user ON public.recall_lists(user_id);

ALTER TABLE public.recall_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lists"
  ON public.recall_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists"
  ON public.recall_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists"
  ON public.recall_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists"
  ON public.recall_lists FOR DELETE
  USING (auth.uid() = user_id);


-- 4. RECALL LIST PROBLEMS (Membership)
CREATE TABLE IF NOT EXISTS public.recall_list_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.recall_lists(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_list_problem UNIQUE(list_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_recall_list_problems_list ON public.recall_list_problems(list_id);
CREATE INDEX IF NOT EXISTS idx_recall_list_problems_problem ON public.recall_list_problems(problem_id);

ALTER TABLE public.recall_list_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own list problems"
  ON public.recall_list_problems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own list problems"
  ON public.recall_list_problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own list problems"
  ON public.recall_list_problems FOR DELETE
  USING (auth.uid() = user_id);


-- 5. LIST CYCLES
CREATE TABLE IF NOT EXISTS public.list_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.recall_lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL DEFAULT 1,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_list_cycles_list ON public.list_cycles(list_id);
CREATE INDEX IF NOT EXISTS idx_list_cycles_current ON public.list_cycles(list_id, is_current);

ALTER TABLE public.list_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own list cycles"
  ON public.list_cycles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 6. CYCLE ITEMS (Shuffled order for current cycle)
CREATE TABLE IF NOT EXISTS public.cycle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.list_cycles(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  position integer NOT NULL,
  is_served boolean NOT NULL DEFAULT false,
  served_batch_id uuid,
  CONSTRAINT unique_cycle_problem UNIQUE(cycle_id, problem_id),
  CONSTRAINT unique_cycle_position UNIQUE(cycle_id, position)
);

CREATE INDEX IF NOT EXISTS idx_cycle_items_cycle ON public.cycle_items(cycle_id);
CREATE INDEX IF NOT EXISTS idx_cycle_items_unserved ON public.cycle_items(cycle_id, is_served, position);

ALTER TABLE public.cycle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cycle items"
  ON public.cycle_items FOR ALL
  USING (
    cycle_id IN (SELECT id FROM public.list_cycles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    cycle_id IN (SELECT id FROM public.list_cycles WHERE user_id = auth.uid())
  );


-- 7. DAILY BATCHES
CREATE TABLE IF NOT EXISTS public.daily_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.recall_lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_date text NOT NULL,
  cycle_id uuid NOT NULL REFERENCES public.list_cycles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_list_date UNIQUE(list_id, batch_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_batches_lookup ON public.daily_batches(list_id, batch_date);

ALTER TABLE public.daily_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily batches"
  ON public.daily_batches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 8. DAILY BATCH ITEMS
CREATE TABLE IF NOT EXISTS public.daily_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.daily_batches(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  position integer NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  CONSTRAINT unique_batch_problem UNIQUE(batch_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_batch_items_batch ON public.daily_batch_items(batch_id);

ALTER TABLE public.daily_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own batch items"
  ON public.daily_batch_items FOR ALL
  USING (
    batch_id IN (SELECT id FROM public.daily_batches WHERE user_id = auth.uid())
  )
  WITH CHECK (
    batch_id IN (SELECT id FROM public.daily_batches WHERE user_id = auth.uid())
  );


-- 9. ATOMIC STORED FUNCTION: materialize_daily_batch
CREATE OR REPLACE FUNCTION public.materialize_daily_batch(
  p_list_id uuid,
  p_batch_date text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_list record;
  v_batch_id uuid;
  v_cycle_id uuid;
  v_cycle_number integer := 1;
  v_target integer;
  v_unserved_count integer;
  v_problem_count integer;
  v_items jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_list
  FROM public.recall_lists
  WHERE id = p_list_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'List not found or access denied';
  END IF;

  SELECT id, cycle_id INTO v_batch_id, v_cycle_id
  FROM public.daily_batches
  WHERE list_id = p_list_id AND batch_date = p_batch_date;

  IF FOUND THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', bi.id,
        'batch_id', bi.batch_id,
        'problem_id', bi.problem_id,
        'position', bi.position,
        'is_completed', bi.is_completed,
        'completed_at', bi.completed_at,
        'title', p.title,
        'slug', p.slug,
        'canonical_url', p.canonical_url
      ) ORDER BY bi.position ASC
    ) INTO v_items
    FROM public.daily_batch_items bi
    JOIN public.problems p ON p.id = bi.problem_id
    WHERE bi.batch_id = v_batch_id;

    RETURN jsonb_build_object(
      'batch_id', v_batch_id,
      'list_id', p_list_id,
      'batch_date', p_batch_date,
      'is_active', v_list.is_active,
      'items', COALESCE(v_items, '[]'::jsonb)
    );
  END IF;

  IF NOT v_list.is_active THEN
    RETURN jsonb_build_object(
      'batch_id', NULL,
      'list_id', p_list_id,
      'batch_date', p_batch_date,
      'is_active', false,
      'items', '[]'::jsonb,
      'message', 'List is paused'
    );
  END IF;

  SELECT count(*) INTO v_problem_count
  FROM public.recall_list_problems
  WHERE list_id = p_list_id;

  IF v_problem_count = 0 THEN
    RETURN jsonb_build_object(
      'batch_id', NULL,
      'list_id', p_list_id,
      'batch_date', p_batch_date,
      'is_active', true,
      'items', '[]'::jsonb,
      'message', 'List has no problems'
    );
  END IF;

  v_target := GREATEST(1, v_list.daily_target);

  SELECT id, cycle_number INTO v_cycle_id, v_cycle_number
  FROM public.list_cycles
  WHERE list_id = p_list_id AND is_current = true
  ORDER BY cycle_number DESC
  LIMIT 1;

  IF v_cycle_id IS NOT NULL THEN
    SELECT count(*) INTO v_unserved_count
    FROM public.cycle_items ci
    JOIN public.recall_list_problems rlp ON rlp.problem_id = ci.problem_id AND rlp.list_id = p_list_id
    WHERE ci.cycle_id = v_cycle_id AND ci.is_served = false;
  ELSE
    v_unserved_count := 0;
  END IF;

  IF v_cycle_id IS NULL OR v_unserved_count = 0 THEN
    IF v_cycle_id IS NOT NULL THEN
      UPDATE public.list_cycles
      SET is_current = false, completed_at = now()
      WHERE id = v_cycle_id;
      v_cycle_number := v_cycle_number + 1;
    END IF;

    INSERT INTO public.list_cycles (list_id, user_id, cycle_number, is_current)
    VALUES (p_list_id, v_user_id, v_cycle_number, true)
    RETURNING id INTO v_cycle_id;

    INSERT INTO public.cycle_items (cycle_id, problem_id, position, is_served)
    SELECT
      v_cycle_id,
      rlp.problem_id,
      row_number() OVER (ORDER BY random()) - 1 AS position,
      false AS is_served
    FROM public.recall_list_problems rlp
    WHERE rlp.list_id = p_list_id;
  END IF;

  INSERT INTO public.daily_batches (list_id, user_id, batch_date, cycle_id)
  VALUES (p_list_id, v_user_id, p_batch_date, v_cycle_id)
  RETURNING id INTO v_batch_id;

  WITH to_serve AS (
    SELECT ci.id AS cycle_item_id, ci.problem_id, row_number() OVER (ORDER BY ci.position ASC) - 1 AS batch_pos
    FROM public.cycle_items ci
    JOIN public.recall_list_problems rlp ON rlp.problem_id = ci.problem_id AND rlp.list_id = p_list_id
    WHERE ci.cycle_id = v_cycle_id AND ci.is_served = false
    ORDER BY ci.position ASC
    LIMIT v_target
  ),
  ins_batch_items AS (
    INSERT INTO public.daily_batch_items (batch_id, problem_id, position, is_completed)
    SELECT v_batch_id, problem_id, batch_pos, false
    FROM to_serve
  )
  UPDATE public.cycle_items
  SET is_served = true, served_batch_id = v_batch_id
  WHERE id IN (SELECT cycle_item_id FROM to_serve);

  SELECT count(*) INTO v_unserved_count
  FROM public.cycle_items ci
  JOIN public.recall_list_problems rlp ON rlp.problem_id = ci.problem_id AND rlp.list_id = p_list_id
  WHERE ci.cycle_id = v_cycle_id AND ci.is_served = false;

  IF v_unserved_count = 0 THEN
    UPDATE public.list_cycles
    SET is_current = false, completed_at = now()
    WHERE id = v_cycle_id;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', bi.id,
      'batch_id', bi.batch_id,
      'problem_id', bi.problem_id,
      'position', bi.position,
      'is_completed', bi.is_completed,
      'completed_at', bi.completed_at,
      'title', p.title,
      'slug', p.slug,
      'canonical_url', p.canonical_url
    ) ORDER BY bi.position ASC
  ) INTO v_items
  FROM public.daily_batch_items bi
  JOIN public.problems p ON p.id = bi.problem_id
  WHERE bi.batch_id = v_batch_id;

  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'list_id', p_list_id,
    'batch_date', p_batch_date,
    'is_active', true,
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;


-- ====================================================================
-- 10. AUTH TRIGGER: Automatic profile provisioning on signup
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username text;
  v_normalized text;
  v_timezone text;
BEGIN
  v_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  v_normalized := lower(v_username);

  v_timezone := COALESCE(
    new.raw_user_meta_data->>'timezone',
    'UTC'
  );

  INSERT INTO public.profiles (id, username, username_normalized, timezone, created_at)
  VALUES (new.id, v_username, v_normalized, v_timezone, now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    username_normalized = EXCLUDED.username_normalized,
    timezone = EXCLUDED.timezone;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
