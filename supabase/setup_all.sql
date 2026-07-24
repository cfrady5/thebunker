-- ============================================================
-- The Bunker — one-shot database setup
-- Generated from supabase/migrations/0001–0011 + seed.sql.
-- Paste this entire file into the Supabase SQL Editor and run
-- it once on a fresh project. Safe order is preserved.
-- ============================================================

-- ------------------------------------------------------------
-- supabase/migrations/0001_foundation.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0001 Foundation: extensions, helpers, identity, settings
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- Reusable updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  phone text,
  avatar_url text,
  date_of_birth date,
  handedness text check (handedness in ('left', 'right', 'either')),
  skill_level text check (skill_level in ('new', 'beginner', 'intermediate', 'advanced', 'competitive')),
  accessibility_notes text,
  marketing_email_consent boolean not null default false,
  marketing_sms_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_idx on public.profiles (lower(email));
create index profiles_auth_user_idx on public.profiles (auth_user_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Staff roles
-- ------------------------------------------------------------
create table public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'front_desk', 'instructor', 'kitchen', 'marketing')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_id, role)
);

create index staff_roles_profile_idx on public.staff_roles (profile_id) where active;

-- Server-side role helpers (used by RLS policies)
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

create or replace function public.has_staff_role(roles text[])
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.staff_roles sr
    join public.profiles p on p.id = sr.profile_id
    where p.auth_user_id = auth.uid()
      and sr.active
      and sr.role = any (roles)
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.has_staff_role(array['owner','manager','front_desk','instructor','kitchen','marketing']);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.has_staff_role(array['owner','manager']);
$$;

-- ------------------------------------------------------------
-- Households
-- ------------------------------------------------------------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index households_owner_idx on public.households (owner_profile_id);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  relationship text check (relationship in ('self', 'spouse', 'partner', 'child', 'dependent', 'other')),
  guardian_profile_id uuid references public.profiles (id) on delete set null,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index household_members_household_idx on public.household_members (household_id);

-- ------------------------------------------------------------
-- Site settings (business mode, hero copy, contact info, ...)
-- ------------------------------------------------------------
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Notifications (in-app)
-- ------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_profile_idx on public.notifications (profile_id, created_at desc);

-- ------------------------------------------------------------
-- Audit log
-- ------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ------------------------------------------------------------
-- supabase/migrations/0002_facility.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0002 Facility: bays, hours, blackouts, pricing rules
-- ============================================================

create table public.simulator_bays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  capacity int not null default 6 check (capacity between 1 and 12),
  active boolean not null default true,
  accessible boolean not null default false,
  supports_left_handed boolean not null default true,
  sort_order int not null default 0,
  maintenance_status text not null default 'operational'
    check (maintenance_status in ('operational', 'degraded', 'offline')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger simulator_bays_updated_at
  before update on public.simulator_bays
  for each row execute function public.set_updated_at();

-- Weekly recurring hours. Multiple date-bounded rows allow seasonal schedules.
create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  opens_at time not null,
  closes_at time not null,
  active boolean not null default true,
  effective_from date,
  effective_to date,
  check (closes_at > opens_at)
);

create index business_hours_day_idx on public.business_hours (day_of_week) where active;

-- Date-specific overrides (holidays, special schedules)
create table public.special_hours (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  reason text
);

create table public.bay_blackouts (
  id uuid primary key default gen_random_uuid(),
  bay_id uuid references public.simulator_bays (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  blackout_type text not null default 'maintenance'
    check (blackout_type in ('maintenance', 'private_event', 'league', 'staff_hold', 'other')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index bay_blackouts_range_idx on public.bay_blackouts using gist (bay_id, tstzrange(starts_at, ends_at));

-- Time-of-day / day-of-week pricing. Highest priority match wins.
create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text not null default 'bay_rental'
    check (service_type in ('bay_rental', 'lesson', 'league', 'event')),
  day_of_week int check (day_of_week between 0 and 6), -- null = any day
  starts_at time, -- null = all day
  ends_at time,
  price_per_unit_cents int not null check (price_per_unit_cents >= 0),
  billing_unit_minutes int not null default 30 check (billing_unit_minutes > 0),
  membership_plan_id uuid, -- FK added after membership_plans exists
  effective_from date,
  effective_to date,
  priority int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index pricing_rules_lookup_idx on public.pricing_rules (service_type, active, priority desc);

-- ------------------------------------------------------------
-- supabase/migrations/0003_bookings_payments.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0003 Bookings, holds, payments, refunds
-- ============================================================

-- Short-lived holds taken during checkout. A hold reserves a slot
-- while the customer completes payment (8–10 minutes).
create table public.booking_holds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  session_token text not null,
  bay_id uuid not null references public.simulator_bays (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'converted', 'expired', 'released')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index booking_holds_bay_range_idx
  on public.booking_holds using gist (bay_id, tstzrange(starts_at, ends_at));
create index booking_holds_token_idx on public.booking_holds (session_token);
create index booking_holds_expiry_idx on public.booking_holds (expires_at) where status = 'active';

-- Active holds on the same bay may not overlap.
alter table public.booking_holds
  add constraint booking_holds_no_overlap
  exclude using gist (bay_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status = 'active');

-- ------------------------------------------------------------
-- Bookings
-- ------------------------------------------------------------
create sequence public.booking_number_seq start 1000;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique
    default 'BK-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.booking_number_seq')::text, 5, '0'),
  profile_id uuid references public.profiles (id) on delete set null,
  guest_email text,
  bay_id uuid not null references public.simulator_bays (id) on delete restrict,
  booking_type text not null default 'bay_rental'
    check (booking_type in ('bay_rental', 'lesson', 'league', 'youth_program', 'private_event', 'walk_in', 'staff_block')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  player_count int not null default 1 check (player_count between 1 and 12),
  status text not null default 'draft' check (status in (
    'draft', 'held', 'payment_pending', 'confirmed', 'checked_in', 'completed',
    'cancelled_by_customer', 'cancelled_by_staff', 'no_show',
    'refunded', 'partially_refunded', 'expired'
  )),
  subtotal_cents int not null default 0 check (subtotal_cents >= 0),
  tax_cents int not null default 0 check (tax_cents >= 0),
  discount_cents int not null default 0 check (discount_cents >= 0),
  credit_applied_cents int not null default 0 check (credit_applied_cents >= 0),
  total_cents int not null default 0 check (total_cents >= 0),
  currency text not null default 'usd',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  notes text,
  first_time_guest boolean not null default false,
  club_rental_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (profile_id is not null or guest_email is not null or booking_type in ('staff_block', 'walk_in'))
);

create index bookings_bay_range_idx
  on public.bookings using gist (bay_id, tstzrange(starts_at, ends_at));
create index bookings_profile_idx on public.bookings (profile_id, starts_at desc);
create index bookings_status_idx on public.bookings (status);
create index bookings_starts_idx on public.bookings (starts_at);
create index bookings_stripe_pi_idx on public.bookings (stripe_payment_intent_id);
create index bookings_stripe_cs_idx on public.bookings (stripe_checkout_session_id);

-- Bookings occupying a bay may not overlap. Terminal states are excluded.
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (bay_id with =, tstzrange(starts_at, ends_at) with &&)
  where (status in ('held', 'payment_pending', 'confirmed', 'checked_in'));

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.booking_participants (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  household_member_id uuid references public.household_members (id) on delete set null,
  name text not null,
  waiver_status text not null default 'pending' check (waiver_status in ('pending', 'signed', 'not_required'))
);

create index booking_participants_booking_idx on public.booking_participants (booking_id);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index booking_status_history_booking_idx on public.booking_status_history (booking_id, created_at);

-- Record every status transition automatically.
create or replace function public.log_booking_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_status_history (booking_id, previous_status, new_status, changed_by)
    values (new.id, null, new.status, public.current_profile_id());
  elsif new.status is distinct from old.status then
    insert into public.booking_status_history (booking_id, previous_status, new_status, changed_by)
    values (new.id, old.status, new.status, public.current_profile_id());
  end if;
  return new;
end;
$$;

create trigger bookings_status_history
  after insert or update on public.bookings
  for each row execute function public.log_booking_status_change();

-- ------------------------------------------------------------
-- Payments and refunds
-- ------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  payment_type text not null default 'booking'
    check (payment_type in ('booking', 'membership', 'league', 'program', 'event', 'gift_card', 'other')),
  stripe_payment_intent_id text,
  stripe_charge_id text,
  created_at timestamptz not null default now()
);

