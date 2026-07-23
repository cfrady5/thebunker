-- ============================================================
-- 0009 Row Level Security
--
-- Principles:
--  * RLS enabled on every table.
--  * Customers see only their own rows.
--  * Public content (bays, menu, events, leagues, ...) readable
--    by anyone.
--  * All writes that affect money, entitlements or other people
--    go through the service role (server-side) or staff roles.
-- ============================================================

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth_user_id = auth.uid() or public.is_staff());

create policy "profiles_update_own" on public.profiles
  for update using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- staff_roles ----------
alter table public.staff_roles enable row level security;

create policy "staff_roles_select_own_or_admin" on public.staff_roles
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );
-- Role grants are service-role only (no insert/update policies).

-- ---------- households ----------
alter table public.households enable row level security;

create policy "households_owner_all" on public.households
  for all using (owner_profile_id = public.current_profile_id())
  with check (owner_profile_id = public.current_profile_id());

create policy "households_staff_select" on public.households
  for select using (public.is_staff());

alter table public.household_members enable row level security;

create policy "household_members_owner_all" on public.household_members
  for all using (
    household_id in (
      select id from public.households where owner_profile_id = public.current_profile_id()
    )
  )
  with check (
    household_id in (
      select id from public.households where owner_profile_id = public.current_profile_id()
    )
  );

create policy "household_members_staff_select" on public.household_members
  for select using (public.is_staff());

-- ---------- site_settings ----------
alter table public.site_settings enable row level security;

-- Only non-sensitive settings are stored here; publicly readable
-- so the marketing site can render business mode, hours, contact.
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

create policy "site_settings_admin_write" on public.site_settings
  for all using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));

-- ---------- notifications ----------
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (profile_id = public.current_profile_id());

create policy "notifications_update_own" on public.notifications
  for update using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- ---------- audit_logs ----------
alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_select" on public.audit_logs
  for select using (public.is_admin());
-- Writes are service-role only.

-- ---------- facility ----------
alter table public.simulator_bays enable row level security;
create policy "bays_public_read" on public.simulator_bays for select using (true);
create policy "bays_admin_write" on public.simulator_bays
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.business_hours enable row level security;
create policy "business_hours_public_read" on public.business_hours for select using (true);
create policy "business_hours_admin_write" on public.business_hours
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.special_hours enable row level security;
create policy "special_hours_public_read" on public.special_hours for select using (true);
create policy "special_hours_admin_write" on public.special_hours
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.bay_blackouts enable row level security;
create policy "bay_blackouts_staff_read" on public.bay_blackouts
  for select using (public.is_staff());
create policy "bay_blackouts_admin_write" on public.bay_blackouts
  for all using (public.has_staff_role(array['owner','manager','front_desk']))
  with check (public.has_staff_role(array['owner','manager','front_desk']));

alter table public.pricing_rules enable row level security;
create policy "pricing_rules_public_read" on public.pricing_rules
  for select using (active);
create policy "pricing_rules_admin_write" on public.pricing_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- booking holds ----------
alter table public.booking_holds enable row level security;
-- Created via the create_booking_hold RPC (security definer).
create policy "booking_holds_select_own" on public.booking_holds
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );

-- ---------- bookings ----------
alter table public.bookings enable row level security;

create policy "bookings_select_own" on public.bookings
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );
-- Customers cannot insert/update bookings directly: creation goes
-- through the hold-conversion RPC, mutation through server actions
-- (service role) that enforce cancellation policy and totals.

create policy "bookings_staff_write" on public.bookings
  for all using (public.has_staff_role(array['owner','manager','front_desk']))
  with check (public.has_staff_role(array['owner','manager','front_desk']));

alter table public.booking_participants enable row level security;
create policy "booking_participants_select_own" on public.booking_participants
  for select using (
    booking_id in (select id from public.bookings where profile_id = public.current_profile_id())
    or public.is_staff()
  );
create policy "booking_participants_staff_write" on public.booking_participants
  for all using (public.has_staff_role(array['owner','manager','front_desk']))
  with check (public.has_staff_role(array['owner','manager','front_desk']));

alter table public.booking_status_history enable row level security;
create policy "booking_status_history_select" on public.booking_status_history
  for select using (
    booking_id in (select id from public.bookings where profile_id = public.current_profile_id())
    or public.is_staff()
  );

-- ---------- payments / refunds ----------
alter table public.payments enable row level security;
create policy "payments_select_own" on public.payments
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );
-- Writes are service-role only (webhooks).

alter table public.refunds enable row level security;
create policy "refunds_admin_select" on public.refunds
  for select using (public.is_admin());
-- Writes are service-role only.

-- ---------- memberships ----------
alter table public.membership_plans enable row level security;
create policy "membership_plans_public_read" on public.membership_plans
  for select using (active or public.is_admin());
create policy "membership_plans_admin_write" on public.membership_plans
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.memberships enable row level security;
create policy "memberships_select_own" on public.memberships
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );
-- Entitlement changes are service-role only (Stripe webhooks).

alter table public.membership_ledger enable row level security;
create policy "membership_ledger_select_own" on public.membership_ledger
  for select using (
    membership_id in (select id from public.memberships where profile_id = public.current_profile_id())
    or public.is_admin()
  );

-- ---------- leagues ----------
alter table public.leagues enable row level security;
create policy "leagues_public_read" on public.leagues
  for select using (status <> 'cancelled' or public.is_staff());
