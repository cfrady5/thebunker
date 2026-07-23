-- ============================================================
-- 0005 Leagues, tournaments (as league category), instructors,
--      lessons & youth programs
-- ============================================================

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in (
    'mens', 'ladies', 'couples', 'youth', 'senior', 'business', 'church', 'open', 'tournament'
  )),
  description text,
  season text,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  day_of_week int check (day_of_week between 0 and 6),
  start_time time,
  capacity int check (capacity > 0),
  team_size int not null default 1 check (team_size between 1 and 8),
  price_cents int not null default 0 check (price_cents >= 0),
  status text not null default 'interest'
    check (status in ('interest', 'opening_soon', 'open', 'waitlist', 'full', 'in_progress', 'completed', 'cancelled')),
  rules text,
  featured_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leagues_status_idx on public.leagues (status);
create index leagues_category_idx on public.leagues (category);

create trigger leagues_updated_at
  before update on public.leagues
  for each row execute function public.set_updated_at();

create table public.league_teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  name text not null,
  captain_profile_id uuid references public.profiles (id) on delete set null,
  status text not null default 'forming' check (status in ('forming', 'complete', 'waitlist', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (league_id, name)
);

create table public.league_registrations (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid references public.league_teams (id) on delete set null,
  registration_type text not null default 'individual'
    check (registration_type in ('individual', 'team', 'free_agent')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'refunded')),
  amount_paid_cents int not null default 0,
  payment_id uuid references public.payments (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (league_id, profile_id)
);

create index league_registrations_league_idx on public.league_registrations (league_id, status);
create index league_registrations_profile_idx on public.league_registrations (profile_id);

create table public.league_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.league_teams (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  household_member_id uuid references public.household_members (id) on delete set null,
  invite_email text,
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined', 'removed')),
  created_at timestamptz not null default now()
);

create index league_team_members_team_idx on public.league_team_members (team_id);

create table public.league_schedules (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  week_number int not null check (week_number > 0),
  starts_at timestamptz not null,
  bay_id uuid references public.simulator_bays (id) on delete set null,
  home_team_id uuid references public.league_teams (id) on delete set null,
  away_team_id uuid references public.league_teams (id) on delete set null
);

create index league_schedules_league_idx on public.league_schedules (league_id, week_number);

create table public.league_results (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.league_schedules (id) on delete cascade,
  team_id uuid references public.league_teams (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  score numeric,
  points numeric,
  result_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index league_results_schedule_idx on public.league_results (schedule_id);

-- ------------------------------------------------------------
-- Instructors & programs (lessons, clinics, youth)
-- ------------------------------------------------------------
create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  display_name text not null,
  bio text,
  credentials text,
  specialties text[],
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null check (category in (
    'private_lesson', 'beginner_lesson', 'swing_evaluation', 'putting',
    'group_lesson', 'youth_clinic', 'junior_league', 'senior_play', 'other'
  )),
  description text,
  instructor_id uuid references public.instructors (id) on delete set null,
  age_min int check (age_min >= 0),
  age_max int check (age_max >= 0),
  skill_level text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int check (capacity > 0),
  price_cents int not null default 0 check (price_cents >= 0),
  duration_minutes int,
  what_to_bring text,
  status text not null default 'interest'
    check (status in ('interest', 'opening_soon', 'open', 'waitlist', 'full', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index programs_status_idx on public.programs (status);
create index programs_category_idx on public.programs (category);

create trigger programs_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

create table public.program_registrations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  household_member_id uuid references public.household_members (id) on delete set null,
  guardian_profile_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'waitlisted', 'cancelled', 'refunded')),
  payment_id uuid references public.payments (id) on delete set null,
  waiver_id uuid, -- FK added in 0007 after waiver_signatures exists
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  photo_consent boolean not null default false,
  created_at timestamptz not null default now()
);

create index program_registrations_program_idx on public.program_registrations (program_id, status);
create index program_registrations_profile_idx on public.program_registrations (profile_id);
