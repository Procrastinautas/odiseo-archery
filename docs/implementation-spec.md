# Odiseo Archery — Implementation Specification

> **Audience:** Coding agents performing implementation.
> **Language rule:** All code, variable names, and specs are in English. All user-facing text (labels, buttons, messages, placeholders, headings) must be in Spanish.
> **Agent rules:** See `docs/agents.md` for agent and developer guidance that enforces Spanish for user-facing text.
> **Skip:** Any requirement marked `[tbd]` in the baseline is out of scope.

---

## 1. Stack

| Layer           | Tool                                                      |
| --------------- | --------------------------------------------------------- |
| Framework       | Next.js 15 (App Router, TypeScript strict)                |
| Database & Auth | Supabase (Postgres + Auth + Storage)                      |
| Auth method     | Email/password only (no OAuth/SSO)                        |
| ORM / query     | Supabase JS client v2 (`@supabase/ssr`)                   |
| AI              | OpenAI API — server-side only (Server Actions)            |
| Email           | Resend                                                    |
| Styling         | Tailwind CSS v4 + shadcn/ui                               |
| Forms           | React Hook Form + Zod                                     |
| Data fetching   | SWR (client) + Server Components (server)                 |
| Hosting         | Vercel                                                    |
| Type generation | `supabase gen types typescript` → `src/types/database.ts` |

---

## 2. Authentication & Authorization

### Rules

- Auth is handled entirely by Supabase Auth (email/password).
- Session is stored in cookies using `@supabase/ssr`.
- `middleware.ts` at the project root protects all routes:
  - Unauthenticated user → redirect to `/login`
  - Authenticated user with `role = user` accessing `/admin/*` → redirect to `/dashboard`
- On successful sign-up or first login, if `profiles.name` is null → redirect to `/onboarding`.
- Role is stored in `profiles.role` (`admin` | `user`). Default for new sign-ups is `user`.

### Supabase Auth config

- Disable all OAuth providers.
- Enable email/password sign-in.
- Disable email confirmation for MVP (can be enabled later).

### Middleware pseudocode

```
1. Get session from Supabase cookie.
2. If no session AND path is not /login or /sign-up → redirect /login.
3. If session AND path starts with /admin → fetch profiles.role for uid.
4. If role != 'admin' → redirect /dashboard.
5. Otherwise continue.
```

---

## 3. Database Schema

Run the following SQL in the Supabase SQL editor to create the full schema.

### 3.1 Enable UUID extension

```sql
create extension if not exists "uuid-ossp";
```

### 3.2 profiles

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text not null,
  picture_url text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now()
);

-- Auto-create profile row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3.3 bows

```sql
create table public.bows (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  hand         text not null check (hand in ('left', 'right')),
  type         text not null check (type in ('recurve', 'compound', 'barebow')),
  draw_weight  numeric(5,2),
  notes        text,
  created_at   timestamptz not null default now()
);
```

### 3.4 scope_marks

```sql
create table public.scope_marks (
  id          uuid primary key default uuid_generate_v4(),
  bow_id      uuid not null references public.bows(id) on delete cascade,
  distance    int not null,
  mark_value  text not null,
  notes       text,
  created_at  timestamptz not null default now()
);
```

### 3.5 arrows

```sql
create table public.arrows (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  brand          text,
  diameter_mm    numeric(5,2),
  fletchings     text,
  shaft_material text,
  point_type     text,
  notes          text,
  created_at     timestamptz not null default now()
);
```

### 3.6 locations

```sql
create table public.locations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
```

### 3.7 bank_settings

```sql
create table public.bank_settings (
  id              uuid primary key default uuid_generate_v4(),
  bank_name       text not null,
  account_holder  text not null,
  account_number  text not null,
  account_type    text,
  instructions    text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references public.profiles(id)
);
```

### 3.8 scheduled_sessions