create index payments_profile_idx on public.payments (profile_id, created_at desc);
create index payments_booking_idx on public.payments (booking_id);
create unique index payments_stripe_pi_idx on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete restrict,
  amount_cents int not null check (amount_cents > 0),
  reason text,
  stripe_refund_id text,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index refunds_payment_idx on public.refunds (payment_id);

-- ------------------------------------------------------------
-- supabase/migrations/0004_memberships.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0004 Membership plans, memberships, minute ledger
-- ============================================================

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  price_cents int not null default 0 check (price_cents >= 0),
  stripe_price_id text,
  included_minutes int not null default 0 check (included_minutes >= 0),
  rollover_rule text not null default 'none' check (rollover_rule in ('none', 'one_period', 'unlimited')),
  booking_window_days int not null default 7 check (booking_window_days >= 0),
  discount_percentage int not null default 0 check (discount_percentage between 0 and 100),
  household_eligible boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pricing_rules
  add constraint pricing_rules_membership_plan_fk
  foreign key (membership_plan_id) references public.membership_plans (id) on delete cascade;

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  household_id uuid references public.households (id) on delete set null,
  plan_id uuid not null references public.membership_plans (id) on delete restrict,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete'
    check (status in ('incomplete', 'trialing', 'active', 'paused', 'past_due', 'cancelled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  included_minutes_remaining int not null default 0 check (included_minutes_remaining >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index memberships_profile_idx on public.memberships (profile_id);
create index memberships_status_idx on public.memberships (status);
create index memberships_stripe_customer_idx on public.memberships (stripe_customer_id);

create trigger memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

create table public.membership_ledger (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  transaction_type text not null
    check (transaction_type in ('grant', 'debit', 'refund', 'rollover', 'adjustment', 'expiry')),
  minutes int not null,
  booking_id uuid references public.bookings (id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);

create index membership_ledger_membership_idx on public.membership_ledger (membership_id, created_at desc);

-- ------------------------------------------------------------
-- supabase/migrations/0005_leagues_programs.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- supabase/migrations/0006_events_menu_private_events.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0006 Events, Highland Stage, menu, private event inquiries
-- ============================================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null check (category in (
    'highland_stage', 'community', 'golf', 'tournament', 'youth', 'league',
    'watch_party', 'fundraiser', 'seasonal', 'private'
  )),
  excerpt text,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default 'The Bunker — Linton, Indiana',
  capacity int check (capacity > 0),
  price_cents int check (price_cents >= 0), -- null = free
  registration_required boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  image_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_starts_idx on public.events (starts_at);
create index events_status_idx on public.events (status) where status = 'published';
create index events_category_idx on public.events (category);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  guest_count int not null default 0 check (guest_count >= 0),
  status text not null default 'confirmed'
    check (status in ('confirmed', 'waitlisted', 'cancelled')),
  payment_id uuid references public.payments (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index event_registrations_event_idx on public.event_registrations (event_id, status);

-- ------------------------------------------------------------
-- Menu
-- ------------------------------------------------------------
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  active boolean not null default true
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  image_url text,
  dietary_labels text[] not null default '{}',
  allergen_notes text,
  available boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_category_idx on public.menu_items (category_id, sort_order);
create index menu_items_featured_idx on public.menu_items (featured) where featured;

create trigger menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Private event inquiries
-- ------------------------------------------------------------
create table public.private_event_inquiries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  contact_name text not null,
  organization text,
  email text not null,
  phone text,
  event_type text not null,
  preferred_date date,
  alternate_date date,
  preferred_time text,
  guest_count int check (guest_count > 0),
  bay_count int check (bay_count > 0),
  food_and_drink_needs text,
  budget_range text,
  accessibility_needs text,
  notes text,
  status text not null default 'new' check (status in (
    'new', 'contacted', 'qualified', 'proposal_sent', 'tentative_hold', 'confirmed', 'completed', 'lost'
  )),
  assigned_to uuid references public.profiles (id) on delete set null,
  internal_notes text,
  follow_up_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index private_event_inquiries_status_idx on public.private_event_inquiries (status, created_at desc);

create trigger private_event_inquiries_updated_at
  before update on public.private_event_inquiries
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- supabase/migrations/0007_giftcards_waivers_content.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0007 Gift cards, credits, waivers, discounts, opening
--      updates, interest submissions
-- ============================================================

create table public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  -- Only a hash of the code is stored; the raw code is shown once
  -- to the purchaser/recipient and validated by hashing.
  code_hash text not null unique,
  code_last4 text not null,
  purchaser_profile_id uuid references public.profiles (id) on delete set null,
  recipient_name text,
  recipient_email text,
  original_balance_cents int not null check (original_balance_cents > 0),
  remaining_balance_cents int not null check (remaining_balance_cents >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'active', 'depleted', 'disabled')),
  delivery_date date,
  personal_message text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  check (remaining_balance_cents <= original_balance_cents)
);

create index gift_cards_recipient_idx on public.gift_cards (recipient_email);
create index gift_cards_status_idx on public.gift_cards (status);

create table public.gift_card_transactions (
  id uuid primary key default gen_random_uuid(),
  gift_card_id uuid not null references public.gift_cards (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  amount_cents int not null, -- negative = redemption, positive = load/refund
  transaction_type text not null
    check (transaction_type in ('purchase', 'redemption', 'refund', 'adjustment')),
  created_at timestamptz not null default now()
);

create index gift_card_transactions_card_idx on public.gift_card_transactions (gift_card_id, created_at);

-- Account credits (refund-to-credit, promotional, admin-issued)
create table public.account_credits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents int not null, -- negative = spend
  credit_type text not null
    check (credit_type in ('refund', 'promotional', 'admin', 'membership', 'spend')),
  booking_id uuid references public.bookings (id) on delete set null,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index account_credits_profile_idx on public.account_credits (profile_id, created_at desc);

-- ------------------------------------------------------------
-- Waivers
-- ------------------------------------------------------------
create table public.waiver_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version int not null default 1,
  content text not null,
  active boolean not null default true,
  effective_at timestamptz not null default now(),
  unique (name, version)
);

create table public.waiver_signatures (
  id uuid primary key default gen_random_uuid(),
  waiver_template_id uuid not null references public.waiver_templates (id) on delete restrict,
  profile_id uuid references public.profiles (id) on delete set null,
  household_member_id uuid references public.household_members (id) on delete set null,
  signed_name text not null,
  guardian_profile_id uuid references public.profiles (id) on delete set null,
  ip_address text,
  user_agent text,
  signed_at timestamptz not null default now(),
  check (profile_id is not null or household_member_id is not null)
);

create index waiver_signatures_profile_idx on public.waiver_signatures (profile_id);
create index waiver_signatures_member_idx on public.waiver_signatures (household_member_id);

alter table public.program_registrations
  add constraint program_registrations_waiver_fk
  foreign key (waiver_id) references public.waiver_signatures (id) on delete set null;

-- ------------------------------------------------------------
-- Discount codes
-- ------------------------------------------------------------
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  value int not null check (value > 0), -- percent (1-100) or cents
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int check (usage_limit > 0),
  usage_count int not null default 0 check (usage_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index discount_codes_code_idx on public.discount_codes (upper(code)) where active;

-- ------------------------------------------------------------
-- Opening updates (pre-launch news feed)
-- ------------------------------------------------------------
create table public.opening_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  image_url text,
  published_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opening_updates_published_idx on public.opening_updates (published_at desc)
  where status = 'published';

create trigger opening_updates_updated_at
  before update on public.opening_updates
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Opening list / interest submissions
-- ------------------------------------------------------------
create table public.interest_submissions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  interests text[] not null default '{}',
  email_consent boolean not null default false,
  sms_consent boolean not null default false,
  source text,
  created_at timestamptz not null default now()
);

create unique index interest_submissions_email_idx on public.interest_submissions (lower(email));

-- ------------------------------------------------------------
-- supabase/migrations/0008_rpc.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0008 RPC functions: booking holds, hold conversion, cleanup
-- ============================================================

-- Creates a checkout hold on a bay/time slot. Concurrency-safe:
-- runs in a single transaction, takes a per-bay advisory lock,
-- expires stale holds, then relies on exclusion constraints as
-- the final guarantee against double booking.
create or replace function public.create_booking_hold(
  p_bay_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_session_token text,
  p_hold_minutes int default 10
)
returns public.booking_holds
language plpgsql
security definer set search_path = public
as $$
declare
  v_hold public.booking_holds;
begin
  if p_ends_at <= p_starts_at then
    raise exception 'INVALID_RANGE';
  end if;
  if p_hold_minutes < 1 or p_hold_minutes > 15 then
    raise exception 'INVALID_HOLD_DURATION';
  end if;

  -- Serialize hold creation per bay.
  perform pg_advisory_xact_lock(hashtext(p_bay_id::text));

  -- Expire stale holds so they do not block availability.
  update public.booking_holds
  set status = 'expired'
  where bay_id = p_bay_id and status = 'active' and expires_at < now();

  -- Release any prior active hold for this checkout session.
  update public.booking_holds
  set status = 'released'
  where session_token = p_session_token and status = 'active';

  -- Reject if a live booking overlaps.
  if exists (
    select 1 from public.bookings b
    where b.bay_id = p_bay_id
      and b.status in ('held', 'payment_pending', 'confirmed', 'checked_in')
      and tstzrange(b.starts_at, b.ends_at) && tstzrange(p_starts_at, p_ends_at)
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  -- Reject if a bay blackout overlaps.
  if exists (
    select 1 from public.bay_blackouts bb
    where (bb.bay_id = p_bay_id or bb.bay_id is null)
      and tstzrange(bb.starts_at, bb.ends_at) && tstzrange(p_starts_at, p_ends_at)
  ) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  begin
    insert into public.booking_holds (profile_id, session_token, bay_id, starts_at, ends_at, expires_at)
    values (
      public.current_profile_id(),
      p_session_token,
      p_bay_id,
      p_starts_at,
      p_ends_at,
      now() + make_interval(mins => p_hold_minutes)
    )
    returning * into v_hold;
  exception
    when exclusion_violation then
      raise exception 'SLOT_UNAVAILABLE';
  end;

  return v_hold;
end;
$$;

-- Converts an active hold into a payment_pending booking.
create or replace function public.convert_hold_to_booking(
  p_hold_id uuid,
  p_session_token text,
  p_profile_id uuid,
  p_guest_email text,
  p_booking_type text,
  p_player_count int,
  p_subtotal_cents int,
  p_tax_cents int,
  p_discount_cents int,
  p_credit_applied_cents int,
  p_total_cents int,
  p_notes text default null,
  p_first_time_guest boolean default false,
  p_club_rental_required boolean default false
)
returns public.bookings
language plpgsql
security definer set search_path = public
as $$
declare
  v_hold public.booking_holds;
  v_booking public.bookings;
begin
  select * into v_hold
  from public.booking_holds
  where id = p_hold_id
    and session_token = p_session_token
    and status = 'active'
  for update;

  if not found then
    raise exception 'HOLD_NOT_FOUND';
  end if;
  if v_hold.expires_at < now() then
    update public.booking_holds set status = 'expired' where id = v_hold.id;
    raise exception 'HOLD_EXPIRED';
  end if;

  update public.booking_holds set status = 'converted' where id = v_hold.id;

  insert into public.bookings (
    profile_id, guest_email, bay_id, booking_type, starts_at, ends_at,
    player_count, status, subtotal_cents, tax_cents, discount_cents,
    credit_applied_cents, total_cents, notes, first_time_guest, club_rental_required
  )
  values (
    p_profile_id, p_guest_email, v_hold.bay_id, p_booking_type,
    v_hold.starts_at, v_hold.ends_at, p_player_count, 'payment_pending',
    p_subtotal_cents, p_tax_cents, p_discount_cents, p_credit_applied_cents,
    p_total_cents, p_notes, p_first_time_guest, p_club_rental_required
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

-- Housekeeping: expire stale holds and abandoned payment_pending
-- bookings. Called by a scheduled job.
create or replace function public.expire_stale_holds()
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_count int;
begin
  update public.booking_holds
  set status = 'expired'
  where status = 'active' and expires_at < now();
  get diagnostics v_count = row_count;

  update public.bookings
  set status = 'expired'
  where status = 'payment_pending'
    and created_at < now() - interval '30 minutes';

  return v_count;
end;
$$;

-- Restrict RPC execution: anon/authenticated may create holds;
-- conversion and cleanup are server-only (service role).
revoke all on function public.create_booking_hold from public;
grant execute on function public.create_booking_hold to anon, authenticated, service_role;

revoke all on function public.convert_hold_to_booking from public;
grant execute on function public.convert_hold_to_booking to service_role;

revoke all on function public.expire_stale_holds from public;
grant execute on function public.expire_stale_holds to service_role;

-- ------------------------------------------------------------
-- supabase/migrations/0009_rls.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0009 Row Level Security
--
-- Principles:
--  * RLS enabled on every table.
--  * Customers see only their own rows.
--  * Public content (bays, menu, events, leagues, ...) readable
--    by anyone.
--  * All writes that affect money, entitlements or other people
--    go through the service role (server-side) or staff roles.
-- ============================================================

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth_user_id = auth.uid() or public.is_staff());

create policy "profiles_update_own" on public.profiles
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- staff_roles ----------
alter table public.staff_roles enable row level security;

create policy "staff_roles_select_own_or_admin" on public.staff_roles
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );
-- Role grants are service-role only (no insert/update policies).

-- ---------- households ----------
alter table public.households enable row level security;

create policy "households_owner_all" on public.households
  for all using (owner_profile_id = public.current_profile_id())
  with check (owner_profile_id = public.current_profile_id());

create policy "households_staff_select" on public.households
  for select using (public.is_staff());

alter table public.household_members enable row level security;

create policy "household_members_owner_all" on public.household_members
  for all using (
    household_id in (
      select id from public.households where owner_profile_id = public.current_profile_id()
    )
  )
  with check (
    household_id in (
      select id from public.households where owner_profile_id = public.current_profile_id()
    )
  );

create policy "household_members_staff_select" on public.household_members
  for select using (public.is_staff());

-- ---------- site_settings ----------
alter table public.site_settings enable row level security;

-- Only non-sensitive settings are stored here; publicly readable
-- so the marketing site can render business mode, hours, contact.
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

create policy "site_settings_admin_write" on public.site_settings
  for all using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));

