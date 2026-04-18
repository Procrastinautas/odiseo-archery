-- ============================================================
-- Odiseo App — Supabase Schema
-- Run this in the Supabase SQL Editor (or via supabase db push)
-- ============================================================


-- ============================================================
-- Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- Enum types
-- ============================================================

CREATE TYPE user_role           AS ENUM ('admin', 'user');
CREATE TYPE bow_hand            AS ENUM ('left', 'right');
CREATE TYPE bow_type            AS ENUM ('recurve', 'compound', 'barebow');
CREATE TYPE session_status      AS ENUM ('pending', 'confirmed', 'declined', 'cancelled');
CREATE TYPE payment_status      AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE weather_type        AS ENUM ('sunny', 'cloudy', 'rainy', 'heavy_rain', 'windy');
CREATE TYPE training_type       AS ENUM ('control', 'training', 'contest');
CREATE TYPE score_method        AS ENUM ('manual', 'summary', 'target_map');
CREATE TYPE marketplace_category AS ENUM ('bow', 'arrows', 'accessory', 'other');
CREATE TYPE marketplace_status  AS ENUM ('active', 'sold', 'removed');


-- ============================================================
-- Helper: set_updated_at()
-- Generic trigger function to keep updated_at current.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- Tables
-- ============================================================

-- ------------------------------------------------------------
-- profiles (1-to-1 with auth.users)
-- ------------------------------------------------------------
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  email       text        NOT NULL,
  picture_url text,
  role        user_role   NOT NULL DEFAULT 'user',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create a profile row whenever a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- Helper: is_admin()