```sql
create table public.scheduled_sessions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  date                    date not null,
  time                    time not null,
  distance                int,
  location_id             uuid references public.locations(id),
  status                  text not null default 'pending'
                            check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  material_bow            boolean not null default false,
  material_arrows         boolean not null default false,
  material_karkaj         boolean not null default false,
  material_protection_gear boolean not null default false,
  material_weights        boolean not null default false,
  material_tap            boolean not null default false,
  notes                   text,
  admin_note              text,
  created_at              timestamptz not null default now()
);
```

### 3.9 payments

```sql
create table public.payments (
  id                    uuid primary key default uuid_generate_v4(),
  scheduled_session_id  uuid not null references public.scheduled_sessions(id) on delete cascade,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  receipt_url           text,
  status                text not null default 'pending'
                          check (status in ('pending', 'confirmed', 'rejected')),
  admin_note            text,
  created_at            timestamptz not null default now()
);
```

### 3.10 training_sessions

```sql
create table public.training_sessions (
  id                    uuid primary key default uuid_generate_v4(),
  scheduled_session_id  uuid references public.scheduled_sessions(id) on delete set null,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  weather               text check (weather in ('sunny', 'cloudy', 'rainy', 'heavy_rain', 'windy')),
  type                  text check (type in ('control', 'training', 'contest')),
  distance              int,
  start_time            timestamptz,
  end_time              timestamptz,
  target_size           text,
  bow_id                uuid references public.bows(id) on delete set null,
  arrow_id              uuid references public.arrows(id) on delete set null,
  new_gear_notes        text,
  physical_status       text,
  scoresheet_url        text,
  final_thoughts        text,
  ai_recap              text,
  ai_advice             text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
```

### 3.11 rounds

```sql
create table public.rounds (
  id                   uuid primary key default uuid_generate_v4(),
  training_session_id  uuid not null references public.training_sessions(id) on delete cascade,
  round_number         int not null,
  created_at           timestamptz not null default now()
);
```

### 3.12 round_scores

`data` jsonb shape per method:

- `manual`: `{ "arrows": [10, 9, 8, 7, 6, 5] }`
- `summary`: `{ "tens": 2, "xs": 1, "nines": 1, "below_8": 1, "misses": 1 }`
- `target_map`: `{ "arrows": [{ "x": 0.3, "y": -0.1, "score": 10 }, ...] }`

```sql
create table public.round_scores (
  id             uuid primary key default uuid_generate_v4(),
  round_id       uuid not null references public.rounds(id) on delete cascade,
  method         text not null check (method in ('manual', 'summary', 'target_map')),
  data           jsonb not null default '{}',
  total_score    int,
  tens           int,
  xs             int,
  nines          int,
  below_8_count  int,
  misses         int,
  created_at     timestamptz not null default now()
);
```

### 3.13 improvement_areas

```sql
create table public.improvement_areas (
  id                   uuid primary key default uuid_generate_v4(),
  training_session_id  uuid not null references public.training_sessions(id) on delete cascade,
  comment              text not null,
  attachment_url       text,
  created_at           timestamptz not null default now()
);
```

### 3.14 warmup_plans

```sql
create table public.warmup_plans (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
```

### 3.15 stretching_plans

```sql
create table public.stretching_plans (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
```

### 3.16 notifications

```sql
-- user_id NULL means broadcast to all users
create table public.notifications (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid references public.profiles(id) on delete cascade,
  subject   text not null,
  body      text not null,
  sent_at   timestamptz,
  created_at timestamptz not null default now()
);
```

### 3.17 marketplace_posts