-- ---------- notifications ----------
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (profile_id = public.current_profile_id());

create policy "notifications_update_own" on public.notifications
  for update using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- ---------- audit_logs ----------
alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_select" on public.audit_logs
  for select using (public.is_admin());
-- Writes are service-role only.

-- ---------- facility ----------
alter table public.simulator_bays enable row level security;
create policy "bays_public_read" on public.simulator_bays for select using (true);
create policy "bays_admin_write" on public.simulator_bays
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.business_hours enable row level security;
create policy "business_hours_public_read" on public.business_hours for select using (true);
create policy "business_hours_admin_write" on public.business_hours
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.special_hours enable row level security;
create policy "special_hours_public_read" on public.special_hours for select using (true);
create policy "special_hours_admin_write" on public.special_hours
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.bay_blackouts enable row level security;
create policy "bay_blackouts_staff_read" on public.bay_blackouts
  for select using (public.is_staff());
create policy "bay_blackouts_admin_write" on public.bay_blackouts
  for all using (public.has_staff_role(array['owner','manager','front_desk']))
  with check (public.has_staff_role(array['owner','manager','front_desk']));

alter table public.pricing_rules enable row level security;
create policy "pricing_rules_public_read" on public.pricing_rules
  for select using (active);
create policy "pricing_rules_admin_write" on public.pricing_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- booking holds ----------
alter table public.booking_holds enable row level security;
-- Created via the create_booking_hold RPC (security definer).
create policy "booking_holds_select_own" on public.booking_holds
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );

-- ---------- bookings ----------
alter table public.bookings enable row level security;

create policy "bookings_select_own" on public.bookings
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );
-- Customers cannot insert/update bookings directly: creation goes
-- through the hold-conversion RPC, mutation through server actions
-- (service role) that enforce cancellation policy and totals.

create policy "bookings_staff_write" on public.bookings
  for all using (public.has_staff_role(array['owner','manager','front_desk']))
  with check (public.has_staff_role(array['owner','manager','front_desk']));

alter table public.booking_participants enable row level security;
create policy "booking_participants_select_own" on public.booking_participants
  for select using (
    booking_id in (select id from public.bookings where profile_id = public.current_profile_id())
    or public.is_staff()
  );
create policy "booking_participants_staff_write" on public.booking_participants
  for all using (public.has_staff_role(array['owner','manager','front_desk']))
  with check (public.has_staff_role(array['owner','manager','front_desk']));

alter table public.booking_status_history enable row level security;
create policy "booking_status_history_select" on public.booking_status_history
  for select using (
    booking_id in (select id from public.bookings where profile_id = public.current_profile_id())
    or public.is_staff()
  );

-- ---------- payments / refunds ----------
alter table public.payments enable row level security;
create policy "payments_select_own" on public.payments
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );
-- Writes are service-role only (webhooks).