-- SECURITY DEFINER so it bypasses RLS on profiles.
-- Must be defined after profiles table exists.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- locations
-- ------------------------------------------------------------
CREATE TABLE public.locations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- bows
-- ------------------------------------------------------------
CREATE TABLE public.bows (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  hand        bow_hand    NOT NULL,
  type        bow_type    NOT NULL,
  draw_weight numeric     NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bows_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- scope_marks
-- ------------------------------------------------------------
CREATE TABLE public.scope_marks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bow_id      uuid        NOT NULL,
  distance    numeric     NOT NULL,
  mark_value  text        NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scope_marks_bow_id_fkey
    FOREIGN KEY (bow_id) REFERENCES public.bows(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- arrows
-- ------------------------------------------------------------
CREATE TABLE public.arrows (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL,
  brand          text        NOT NULL,
  diameter_mm    numeric,
  fletchings     text,
  shaft_material text,
  point_type     text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT arrows_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- bank_settings
-- ------------------------------------------------------------
CREATE TABLE public.bank_settings (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name      text        NOT NULL,
  account_holder text        NOT NULL,
  account_number text        NOT NULL,
  account_type   text,
  instructions   text,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  updated_by     uuid,
  CONSTRAINT bank_settings_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);


-- ------------------------------------------------------------
-- scheduled_sessions
-- ------------------------------------------------------------
CREATE TABLE public.scheduled_sessions (
  id                    uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid           NOT NULL,
  date                  date           NOT NULL,
  time                  time           NOT NULL,
  distance              numeric        NOT NULL,
  location_id           uuid           NOT NULL,
  status                session_status NOT NULL DEFAULT 'pending',
  material_bow          boolean        NOT NULL DEFAULT false,
  material_arrows       boolean        NOT NULL DEFAULT false,
  material_karkaj       boolean        NOT NULL DEFAULT false,
  material_protection_gear boolean     NOT NULL DEFAULT false,
  material_weights      boolean        NOT NULL DEFAULT false,
  material_tap          boolean        NOT NULL DEFAULT false,
  notes                 text,
  admin_note            text,
  created_at            timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT scheduled_sessions_location_id_fkey
    FOREIGN KEY (location_id) REFERENCES public.locations(id)
);


-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
CREATE TABLE public.payments (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_session_id uuid           NOT NULL,
  user_id              uuid           NOT NULL,
  receipt_url          text,
  status               payment_status NOT NULL DEFAULT 'pending',
  admin_note           text,
  created_at           timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT payments_scheduled_session_id_fkey
    FOREIGN KEY (scheduled_session_id) REFERENCES public.scheduled_sessions(id) ON DELETE CASCADE,
  CONSTRAINT payments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- training_sessions
-- ------------------------------------------------------------
CREATE TABLE public.training_sessions (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_session_id uuid,
  user_id              uuid          NOT NULL,
  weather              weather_type,
  type                 training_type,
  distance             numeric,
  start_time           timestamptz,
  end_time             timestamptz,
  target_size          text,
  bow_id               uuid,
  arrow_id             uuid,
  new_gear_notes       text,
  physical_status      text,
  scoresheet_url       text,
  final_thoughts       text,
  ai_recap             text,
  ai_advice            text,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT training_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT training_sessions_scheduled_session_id_fkey
    FOREIGN KEY (scheduled_session_id) REFERENCES public.scheduled_sessions(id) ON DELETE SET NULL,
  CONSTRAINT training_sessions_bow_id_fkey
    FOREIGN KEY (bow_id) REFERENCES public.bows(id) ON DELETE SET NULL,
  CONSTRAINT training_sessions_arrow_id_fkey
    FOREIGN KEY (arrow_id) REFERENCES public.arrows(id) ON DELETE SET NULL
);

CREATE TRIGGER training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ------------------------------------------------------------
-- rounds
-- ------------------------------------------------------------
CREATE TABLE public.rounds (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid        NOT NULL,
  round_number        integer     NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rounds_training_session_id_fkey
    FOREIGN KEY (training_session_id) REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  CONSTRAINT rounds_session_round_unique
    UNIQUE (training_session_id, round_number)
);


-- ------------------------------------------------------------
-- round_scores
-- ------------------------------------------------------------
CREATE TABLE public.round_scores (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id     uuid         NOT NULL,
  method       score_method NOT NULL,
  data         jsonb        NOT NULL,
  total_score  integer,
  tens         integer,
  xs           integer,
  nines        integer,
  below_8_count integer,
  misses       integer,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT round_scores_round_id_key UNIQUE (round_id),
  CONSTRAINT round_scores_round_id_fkey
    FOREIGN KEY (round_id) REFERENCES public.rounds(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- improvement_areas
-- ------------------------------------------------------------
CREATE TABLE public.improvement_areas (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid        NOT NULL,
  comment             text        NOT NULL,
  attachment_url      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT improvement_areas_training_session_id_fkey
    FOREIGN KEY (training_session_id) REFERENCES public.training_sessions(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- warmup_plans
-- ------------------------------------------------------------
CREATE TABLE public.warmup_plans (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text        NOT NULL,
  created_by  uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT warmup_plans_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- stretching_plans
-- ------------------------------------------------------------
CREATE TABLE public.stretching_plans (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text        NOT NULL,
  created_by  uuid        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stretching_plans_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid,                    -- NULL = broadcast to all users
  subject    text        NOT NULL,
  body       text        NOT NULL,
  sent_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- ------------------------------------------------------------
-- marketplace_posts
-- ------------------------------------------------------------
CREATE TABLE public.marketplace_posts (
  id          uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid                 NOT NULL,
  title       text                 NOT NULL,
  description text                 NOT NULL,
  price       numeric,
  category    marketplace_category NOT NULL,
  images      jsonb                NOT NULL DEFAULT '[]'::jsonb,
  status      marketplace_status   NOT NULL DEFAULT 'active',
  created_at  timestamptz          NOT NULL DEFAULT now(),
  updated_at  timestamptz          NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TRIGGER marketplace_posts_updated_at
  BEFORE UPDATE ON public.marketplace_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bows               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_marks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrows             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_areas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warmup_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stretching_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_posts  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS Policies
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
CREATE POLICY "profiles: own row or admin can select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles: own row or admin can update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Inserts are handled by the handle_new_user trigger (SECURITY DEFINER).
-- Direct inserts are blocked unless it is the user's own row (e.g. service role).
CREATE POLICY "profiles: insert own row"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Deletions cascade from auth.users; direct deletes require admin.
CREATE POLICY "profiles: admin can delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- locations
-- ------------------------------------------------------------
CREATE POLICY "locations: authenticated users can select"
  ON public.locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "locations: admin can insert"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "locations: admin can update"
  ON public.locations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "locations: admin can delete"
  ON public.locations FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- bows
-- ------------------------------------------------------------
CREATE POLICY "bows: own rows or admin can select"
  ON public.bows FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "bows: insert own rows"
  ON public.bows FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bows: own rows or admin can update"
  ON public.bows FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "bows: own rows or admin can delete"
  ON public.bows FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());


-- ------------------------------------------------------------
-- scope_marks  (ownership is via bows.user_id)
-- ------------------------------------------------------------
CREATE POLICY "scope_marks: owner or admin can select"
  ON public.scope_marks FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bows
      WHERE bows.id = scope_marks.bow_id
        AND bows.user_id = auth.uid()
    )
  );

CREATE POLICY "scope_marks: owner can insert"
  ON public.scope_marks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bows
      WHERE bows.id = bow_id
        AND bows.user_id = auth.uid()
    )
  );

CREATE POLICY "scope_marks: owner or admin can update"
  ON public.scope_marks FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bows
      WHERE bows.id = scope_marks.bow_id
        AND bows.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bows
      WHERE bows.id = bow_id
        AND bows.user_id = auth.uid()
    )
  );

CREATE POLICY "scope_marks: owner or admin can delete"
  ON public.scope_marks FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bows
      WHERE bows.id = scope_marks.bow_id
        AND bows.user_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- arrows
-- ------------------------------------------------------------
CREATE POLICY "arrows: own rows or admin can select"
  ON public.arrows FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "arrows: insert own rows"
  ON public.arrows FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "arrows: own rows or admin can update"
  ON public.arrows FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "arrows: own rows or admin can delete"
  ON public.arrows FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());


-- ------------------------------------------------------------
-- bank_settings
-- ------------------------------------------------------------
CREATE POLICY "bank_settings: authenticated users can select"
  ON public.bank_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bank_settings: admin can insert"
  ON public.bank_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "bank_settings: admin can update"
  ON public.bank_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "bank_settings: admin can delete"
  ON public.bank_settings FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- scheduled_sessions
-- ------------------------------------------------------------
CREATE POLICY "scheduled_sessions: own rows or admin can select"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "scheduled_sessions: insert own rows"
  ON public.scheduled_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "scheduled_sessions: own rows or admin can update"
  ON public.scheduled_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "scheduled_sessions: own rows or admin can delete"
  ON public.scheduled_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());


-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
CREATE POLICY "payments: own rows or admin can select"
  ON public.payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "payments: insert own rows"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Status changes (confirm / reject) are admin-only.
-- Users can update their own payment only to upload a receipt.
CREATE POLICY "payments: own rows or admin can update"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Payments are not deleted; kept as audit trail.
-- Admins may delete in edge cases.
CREATE POLICY "payments: admin can delete"
  ON public.payments FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- training_sessions
-- ------------------------------------------------------------
CREATE POLICY "training_sessions: own rows or admin can select"
  ON public.training_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "training_sessions: insert own rows"
  ON public.training_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "training_sessions: own rows or admin can update"
  ON public.training_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "training_sessions: own rows or admin can delete"
  ON public.training_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());


-- ------------------------------------------------------------
-- rounds  (ownership via training_sessions.user_id)
-- ------------------------------------------------------------
CREATE POLICY "rounds: owner or admin can select"
  ON public.rounds FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = rounds.training_session_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "rounds: owner can insert"
  ON public.rounds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_session_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "rounds: owner or admin can update"
  ON public.rounds FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = rounds.training_session_id
        AND ts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_session_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "rounds: owner or admin can delete"
  ON public.rounds FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = rounds.training_session_id
        AND ts.user_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- round_scores  (ownership via rounds → training_sessions.user_id)
-- ------------------------------------------------------------
CREATE POLICY "round_scores: owner or admin can select"
  ON public.round_scores FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rounds r
      JOIN public.training_sessions ts ON ts.id = r.training_session_id
      WHERE r.id = round_scores.round_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "round_scores: owner can insert"
  ON public.round_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rounds r
      JOIN public.training_sessions ts ON ts.id = r.training_session_id
      WHERE r.id = round_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "round_scores: owner or admin can update"
  ON public.round_scores FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rounds r
      JOIN public.training_sessions ts ON ts.id = r.training_session_id
      WHERE r.id = round_scores.round_id
        AND ts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rounds r
      JOIN public.training_sessions ts ON ts.id = r.training_session_id
      WHERE r.id = round_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "round_scores: owner or admin can delete"
  ON public.round_scores FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rounds r
      JOIN public.training_sessions ts ON ts.id = r.training_session_id
      WHERE r.id = round_scores.round_id
        AND ts.user_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- improvement_areas  (ownership via training_sessions.user_id)
-- ------------------------------------------------------------
CREATE POLICY "improvement_areas: owner or admin can select"
  ON public.improvement_areas FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = improvement_areas.training_session_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "improvement_areas: owner can insert"
  ON public.improvement_areas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_session_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "improvement_areas: owner or admin can update"
  ON public.improvement_areas FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = improvement_areas.training_session_id
        AND ts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = training_session_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "improvement_areas: owner or admin can delete"
  ON public.improvement_areas FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      WHERE ts.id = improvement_areas.training_session_id
        AND ts.user_id = auth.uid()
    )
  );


