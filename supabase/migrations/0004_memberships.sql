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
