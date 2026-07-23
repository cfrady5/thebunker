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