```sql
create table public.marketplace_posts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  price       numeric(10,2),
  category    text not null check (category in ('bow', 'arrows', 'accessory', 'other')),
  images      jsonb not null default '[]',
  status      text not null default 'active' check (status in ('active', 'sold', 'removed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

---

## 4. Row Level Security (RLS)

Enable RLS on every table, then add policies.

```sql
-- Enable RLS
alter table public.profiles             enable row level security;
alter table public.bows                 enable row level security;
alter table public.scope_marks          enable row level security;
alter table public.arrows               enable row level security;
alter table public.locations            enable row level security;
alter table public.bank_settings        enable row level security;
alter table public.scheduled_sessions   enable row level security;
alter table public.payments             enable row level security;
alter table public.training_sessions    enable row level security;
alter table public.rounds               enable row level security;
alter table public.round_scores         enable row level security;
alter table public.improvement_areas    enable row level security;
alter table public.warmup_plans         enable row level security;
alter table public.stretching_plans     enable row level security;
alter table public.notifications        enable row level security;
alter table public.marketplace_posts    enable row level security;

-- Helper: is current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: users read/update own; admins read all
create policy "users read own profile"      on public.profiles for select using (auth.uid() = id);
create policy "users update own profile"    on public.profiles for update using (auth.uid() = id);
create policy "admins read all profiles"    on public.profiles for select using (public.is_admin());
create policy "admins update all profiles"  on public.profiles for update using (public.is_admin());

-- bows
create policy "users manage own bows"  on public.bows for all using (auth.uid() = user_id);
create policy "admins manage all bows" on public.bows for all using (public.is_admin());

-- scope_marks (access via bow ownership)
create policy "users manage own scope_marks" on public.scope_marks for all
  using (exists (select 1 from public.bows where id = bow_id and user_id = auth.uid()));
create policy "admins manage all scope_marks" on public.scope_marks for all using (public.is_admin());

-- arrows
create policy "users manage own arrows"  on public.arrows for all using (auth.uid() = user_id);
create policy "admins manage all arrows" on public.arrows for all using (public.is_admin());

-- locations: anyone authenticated can read; only admins write
create policy "authenticated read locations" on public.locations for select using (auth.role() = 'authenticated');
create policy "admins manage locations"      on public.locations for all using (public.is_admin());

-- bank_settings: anyone authenticated can read; only admins write
create policy "authenticated read bank_settings" on public.bank_settings for select using (auth.role() = 'authenticated');
create policy "admins manage bank_settings"      on public.bank_settings for all using (public.is_admin());

-- scheduled_sessions
create policy "users manage own sessions"   on public.scheduled_sessions for all using (auth.uid() = user_id);
create policy "admins manage all sessions"  on public.scheduled_sessions for all using (public.is_admin());

-- payments
create policy "users manage own payments"  on public.payments for all using (auth.uid() = user_id);
create policy "admins manage all payments" on public.payments for all using (public.is_admin());

-- training_sessions
create policy "users manage own training"  on public.training_sessions for all using (auth.uid() = user_id);
create policy "admins manage all training" on public.training_sessions for all using (public.is_admin());

-- rounds
create policy "users manage own rounds" on public.rounds for all
  using (exists (select 1 from public.training_sessions where id = training_session_id and user_id = auth.uid()));
create policy "admins manage all rounds" on public.rounds for all using (public.is_admin());

-- round_scores
create policy "users manage own round_scores" on public.round_scores for all
  using (exists (
    select 1 from public.rounds r
    join public.training_sessions ts on ts.id = r.training_session_id
    where r.id = round_id and ts.user_id = auth.uid()
  ));
create policy "admins manage all round_scores" on public.round_scores for all using (public.is_admin());

-- improvement_areas
create policy "users manage own improvement_areas" on public.improvement_areas for all
  using (exists (select 1 from public.training_sessions where id = training_session_id and user_id = auth.uid()));
create policy "admins manage all improvement_areas" on public.improvement_areas for all using (public.is_admin());

-- warmup_plans / stretching_plans: all authenticated read; only admins write
create policy "authenticated read warmup_plans"    on public.warmup_plans for select using (auth.role() = 'authenticated');
create policy "admins manage warmup_plans"         on public.warmup_plans for all using (public.is_admin());
create policy "authenticated read stretching_plans" on public.stretching_plans for select using (auth.role() = 'authenticated');
create policy "admins manage stretching_plans"      on public.stretching_plans for all using (public.is_admin());

