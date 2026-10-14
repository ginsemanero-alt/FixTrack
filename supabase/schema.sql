-- FixTrack: School Facility Maintenance and Repair Management
-- Run this whole file in the Supabase SQL Editor. It is idempotent: safe to re-run.

create extension if not exists "pgcrypto";

-- ───────────── Tables ─────────────
create table if not exists public.facilities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'Classroom',
  building    text not null default '',
  floor       text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  ticket           text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  facility_id      uuid not null references public.facilities(id) on delete cascade,
  reporter_name    text not null default '',
  reporter_contact text not null default '',
  category         text not null default 'Other',
  description      text not null,
  urgency          text not null default 'Medium'
                   check (urgency in ('Low','Medium','High','Critical')),
  photo            text,                         -- compressed JPEG data URL
  status           text not null default 'Pending'
                   check (status in ('Pending','In Progress','Resolved')),
  assigned_to      text not null default '',     -- a maintenance staff member's full_name
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  resolved_at      timestamptz
);

create table if not exists public.repairs (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid references public.reports(id) on delete set null,
  facility_id  uuid not null references public.facilities(id) on delete cascade,
  description  text not null,
  cost         numeric(12,2) not null default 0 check (cost >= 0),
  technician   text not null default '',
  repair_date  date not null default current_date,
  created_at   timestamptz not null default now()
);

-- One row per staff account in Authentication → Users.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null default '',
  full_name  text not null default '',
  role       text not null default 'maintenance' check (role in ('admin','maintenance'))
);

create index if not exists reports_facility_idx on public.reports(facility_id);
create index if not exists reports_status_idx   on public.reports(status);
create index if not exists reports_ticket_idx   on public.reports(upper(ticket));
create index if not exists reports_assigned_idx on public.reports(assigned_to);
create index if not exists repairs_facility_idx on public.repairs(facility_id);
create index if not exists repairs_date_idx     on public.repairs(repair_date);

-- ───────────── Role helpers ─────────────
-- SECURITY DEFINER so policies can read `profiles` without recursing into its own RLS.
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.app_full_name() returns text
language sql stable security definer set search_path = public as $$
  select full_name from public.profiles where id = auth.uid()
$$;

-- New Auth users automatically get a LEAST-privilege profile (maintenance).
-- Promote someone to admin with the snippet at the bottom of this file.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    'maintenance'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: users that existed before this migration (as 'maintenance').
insert into public.profiles (id, email, full_name, role)
select u.id, coalesce(u.email, ''),
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(coalesce(u.email, ''), '@', 1)),
       'maintenance'
from auth.users u
on conflict (id) do nothing;

-- ───────────── Row Level Security ─────────────
alter table public.facilities enable row level security;
alter table public.reports    enable row level security;
alter table public.repairs    enable row level security;
alter table public.profiles   enable row level security;

drop policy if exists "facilities public read"        on public.facilities;
drop policy if exists "facilities staff write"        on public.facilities;
drop policy if exists "facilities admin write"        on public.facilities;
drop policy if exists "reports public insert"         on public.reports;
drop policy if exists "reports staff all"             on public.reports;
drop policy if exists "reports admin all"             on public.reports;
drop policy if exists "reports maintenance read"      on public.reports;
drop policy if exists "reports maintenance update"    on public.reports;
drop policy if exists "repairs staff all"             on public.repairs;
drop policy if exists "repairs admin all"             on public.repairs;
drop policy if exists "repairs maintenance insert"    on public.repairs;
drop policy if exists "profiles read own"             on public.profiles;
drop policy if exists "profiles admin all"            on public.profiles;

-- facilities: anyone who scans a QR may read; only admin writes (and deletes).
create policy "facilities public read" on public.facilities
  for select to anon, authenticated using (true);

create policy "facilities admin write" on public.facilities
  for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- reports: anyone may submit a Pending, unassigned report.
create policy "reports public insert" on public.reports
  for insert to anon, authenticated
  with check (status = 'Pending' and assigned_to = '' and resolved_at is null);

-- reports: admin has full access (including delete).
create policy "reports admin all" on public.reports
  for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- reports: maintenance reads/updates ONLY reports assigned to their full_name.
-- The WITH CHECK keeps assigned_to unchanged, so they cannot hand a report to someone else.
-- No delete policy for maintenance.
create policy "reports maintenance read" on public.reports
  for select to authenticated
  using (public.app_role() = 'maintenance' and assigned_to <> '' and assigned_to = public.app_full_name());

