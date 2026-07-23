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