-- notifications: users read own + broadcasts; admins manage all
create policy "users read own notifications" on public.notifications for select
  using (auth.uid() = user_id or user_id is null);
create policy "admins manage notifications" on public.notifications for all using (public.is_admin());

-- marketplace_posts: all authenticated can read active; users manage own; admins manage all
create policy "authenticated read active posts" on public.marketplace_posts for select
  using (auth.role() = 'authenticated' and status = 'active');
create policy "users manage own posts"   on public.marketplace_posts for all using (auth.uid() = user_id);
create policy "admins manage all posts"  on public.marketplace_posts for all using (public.is_admin());
```

---

## 5. Supabase Storage Buckets

Create these buckets in the Supabase dashboard (Storage → New bucket). All are **private** except where noted.

| Bucket name               | Public     | Purpose                            |
| ------------------------- | ---------- | ---------------------------------- |
| `avatars`                 | ✅ public  | User profile pictures              |
| `receipts`                | ❌ private | Payment receipt uploads            |
| `scoresheets`             | ❌ private | Training session scoresheet images |
| `marketplace`             | ✅ public  | Marketplace listing images         |
| `improvement-attachments` | ❌ private | Improvement area attachments       |

Storage RLS policies (via Supabase dashboard or SQL):

- `avatars`: anyone can read; user can upload/update only their own path (`avatars/{uid}/*`)
- `receipts`: user can upload/read only their own path (`receipts/{uid}/*`); admins read all
- `scoresheets`: user manages their own path; admins read all
- `marketplace`: anyone can read; user manages their own path
- `improvement-attachments`: user manages their own path; admins read all

---

## 6. Project Structure

```
odiseo-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   ├── (user)/
│   │   │   ├── layout.tsx               ← BottomNav + auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── profile/edit/page.tsx
│   │   │   ├── sessions/page.tsx
│   │   │   ├── sessions/new/page.tsx
│   │   │   ├── sessions/[id]/page.tsx
│   │   │   ├── sessions/[id]/pay/page.tsx
│   │   │   ├── training/page.tsx
│   │   │   ├── training/new/page.tsx
│   │   │   ├── training/[id]/page.tsx
│   │   │   ├── training/[id]/round/[roundId]/page.tsx
│   │   │   ├── training/[id]/summary/page.tsx
│   │   │   ├── stats/page.tsx
│   │   │   ├── marketplace/page.tsx
│   │   │   ├── marketplace/new/page.tsx
│   │   │   └── marketplace/[id]/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx               ← AdminSidebar + admin guard
│   │   │   ├── admin/page.tsx
│   │   │   ├── admin/users/page.tsx
│   │   │   ├── admin/users/[id]/page.tsx
│   │   │   ├── admin/sessions/page.tsx
│   │   │   ├── admin/sessions/[id]/page.tsx
│   │   │   ├── admin/training/[id]/page.tsx
│   │   │   ├── admin/plans/warmup/page.tsx
│   │   │   ├── admin/plans/stretching/page.tsx
│   │   │   ├── admin/marketplace/page.tsx
│   │   │   ├── admin/notifications/page.tsx
│   │   │   ├── admin/settings/banking/page.tsx
│   │   │   └── admin/settings/locations/page.tsx
│   │   ├── api/
│   │   │   └── (no stripe — minimal API routes needed)
│   │   ├── layout.tsx                   ← root layout, font, metadata
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          ← shadcn/ui generated components
│   │   ├── archer-card/
│   │   │   └── ArcherCard.tsx           ← baseball-card style profile component
│   │   ├── session/
│   │   │   ├── SessionCard.tsx
│   │   │   ├── SessionForm.tsx
│   │   │   └── MaterialChecklist.tsx
│   │   ├── training/
│   │   │   ├── TrainingForm.tsx         ← auto-save enabled
│   │   │   ├── RoundForm.tsx
│   │   │   ├── ScoreInput.tsx           ← handles manual / summary / target_map
│   │   │   └── AIAdviceBanner.tsx
│   │   ├── marketplace/
│   │   │   ├── ListingCard.tsx
│   │   │   └── ListingForm.tsx
│   │   └── layout/
│   │       ├── BottomNav.tsx            ← Inicio/Sesiones/Entrenamiento/Estadísticas/Perfil
│   │       ├── AdminSidebar.tsx
│   │       └── PageHeader.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                ← createBrowserClient
│   │   │   └── server.ts                ← createServerClient (cookies)
│   │   ├── openai.ts                    ← server-only OpenAI wrapper
│   │   ├── email.ts                     ← Resend wrapper
│   │   └── utils.ts
│   ├── actions/                         ← Next.js Server Actions
│   │   ├── auth.ts
│   │   ├── profile.ts
│   │   ├── sessions.ts
│   │   ├── training.ts
│   │   ├── payments.ts
│   │   ├── ai.ts
│   │   ├── notifications.ts
│   │   ├── marketplace.ts
│   │   └── admin.ts
│   ├── types/
│   │   └── database.ts                  ← generated by supabase gen types
│   └── middleware.ts
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 7. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>      # server-only, never expose to client
OPENAI_API_KEY=<openai-key>                        # server-only
RESEND_API_KEY=<resend-key>                        # server-only
```

---

## 8. Screen Inventory & Responsibilities

### Public / Auth

| Route         | Component responsibilities                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/login`      | Email + password form. On success → `/dashboard`. Link to `/sign-up`.                                               |
| `/sign-up`    | Name + email + password form. Creates Supabase auth user → trigger creates `profiles` row → redirect `/onboarding`. |
| `/onboarding` | Complete profile: upload picture, add first bow. Can be skipped; accessible again from profile edit.                |

### User — Layout

- `(user)/layout.tsx` renders `<BottomNav />` with 5 tabs: **Inicio / Sesiones / Entrenamiento / Estadísticas / Perfil**
- Validates auth on render; unauthenticated → redirect `/login`

### User — Screens

| Route                            | Key responsibilities                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`                     | Render `<ArcherCard />`, card for next upcoming session, stats strip (total sessions, total arrows). CTA: "Iniciar sesión" (starts unscheduled training) or "Ver sesión" if one is confirmed today.                                                                                                                                     |
| `/profile`                       | `<ArcherCard />` full view. List of bows (with scope marks). List of arrows. Button → `/profile/edit`.                                                                                                                                                                                                                                  |
| `/profile/edit`                  | Edit name, picture (upload to `avatars` bucket). Add/edit/delete bows and their scope marks. Add/edit/delete arrows.                                                                                                                                                                                                                    |
| `/sessions`                      | Tabs: proximas / pasadas. Each row: date, location, status badge, CTA.                                                                                                                                                                                                                                                                  |
| `/sessions/new`                  | Form: date, time, distance, location (dropdown from `locations`), materials checklist, notes. Submit → creates `scheduled_sessions` row with `status = pending`.                                                                                                                                                                        |
| `/sessions/[id]`                 | Shows all session details + status badge + admin note. If `status = confirmed` → show "Pagar" button and "Iniciar entrenamiento" button. If `status = pending` → show "Cancelar" button. Polls every 30s while status is pending/confirmed (SWR `refreshInterval`).                                                                     |
| `/sessions/[id]/pay`             | Displays `bank_settings` info. File upload for receipt → uploads to `receipts/{uid}/{sessionId}` Storage → creates/updates `payments` row.                                                                                                                                                                                              |
| `/training`                      | List of all training sessions, newest first. Each card: date, type, total score, total arrows.                                                                                                                                                                                                                                          |
| `/training/new`                  | Start form (not linked to a scheduled session). Same form as training session start: weather, type, bow, arrows, physical status, distance. Creates `training_sessions` row on submit, redirects to `/training/[id]`.                                                                                                                   |
| `/training/[id]`                 | Main training session editor. Shows `<AIAdviceBanner />` (ai_advice text + "Actualizar" button). All session fields editable with auto-save (1500ms debounce). List of rounds with scores. Improvement areas list (add/edit/delete). "Finalizar" button triggers `getSessionRecap` AI action and redirects to `/training/[id]/summary`. |
| `/training/[id]/round/[roundId]` | Log a round. Method selector: Manual (per-arrow) / Resumen (counts) / Mapa de blanco (target map). Form varies by method. On save → upserts `round_scores`, computed totals stored.                                                                                                                                                     |
| `/training/[id]/summary`         | Read-only. Total score, total arrows, instructor(s), areas to improve list. `ai_recap` text block. Score-per-round bar chart (recharts or similar).                                                                                                                                                                                     |
| `/stats`                         | Aggregate stats from `training_sessions` + `round_scores`: total sessions, total arrows, average score per session, average grouping.                                                                                                                                                                                                   |
| `/marketplace`                   | Grid of `<ListingCard />` for `status = active` posts. Filter by category.                                                                                                                                                                                                                                                              |
| `/marketplace/new`               | Form: title, description, price (optional), category, up to 5 image uploads → `marketplace` bucket.                                                                                                                                                                                                                                     |
| `/marketplace/[id]`              | Full listing detail. Contact seller info (name only — no in-app messaging). Owner sees "Marcar como vendido" and "Eliminar" buttons.                                                                                                                                                                                                    |

### Admin — Layout

- `(admin)/layout.tsx` renders `<AdminSidebar />`.
- Validates `profiles.role = 'admin'`; otherwise redirect `/dashboard`.

### Admin — Screens

| Route                       | Key responsibilities                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin`                    | Dashboard cards: pending sessions count, unconfirmed payments count, latest 5 activity items.                                                                                                            |
| `/admin/users`              | Searchable list of all users. Each row shows `<ArcherCard />` mini preview, name, email, role badge.                                                                                                     |
| `/admin/users/[id]`         | Full `<ArcherCard />` for the user. Their bows, arrows, scheduled sessions list, training history.                                                                                                       |
| `/admin/sessions`           | Table of all `scheduled_sessions`. Filter by status, date range, user.                                                                                                                                   |
| `/admin/sessions/[id]`      | Full session detail. Buttons: Confirmar / Declinar. Text field for `admin_note`. Edit all session fields. View payment receipt (if uploaded) with link to Storage URL. Confirm / Reject payment buttons. |
| `/admin/training/[id]`      | Full training session editor (same form as user `/training/[id]` but scoped to any user). Can edit all fields, add/remove rounds and improvement areas.                                                  |
| `/admin/plans/warmup`       | CRUD list of `warmup_plans`. Form: title + rich text / markdown description.                                                                                                                             |
| `/admin/plans/stretching`   | CRUD list of `stretching_plans`. Same form as warmup.                                                                                                                                                    |
| `/admin/marketplace`        | Table of all posts. Can mark as sold or remove any post.                                                                                                                                                 |
| `/admin/notifications`      | Compose form: subject, body, recipient (all users or specific user dropdown). On submit → inserts `notifications` row + triggers Resend email.                                                           |
| `/admin/settings/banking`   | Form to view and update `bank_settings` row. Single row (upsert).                                                                                                                                        |
| `/admin/settings/locations` | List of locations. Toggle active/inactive. Add new location.                                                                                                                                             |

---

## 9. Key Implementation Patterns

### 9.1 Supabase client setup

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) =>
          c.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          ),
      },
    },
  );
}
```

### 9.2 Middleware

```ts
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (c) =>
          c.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/sign-up");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 9.3 Auto-save pattern (training sessions)

```ts
// Inside TrainingForm.tsx
const { watch } = useForm({ defaultValues: session });
const debouncedSave = useDebouncedCallback(async (values) => {
  await upsertTrainingSession(values); // Server Action
}, 1500);
useEffect(() => {
  const subscription = watch((values) => debouncedSave(values));
  return () => subscription.unsubscribe();
}, [watch]);
```

### 9.4 AI Server Actions

```ts
// src/actions/ai.ts
"use server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getTrainingAdvice(userId: string) {
  const supabase = await createClient();
  // Fetch last 10 sessions with scores
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("*, rounds(round_scores(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const prompt = buildAdvicePrompt(sessions); // format data into a structured prompt
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  const advice = completion.choices[0].message.content;

  // Store result — will be read by the UI
  await supabase
    .from("training_sessions")
    .update({ ai_advice: advice })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  return advice;
}
```

### 9.5 Email (Resend)

```ts
// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: "Odiseo Archery <no-reply@yourdomain.com>",
    to,
    subject,
    html,
  });
}
```

---

## 10. Implementation Order (Phased)

### Phase 1 — Foundation

1. Initialize Next.js 15 project with TypeScript + Tailwind + shadcn/ui
2. Set up Supabase project, run full DB schema SQL (Section 3)
3. Enable RLS and apply all policies (Section 4)
4. Create Storage buckets (Section 5)
5. Configure `@supabase/ssr`, implement `client.ts`, `server.ts`, `middleware.ts`
6. Run `supabase gen types typescript` → `src/types/database.ts`
7. Build `/login`, `/sign-up` pages with email/password auth forms
8. Build `/onboarding` page

### Phase 2 — User Profile & Equipment

9. Build `<ArcherCard />` component
10. Build `/profile` and `/profile/edit` (bows, scope marks, arrows CRUD)
11. Avatar upload to `avatars` bucket

### Phase 3 — Session Scheduling

12. Build `/sessions`, `/sessions/new`, `/sessions/[id]`
13. Build `/sessions/[id]/pay` (bank info display + receipt upload)
14. Polling via SWR on session detail page

### Phase 4 — Training Sessions

15. Build `/training`, `/training/new`, `/training/[id]` with auto-save
16. Build `/training/[id]/round/[roundId]` with `<ScoreInput />` (all 3 methods)
17. Build `/training/[id]/summary` with score chart

### Phase 5 — Stats, Marketplace

18. Build `/stats` with aggregate queries
19. Build `/marketplace`, `/marketplace/new`, `/marketplace/[id]`

### Phase 6 — AI

20. Implement `getTrainingAdvice` and `getSessionRecap` Server Actions
21. Integrate `<AIAdviceBanner />` into training session page

### Phase 7 — Admin Panel

22. Build admin layout + sidebar
23. Build all `/admin/*` pages in order: dashboard → users → sessions → training → plans → marketplace → notifications → settings

### Phase 8 — Notifications

24. Implement Resend email sending from admin notification page
25. Trigger emails on session confirm/decline and payment confirm/reject

---

## 11. Acceptance Checklist

- [ ] Auth: sign-up creates `profiles` row via trigger; login/logout works
- [ ] Onboarding: first login (no `profiles.name`) → redirects to `/onboarding`
- [ ] RLS: User A cannot read or write User B's sessions, training, or payments
- [ ] Admin guard: non-admin user hitting `/admin/*` → redirect `/dashboard`
- [ ] Session scheduling: creates `pending` row; appears in `/admin/sessions`
- [ ] Admin confirms session → user sees `confirmed` status within next poll cycle
- [ ] Payment: user uploads receipt → admin can view + confirm/reject
- [ ] Auto-save: debounced upsert fires on training form field change
- [ ] AI advice and recap stored in `training_sessions` after trigger
- [ ] Email sent on session confirmed/declined and payment confirmed/rejected
- [ ] `<ArcherCard />` renders correctly on `/profile` and `/admin/users/[id]`
- [ ] All user-facing text is in Spanish