create policy "reports maintenance update" on public.reports
  for update to authenticated
  using (public.app_role() = 'maintenance' and assigned_to <> '' and assigned_to = public.app_full_name())
  with check (public.app_role() = 'maintenance' and assigned_to <> '' and assigned_to = public.app_full_name());

-- repairs: admin has full access; maintenance may only INSERT a repair for a report assigned to them
-- (they cannot read, edit or delete repairs, so Expenses / Repair History stay admin-only).
create policy "repairs admin all" on public.repairs
  for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy "repairs maintenance insert" on public.repairs
  for insert to authenticated
  with check (
    public.app_role() = 'maintenance'
    and exists (
      select 1 from public.reports r
      where r.id = repairs.report_id
        and r.facility_id = repairs.facility_id
        and r.assigned_to = public.app_full_name()
    )
  );

-- profiles: everyone reads their own row; admin reads and manages all. Nobody else can
-- write, so a user cannot promote themselves.
create policy "profiles read own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles admin all" on public.profiles
  for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- ───────────── Table privileges ─────────────
-- Newer Supabase projects do NOT auto-grant new public tables to the API roles, which makes
-- every request fail with "permission denied" before RLS is even checked. Grant explicitly;
-- the policies above still decide which rows each role can touch.
-- anon gets the bare minimum: read facilities, insert reports. Nothing else.
grant usage on schema public to anon, authenticated;
grant select                         on public.facilities to anon;
grant insert                         on public.reports    to anon;
grant select, insert, update, delete on public.facilities to authenticated;
grant select, insert, update, delete on public.reports    to authenticated;
grant select, insert, update, delete on public.repairs    to authenticated;
grant select, insert, update, delete on public.profiles   to authenticated;

-- ───────────── Keep updated_at / resolved_at in sync ─────────────
create or replace function public.touch_report() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'Resolved' and old.status is distinct from 'Resolved' then
    new.resolved_at := now();
  elsif new.status <> 'Resolved' then
    new.resolved_at := null;
  end if;
  return new;
end $$;

drop trigger if exists reports_touch on public.reports;
create trigger reports_touch before update on public.reports
  for each row execute function public.touch_report();

-- ───────────── Public ticket tracking ─────────────
-- The reports table is NOT readable by anon. This SECURITY DEFINER function is the only
-- public window into it, and it returns just these safe columns: no reporter name or
-- contact, no description, no photo. The ticket match is case-insensitive.
drop function if exists public.track_report(text);
create function public.track_report(p_ticket text)
returns table (
  ticket            text,
  facility_name     text,
  facility_building text,
  facility_floor    text,
  category          text,
  urgency           text,
  status            text,
  assigned_to       text,
  created_at        timestamptz,
  updated_at        timestamptz,
  resolved_at       timestamptz
)
language sql stable security definer set search_path = public as $$
  select r.ticket, f.name, f.building, f.floor,
         r.category, r.urgency, r.status, r.assigned_to,
         r.created_at, r.updated_at, r.resolved_at
  from public.reports r
  join public.facilities f on f.id = r.facility_id
  where upper(r.ticket) = upper(btrim(p_ticket))
  limit 1
$$;

revoke all on function public.track_report(text) from public;
grant execute on function public.track_report(text) to anon, authenticated;

-- ───────────── Optional sample data ─────────────
insert into public.facilities (name, type, building, floor)
select v.name, v.type, v.building, v.floor
from (values
  ('Grade 12 - Rizal', 'Classroom', 'Main Building', '2nd Floor'),
  ('Computer Laboratory 1', 'Laboratory', 'Tech Building', '1st Floor'),
  ('Boys Restroom A', 'Restroom', 'Main Building', 'Ground Floor'),
  ('School Library', 'Library', 'Annex', 'Ground Floor')
) as v(name, type, building, floor)
where not exists (select 1 from public.facilities f where f.name = v.name);

-- ───────────── Create staff accounts ─────────────
-- 1. Authentication → Users → add the user (email + password). A `profiles` row is created
--    automatically with role 'maintenance'.
-- 2. Promote your first admin (replace the email), then re-run for other admins as needed:
--
--      update public.profiles set role = 'admin' where email = 'admin@school.edu';
--
-- 3. Set the display name used in "Assign to" (must be unique per person):
--
--      update public.profiles set full_name = 'Mang Tonyo' where email = 'tonyo@school.edu';