-- ------------------------------------------------------------
-- warmup_plans
-- ------------------------------------------------------------
CREATE POLICY "warmup_plans: authenticated users can select"
  ON public.warmup_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "warmup_plans: admin can insert"
  ON public.warmup_plans FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "warmup_plans: admin can update"
  ON public.warmup_plans FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "warmup_plans: admin can delete"
  ON public.warmup_plans FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- stretching_plans
-- ------------------------------------------------------------
CREATE POLICY "stretching_plans: authenticated users can select"
  ON public.stretching_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "stretching_plans: admin can insert"
  ON public.stretching_plans FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "stretching_plans: admin can update"
  ON public.stretching_plans FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "stretching_plans: admin can delete"
  ON public.stretching_plans FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
-- Users see their own notifications + global broadcasts (user_id IS NULL).
CREATE POLICY "notifications: own or broadcast can select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL OR public.is_admin());

CREATE POLICY "notifications: admin can insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "notifications: admin can update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "notifications: admin can delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ------------------------------------------------------------
-- marketplace_posts
-- ------------------------------------------------------------
-- All authenticated users can read active posts; users always see their own.
CREATE POLICY "marketplace_posts: read active or own or admin"
  ON public.marketplace_posts FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR user_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "marketplace_posts: insert own rows"
  ON public.marketplace_posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "marketplace_posts: own rows or admin can update"
  ON public.marketplace_posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "marketplace_posts: own rows or admin can delete"
  ON public.marketplace_posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
