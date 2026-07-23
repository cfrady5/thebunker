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