alter table public.refunds enable row level security;
create policy "refunds_admin_select" on public.refunds
  for select using (public.is_admin());
-- Writes are service-role only.

-- ---------- memberships ----------
alter table public.membership_plans enable row level security;
create policy "membership_plans_public_read" on public.membership_plans
  for select using (active or public.is_admin());
create policy "membership_plans_admin_write" on public.membership_plans
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.memberships enable row level security;
create policy "memberships_select_own" on public.memberships
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );
-- Entitlement changes are service-role only (Stripe webhooks).

alter table public.membership_ledger enable row level security;
create policy "membership_ledger_select_own" on public.membership_ledger
  for select using (
    membership_id in (select id from public.memberships where profile_id = public.current_profile_id())
    or public.is_admin()
  );

-- ---------- leagues ----------
alter table public.leagues enable row level security;
create policy "leagues_public_read" on public.leagues
  for select using (status <> 'cancelled' or public.is_staff());
create policy "leagues_admin_write" on public.leagues
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.league_teams enable row level security;
create policy "league_teams_public_read" on public.league_teams for select using (true);
create policy "league_teams_captain_update" on public.league_teams
  for update using (captain_profile_id = public.current_profile_id())
  with check (captain_profile_id = public.current_profile_id());
create policy "league_teams_admin_write" on public.league_teams
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.league_registrations enable row level security;
create policy "league_registrations_select_own" on public.league_registrations
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );
-- Creation/updates run server-side to validate capacity and payment.

alter table public.league_team_members enable row level security;
create policy "league_team_members_select" on public.league_team_members
  for select using (
    profile_id = public.current_profile_id()
    or team_id in (select id from public.league_teams where captain_profile_id = public.current_profile_id())
    or public.is_staff()
  );

alter table public.league_schedules enable row level security;
create policy "league_schedules_public_read" on public.league_schedules for select using (true);
create policy "league_schedules_admin_write" on public.league_schedules
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.league_results enable row level security;
create policy "league_results_public_read" on public.league_results for select using (true);
create policy "league_results_admin_write" on public.league_results
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- instructors / programs ----------
alter table public.instructors enable row level security;
create policy "instructors_public_read" on public.instructors
  for select using (active or public.is_staff());
create policy "instructors_admin_write" on public.instructors
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.programs enable row level security;
create policy "programs_public_read" on public.programs
  for select using (status <> 'cancelled' or public.is_staff());
create policy "programs_admin_write" on public.programs
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.program_registrations enable row level security;
create policy "program_registrations_select_own" on public.program_registrations
  for select using (
    profile_id = public.current_profile_id()
    or guardian_profile_id = public.current_profile_id()
    or public.has_staff_role(array['owner','manager','front_desk','instructor'])
  );
-- Creation runs server-side (validates guardian, capacity, waiver).

-- ---------- events ----------
alter table public.events enable row level security;
create policy "events_public_read" on public.events
  for select using (status = 'published' or public.is_staff());
create policy "events_staff_write" on public.events
  for all using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));

alter table public.event_registrations enable row level security;
create policy "event_registrations_select_own" on public.event_registrations
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );

-- ---------- menu ----------
alter table public.menu_categories enable row level security;
create policy "menu_categories_public_read" on public.menu_categories
  for select using (active or public.is_staff());
create policy "menu_categories_staff_write" on public.menu_categories
  for all using (public.has_staff_role(array['owner','manager','kitchen','marketing']))
  with check (public.has_staff_role(array['owner','manager','kitchen','marketing']));

alter table public.menu_items enable row level security;
create policy "menu_items_public_read" on public.menu_items for select using (true);
create policy "menu_items_staff_write" on public.menu_items
  for all using (public.has_staff_role(array['owner','manager','kitchen','marketing']))
  with check (public.has_staff_role(array['owner','manager','kitchen','marketing']));

