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
