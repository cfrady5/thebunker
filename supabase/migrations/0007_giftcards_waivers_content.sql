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