-- ---------- private event inquiries ----------
alter table public.private_event_inquiries enable row level security;
create policy "private_event_inquiries_select_own" on public.private_event_inquiries
  for select using (
    profile_id = public.current_profile_id()
    or public.has_staff_role(array['owner','manager','marketing'])
  );
create policy "private_event_inquiries_staff_update" on public.private_event_inquiries
  for update using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));
-- Public submissions are inserted server-side after validation + rate limiting.

-- ---------- gift cards / credits ----------
alter table public.gift_cards enable row level security;
create policy "gift_cards_select_own" on public.gift_cards
  for select using (
    purchaser_profile_id = public.current_profile_id() or public.is_admin()
  );
-- Balance changes are service-role only.

alter table public.gift_card_transactions enable row level security;
create policy "gift_card_transactions_admin_select" on public.gift_card_transactions
  for select using (public.is_admin());

alter table public.account_credits enable row level security;
create policy "account_credits_select_own" on public.account_credits
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );

-- ---------- waivers ----------
alter table public.waiver_templates enable row level security;
create policy "waiver_templates_public_read" on public.waiver_templates
  for select using (active or public.is_staff());
create policy "waiver_templates_admin_write" on public.waiver_templates
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.waiver_signatures enable row level security;
create policy "waiver_signatures_select_own" on public.waiver_signatures
  for select using (
    profile_id = public.current_profile_id()
    or guardian_profile_id = public.current_profile_id()
    or public.has_staff_role(array['owner','manager','front_desk','instructor'])
  );
create policy "waiver_signatures_insert_own" on public.waiver_signatures
  for insert with check (
    profile_id = public.current_profile_id()
    or guardian_profile_id = public.current_profile_id()
  );

-- ---------- discounts ----------
alter table public.discount_codes enable row level security;
create policy "discount_codes_admin_all" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());
-- Customers never read this table directly; validation happens server-side.

-- ---------- opening updates ----------
alter table public.opening_updates enable row level security;
create policy "opening_updates_public_read" on public.opening_updates
  for select using (status = 'published' or public.is_staff());
create policy "opening_updates_staff_write" on public.opening_updates
  for all using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));

-- ---------- interest submissions ----------
alter table public.interest_submissions enable row level security;
create policy "interest_submissions_staff_read" on public.interest_submissions
  for select using (public.has_staff_role(array['owner','manager','marketing']));
-- Public submissions are inserted server-side after validation + rate limiting.

-- ------------------------------------------------------------
-- supabase/migrations/0010_square.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0010 Square integration: order/payment references
-- Square is the payment provider; Stripe columns remain for
-- historical compatibility.
-- ============================================================

alter table public.bookings
  add column if not exists square_order_id text,
  add column if not exists square_payment_id text;

create index if not exists bookings_square_order_idx
  on public.bookings (square_order_id) where square_order_id is not null;

alter table public.payments
  add column if not exists square_payment_id text;

create unique index if not exists payments_square_payment_idx
  on public.payments (square_payment_id) where square_payment_id is not null;

-- ------------------------------------------------------------
-- supabase/migrations/0011_contact_messages.sql
-- ------------------------------------------------------------
-- ============================================================
-- 0011 Contact form inbox
-- Persists website contact-form submissions so staff can read and
-- work them from the dashboard (not just an email notification).
-- ============================================================

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  handled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

-- Staff (owner / manager / marketing) can read and update the inbox.
create policy "contact_messages_staff_select" on public.contact_messages
  for select using (public.has_staff_role(array['owner', 'manager', 'marketing']));

create policy "contact_messages_staff_update" on public.contact_messages
  for update using (public.has_staff_role(array['owner', 'manager', 'marketing']))
  with check (public.has_staff_role(array['owner', 'manager', 'marketing']));

-- Public submissions are inserted server-side (service role) after
-- validation, honeypot and rate limiting — no public insert policy.

-- ------------------------------------------------------------
-- supabase/seed.sql
-- ------------------------------------------------------------
-- ============================================================
-- Seed data for The Bunker Indoor Golf (development / staging)
-- Placeholder business values are clearly marked and tracked in
-- LAUNCH_CHECKLIST.md.
-- ============================================================

-- ---------- Site settings ----------
insert into public.site_settings (key, value) values
  ('business_mode', '"fully_operational"'),
  ('opening_label', '"Fall 2026"'),
  ('facility', '{
    "name": "The Bunker Indoor Golf",
    "city": "Linton",
    "state": "IN",
    "address_line1": null,
    "postal_code": null,
    "phone": null,
    "email": "hello@thebunkerlinton.com",
    "timezone": "America/Indiana/Indianapolis"
  }'),
  ('hero', '{
    "eyebrow": "Coming to Linton, Indiana",
    "headline": "Indoor Golf.\nReal Connections.",
    "subheadline": "State-of-the-art simulators, leagues, lessons, good food and a place for our community to play, compete and connect—year-round."
  }'),
  ('simulator', '{
    "brand": null,
    "bay_count": 4,
    "course_count": null,
    "max_players_per_bay": 6,
    "club_rentals_available": true,
    "left_handed_support": true,
    "accessibility_notes": "At least one bay is planned to be fully wheelchair accessible."
  }'),
  ('booking_rules', '{
    "min_duration_minutes": 30,
    "max_duration_minutes": 240,
    "slot_interval_minutes": 30,
    "buffer_minutes": 10,
    "advance_window_days": 30,
    "same_day_cutoff_minutes": 60,
    "hold_minutes": 10,
    "cancellation_window_hours": 24,
    "tax_rate": 0.07
  }'),
  ('social', '{"facebook": null, "instagram": null}')
on conflict (key) do nothing;

-- ---------- Simulator bays ----------
insert into public.simulator_bays (name, slug, description, capacity, accessible, sort_order) values
  ('Bay 1 — St Andrews', 'bay-1', 'Corner bay with lounge seating for six.', 6, true, 1),
  ('Bay 2 — Pebble', 'bay-2', 'Center bay, ideal for foursomes.', 6, false, 2),
  ('Bay 3 — Augusta', 'bay-3', 'Center bay, ideal for foursomes.', 6, false, 3),
  ('Bay 4 — Whistling', 'bay-4', 'Semi-private end bay, great for lessons and small groups.', 4, false, 4)
