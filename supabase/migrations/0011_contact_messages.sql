-- ============================================================
-- 0011 Contact form inbox
-- Persists website contact-form submissions so staff can read and
-- work them from the dashboard (not just an email notification).
-- ============================================================

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  handled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

-- Staff (owner / manager / marketing) can read and update the inbox.
create policy "contact_messages_staff_select" on public.contact_messages
  for select using (public.has_staff_role(array['owner', 'manager', 'marketing']));

create policy "contact_messages_staff_update" on public.contact_messages
  for update using (public.has_staff_role(array['owner', 'manager', 'marketing']))
  with check (public.has_staff_role(array['owner', 'manager', 'marketing']));

-- Public submissions are inserted server-side (service role) after
-- validation, honeypot and rate limiting — no public insert policy.