create policy "leagues_admin_write" on public.leagues
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.league_teams enable row level security;
create policy "league_teams_public_read" on public.league_teams for select using (true);
create policy "league_teams_captain_update" on public.league_teams
  for update using (captain_profile_id = public.current_profile_id())
  with check (captain_profile_id = public.current_profile_id());
create policy "league_teams_admin_write" on public.league_teams
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.league_registrations enable row level security;
create policy "league_registrations_select_own" on public.league_registrations
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );
-- Creation/updates run server-side to validate capacity and payment.

alter table public.league_team_members enable row level security;
create policy "league_team_members_select" on public.league_team_members
  for select using (
    profile_id = public.current_profile_id()
    or team_id in (select id from public.league_teams where captain_profile_id = public.current_profile_id())
    or public.is_staff()
  );

alter table public.league_schedules enable row level security;
create policy "league_schedules_public_read" on public.league_schedules for select using (true);
create policy "league_schedules_admin_write" on public.league_schedules
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.league_results enable row level security;
create policy "league_results_public_read" on public.league_results for select using (true);
create policy "league_results_admin_write" on public.league_results
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- instructors / programs ----------
alter table public.instructors enable row level security;
create policy "instructors_public_read" on public.instructors
  for select using (active or public.is_staff());
create policy "instructors_admin_write" on public.instructors
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.programs enable row level security;
create policy "programs_public_read" on public.programs
  for select using (status <> 'cancelled' or public.is_staff());
create policy "programs_admin_write" on public.programs
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.program_registrations enable row level security;
create policy "program_registrations_select_own" on public.program_registrations
  for select using (
    profile_id = public.current_profile_id()
    or guardian_profile_id = public.current_profile_id()
    or public.has_staff_role(array['owner','manager','front_desk','instructor'])
  );
-- Creation runs server-side (validates guardian, capacity, waiver).

-- ---------- events ----------
alter table public.events enable row level security;
create policy "events_public_read" on public.events
  for select using (status = 'published' or public.is_staff());
create policy "events_staff_write" on public.events
  for all using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));

alter table public.event_registrations enable row level security;
create policy "event_registrations_select_own" on public.event_registrations
  for select using (
    profile_id = public.current_profile_id() or public.is_staff()
  );

-- ---------- menu ----------
alter table public.menu_categories enable row level security;
create policy "menu_categories_public_read" on public.menu_categories
  for select using (active or public.is_staff());
create policy "menu_categories_staff_write" on public.menu_categories
  for all using (public.has_staff_role(array['owner','manager','kitchen','marketing']))
  with check (public.has_staff_role(array['owner','manager','kitchen','marketing']));

alter table public.menu_items enable row level security;
create policy "menu_items_public_read" on public.menu_items for select using (true);
create policy "menu_items_staff_write" on public.menu_items
  for all using (public.has_staff_role(array['owner','manager','kitchen','marketing']))
  with check (public.has_staff_role(array['owner','manager','kitchen','marketing']));

-- ---------- private event inquiries ----------
alter table public.private_event_inquiries enable row level security;
create policy "private_event_inquiries_select_own" on public.private_event_inquiries
  for select using (
    profile_id = public.current_profile_id()
    or public.has_staff_role(array['owner','manager','marketing'])
  );
create policy "private_event_inquiries_staff_update" on public.private_event_inquiries
  for update using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));
-- Public submissions are inserted server-side after validation + rate limiting.

-- ---------- gift cards / credits ----------
alter table public.gift_cards enable row level security;
create policy "gift_cards_select_own" on public.gift_cards
  for select using (
    purchaser_profile_id = public.current_profile_id() or public.is_admin()
  );
-- Balance changes are service-role only.

alter table public.gift_card_transactions enable row level security;
create policy "gift_card_transactions_admin_select" on public.gift_card_transactions
  for select using (public.is_admin());

alter table public.account_credits enable row level security;
create policy "account_credits_select_own" on public.account_credits
  for select using (
    profile_id = public.current_profile_id() or public.is_admin()
  );

-- ---------- waivers ----------
alter table public.waiver_templates enable row level security;
create policy "waiver_templates_public_read" on public.waiver_templates
  for select using (active or public.is_staff());
create policy "waiver_templates_admin_write" on public.waiver_templates
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.waiver_signatures enable row level security;
create policy "waiver_signatures_select_own" on public.waiver_signatures
  for select using (
    profile_id = public.current_profile_id()
    or guardian_profile_id = public.current_profile_id()
    or public.has_staff_role(array['owner','manager','front_desk','instructor'])
  );
create policy "waiver_signatures_insert_own" on public.waiver_signatures
  for insert with check (
    profile_id = public.current_profile_id()
    or guardian_profile_id = public.current_profile_id()
  );

-- ---------- discounts ----------
alter table public.discount_codes enable row level security;
create policy "discount_codes_admin_all" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());
-- Customers never read this table directly; validation happens server-side.

-- ---------- opening updates ----------
alter table public.opening_updates enable row level security;
create policy "opening_updates_public_read" on public.opening_updates
  for select using (status = 'published' or public.is_staff());
create policy "opening_updates_staff_write" on public.opening_updates
  for all using (public.has_staff_role(array['owner','manager','marketing']))
  with check (public.has_staff_role(array['owner','manager','marketing']));

-- ---------- interest submissions ----------
alter table public.interest_submissions enable row level security;
create policy "interest_submissions_staff_read" on public.interest_submissions
  for select using (public.has_staff_role(array['owner','manager','marketing']));
-- Public submissions are inserted server-side after validation + rate limiting.
