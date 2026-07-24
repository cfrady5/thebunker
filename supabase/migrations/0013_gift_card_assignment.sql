-- ============================================================
-- 0013 Gift card assignment + staff issuance
-- Lets staff issue gift cards from the dashboard, assign them to a
-- customer's account (so the card appears in that account and can be
-- redeemed), and link the sale to our payment method (Square).
-- ============================================================

alter table public.gift_cards
  add column if not exists assigned_profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists issued_by uuid references public.profiles (id) on delete set null,
  add column if not exists square_payment_id text;

create index if not exists gift_cards_assigned_idx
  on public.gift_cards (assigned_profile_id);

-- Cardholders can see gift cards they purchased OR were assigned.
drop policy if exists "gift_cards_select_own" on public.gift_cards;
create policy "gift_cards_select_own" on public.gift_cards
  for select using (
    purchaser_profile_id = public.current_profile_id()
    or assigned_profile_id = public.current_profile_id()
    or public.is_admin()
  );