on conflict (slug) do nothing;

-- ---------- Business hours (placeholder — confirm before launch) ----------
insert into public.business_hours (day_of_week, opens_at, closes_at) values
  (0, '12:00', '20:00'), -- Sunday
  (1, '09:00', '21:00'),
  (2, '09:00', '21:00'),
  (3, '09:00', '21:00'),
  (4, '09:00', '22:00'),
  (5, '09:00', '23:00'),
  (6, '09:00', '23:00');

-- ---------- Pricing rules (placeholder rates) ----------
insert into public.pricing_rules (name, service_type, day_of_week, starts_at, ends_at, price_per_unit_cents, billing_unit_minutes, priority) values
  ('Standard rate', 'bay_rental', null, null, null, 2000, 30, 0),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 1, '09:00', '16:00', 1500, 30, 10),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 2, '09:00', '16:00', 1500, 30, 10),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 3, '09:00', '16:00', 1500, 30, 10),
  ('Weekday off-peak (before 4pm)', 'bay_rental', 4, '09:00', '16:00', 1500, 30, 10),
  ('Weekend peak', 'bay_rental', 5, '16:00', '23:00', 2500, 30, 10),
  ('Weekend peak', 'bay_rental', 6, '09:00', '23:00', 2500, 30, 10);

-- ---------- Membership plans (placeholder — final pricing TBD) ----------
insert into public.membership_plans (name, slug, description, billing_interval, price_cents, included_minutes, booking_window_days, discount_percentage, household_eligible, sort_order) values
  ('Practice', 'practice', 'For regulars who want consistent practice time each month.', 'month', 7900, 240, 10, 10, false, 1),
  ('Player', 'player', 'More included time, league discounts and priority tournament access.', 'month', 12900, 480, 14, 15, false, 2),
  ('Family', 'family', 'Shared household benefits with youth program discounts and guest privileges.', 'month', 17900, 600, 14, 15, true, 3),
  ('Business', 'business', 'Shared company credits, employee access and event discounts with central billing.', 'month', 24900, 900, 14, 15, true, 4)
on conflict (slug) do nothing;

-- ---------- Leagues ----------
insert into public.leagues (name, slug, category, description, season, day_of_week, start_time, capacity, team_size, price_cents, status) values
  ('Men''s Winter League', 'mens-winter-league', 'mens',
   'A friendly, competitive 8-week league played on championship courses. Two-player teams, weekly matchups and season standings.',
   'Winter 2026–27', 2, '18:00', 32, 2, 12000, 'interest'),
  ('Ladies'' League', 'ladies-league', 'ladies',
   'A welcoming league for women of all skill levels — equal parts golf, coaching tips and social time.',
   'Winter 2026–27', 3, '18:00', 24, 2, 12000, 'interest'),
  ('Couples League', 'couples-league', 'couples',
   'Team up with your favorite playing partner for a relaxed evening league with a social format.',
   'Winter 2026–27', 4, '19:00', 24, 2, 14000, 'interest'),
  ('Senior Day Play', 'senior-day-play', 'senior',
   'Daytime sessions for seniors with flexible formats, coffee and unhurried tee times.',
   'Ongoing', 3, '10:00', 16, 1, 6000, 'interest'),
  ('Business Team League', 'business-team-league', 'business',
   'Company vs. company team golf — a fun standing reason to get your team out of the office.',
   'Winter 2026–27', 1, '18:30', 24, 4, 32000, 'interest'),
  ('Church Team League', 'church-team-league', 'church',
   'Fellowship-first team league for area congregations. All skill levels welcome.',
   'Winter 2026–27', 4, '18:30', 24, 4, 28000, 'interest'),
  ('The Bunker Opening Tournament', 'opening-tournament', 'tournament',
   'Our inaugural tournament — a scramble format open to all, with prizes and plenty of fanfare.',
   'Fall 2026', null, null, 48, 4, 10000, 'opening_soon')
on conflict (slug) do nothing;

-- ---------- Instructors (placeholder) ----------
insert into public.instructors (display_name, bio, credentials, specialties, active) values
  ('Instruction Team', 'Our teaching staff will be announced closer to opening. Lessons will cover full swing, short game, putting and on-course strategy for all ages.', 'To be announced', array['full swing', 'short game', 'putting', 'beginners'], true);

-- ---------- Programs ----------
insert into public.programs (name, slug, category, description, skill_level, capacity, price_cents, duration_minutes, status, age_min, age_max) values
  ('Private Lesson', 'private-lesson', 'private_lesson',
   'One-on-one instruction tailored to your goals, using simulator ball-flight data to guide each session.',
   'all', 1, 6500, 60, 'interest', null, null),
  ('Beginner Basics', 'beginner-basics', 'beginner_lesson',
   'Never held a club? Perfect. A relaxed introduction to grip, stance and swing in a private bay.',
   'new', 4, 4500, 60, 'interest', null, null),
  ('Swing Evaluation', 'swing-evaluation', 'swing_evaluation',
   'A data-driven look at your swing with clear takeaways and a practice plan.',
   'all', 1, 5500, 45, 'interest', null, null),
  ('Junior Golf Clinic', 'junior-golf-clinic', 'youth_clinic',
   'Small-group clinics that make golf fun first — games, challenges and fundamentals for young golfers.',
   'all', 8, 9000, 60, 'interest', 7, 14),
  ('Junior League', 'junior-league', 'junior_league',
   'A team-based league for young golfers with weekly play and friendly coaching.',
   'all', 16, 11000, 90, 'interest', 10, 17)
on conflict (slug) do nothing;

