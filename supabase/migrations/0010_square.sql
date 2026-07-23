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
