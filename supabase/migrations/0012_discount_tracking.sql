-- ============================================================
-- 0012 Discount code tracking
-- Records who created each code and logs every redemption with the
-- employee who applied it, so promo usage is fully trackable.
-- ============================================================

alter table public.discount_codes
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create table public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  redeemed_by uuid references public.profiles(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index discount_redemptions_code_idx
  on public.discount_redemptions (discount_code_id, created_at desc);

alter table public.discount_redemptions enable row level security;

create policy "discount_redemptions_staff_select" on public.discount_redemptions
  for select using (public.has_staff_role(array['owner', 'manager', 'front_desk']));

-- Inserts happen server-side (service role) after role checks.
