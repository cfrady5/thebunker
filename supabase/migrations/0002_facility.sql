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