-- ---------- Events ----------
insert into public.events (title, slug, category, excerpt, description, starts_at, ends_at, registration_required, status, featured) values
  ('Community Open House', 'community-open-house', 'community',
   'Walk the space, try a swing and meet Jay and Amanda before we officially open.',
   'Come see what we''ve been building. Tour the bays, watch simulator demos, ask questions about leagues and memberships, and enjoy light refreshments. Family friendly and free to attend.',
   '2026-09-19 15:00:00-04', '2026-09-19 20:00:00-04', false, 'published', true),
  ('Highland Stage Preview Night', 'highland-stage-preview-night', 'highland_stage',
   'A first look at our community stage with live acoustic music and an open lounge.',
   'The Highland Stage is our home for live entertainment and community programming. Join us for a preview evening with local musicians, drinks and a relaxed clubhouse atmosphere.',
   '2026-10-02 18:00:00-04', '2026-10-02 21:00:00-04', false, 'published', true),
  ('Simulator Demo Weekend', 'simulator-demo-weekend', 'golf',
   'Free 15-minute demo sessions all weekend — first come, first served.',
   'Curious how a golf simulator works? Drop in during demo weekend and our team will get you hitting shots on world-famous courses in minutes. All ages and skill levels welcome.',
   '2026-10-10 10:00:00-04', '2026-10-11 18:00:00-04', false, 'published', false)
on conflict (slug) do nothing;

-- ---------- Menu (placeholder items — replace with final menu) ----------
insert into public.menu_categories (name, slug, description, sort_order) values
  ('Shareables', 'shareables', 'Made for the whole bay.', 1),
  ('Snacks', 'snacks', 'Quick bites between shots.', 2),
  ('Sandwiches', 'sandwiches', 'Hearty enough for 18 holes.', 3),
  ('Kids', 'kids', 'For the junior members of your group.', 4),
  ('Desserts', 'desserts', 'Finish strong.', 5),
  ('Drinks', 'drinks', 'Sodas, coffee and more.', 6),
  ('Beer & Wine', 'beer-wine', 'Local favorites and clubhouse classics.', 7)
on conflict (slug) do nothing;

insert into public.menu_items (category_id, name, description, price_cents, dietary_labels, featured, sort_order)
select c.id, i.name, i.description, i.price_cents, i.dietary_labels, i.featured, i.sort_order
from (values
  ('shareables', 'Clubhouse Pretzel Bites', 'Warm pretzel bites with beer cheese and honey mustard.', 950, array['vegetarian'], true, 1),
  ('shareables', 'Loaded Bunker Nachos', 'Tortilla chips, queso, pico, jalapeños and your choice of chicken or pork.', 1250, array[]::text[], true, 2),
  ('shareables', 'Fairway Flatbread', 'Rotating flatbread with seasonal toppings — ask what''s on this week.', 1150, array[]::text[], false, 3),
  ('snacks', 'Kettle Chips & Dip', 'House kettle chips with French onion dip.', 550, array['vegetarian','gluten-conscious'], false, 1),
  ('snacks', 'Mixed Nuts', 'Roasted and lightly salted.', 450, array['vegan','gluten-conscious','contains-nuts'], false, 2),
  ('sandwiches', 'The Turn Club', 'Turkey, ham, bacon, lettuce, tomato and mayo on toasted sourdough.', 1150, array[]::text[], true, 1),
  ('sandwiches', 'Pulled Pork Sandwich', 'Slow-smoked pork with tangy slaw on a brioche bun.', 1150, array[]::text[], false, 2),
  ('kids', 'Chicken Tenders & Chips', 'Three crispy tenders with kettle chips.', 700, array[]::text[], false, 1),
  ('kids', 'Grilled Cheese', 'Classic grilled cheese on Texas toast.', 600, array['vegetarian'], false, 2),
  ('desserts', 'Warm Cookie Skillet', 'Chocolate chip cookie baked to order with vanilla ice cream.', 800, array['vegetarian','contains-nuts'], true, 1),
  ('drinks', 'Fountain Sodas', 'Coke products with free refills.', 300, array['vegan'], false, 1),
  ('drinks', 'Fresh Coffee', 'Locally roasted drip coffee.', 350, array['vegan'], false, 2),
  ('beer-wine', 'Local Draft Selection', 'Rotating Indiana craft drafts — ask what''s pouring.', 650, array[]::text[], false, 1),
  ('beer-wine', 'House Wine', 'Red or white by the glass.', 750, array[]::text[], false, 2)
) as i(category_slug, name, description, price_cents, dietary_labels, featured, sort_order)
join public.menu_categories c on c.slug = i.category_slug;

-- ---------- Waiver template ----------
insert into public.waiver_templates (name, version, content, active) values
  ('Facility Participation Waiver', 1,
   'PLACEHOLDER — This waiver text must be reviewed and approved by legal counsel before launch. It should cover assumption of risk for simulator use, equipment handling, facility rules, and parental/guardian consent for minors.',
   true);

-- ---------- Opening updates ----------
insert into public.opening_updates (title, slug, excerpt, content, status, published_at) values
  ('The Bunker is Coming to Linton', 'the-bunker-is-coming-to-linton',
   'Jay and Amanda are bringing year-round indoor golf to Greene County — opening Fall 2026.',
   'We''re thrilled to officially announce The Bunker Indoor Golf, opening in Linton in Fall 2026. Our vision is simple: a year-round place to play, learn, compete and connect — whether you''ve played golf your whole life or you''ve never picked up a club.

The Bunker will feature state-of-the-art simulator bays, a putting green, private lessons, leagues for every kind of player, youth programs and a comfortable lounge with food and drinks.

Follow along here for construction updates, league announcements and your first chance to book a bay.',
   'published', '2026-06-01 09:00:00-04'),
  ('Construction Underway', 'construction-underway',
   'Walls are going up and bay layouts are locked in. Here''s a look at the progress.',
   'Construction is officially underway. This month the crew finished demo and framing for the simulator bays, the Highland Stage corner and the lounge. Next up: electrical, screens and turf.

Want to be first to know when league registration and bay reservations open? Join the opening list and pick the programs you''re interested in.',
   'published', '2026-07-01 09:00:00-04')
on conflict (slug) do nothing;
