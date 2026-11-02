-- KALA UTSAV 2026: run this in Supabase SQL Editor.
-- Access is restricted to authenticated users. Disable public sign-ups in Auth settings.
create table if not exists public.kala_registrations (
  id text primary key,
  category_index integer not null check (category_index between 0 and 11),
  category text not null,
  event_date text not null,
  entry_type text not null check (entry_type in ('Individual','Group / Team')),
  participant_names text not null,
  block text not null,
  school text not null,
  udise text,
  remarks text,
  official text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.kala_registrations enable row level security;
drop policy if exists "authenticated users can read registrations" on public.kala_registrations;
create policy "authenticated users can read registrations"
on public.kala_registrations for select to authenticated using (true);
drop policy if exists "authenticated users can insert registrations" on public.kala_registrations;
create policy "authenticated users can insert registrations"
on public.kala_registrations for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "authenticated users can update registrations" on public.kala_registrations;
create policy "authenticated users can update registrations"
on public.kala_registrations for update to authenticated using (true) with check (true);
drop policy if exists "authenticated users can delete registrations" on public.kala_registrations;
create policy "authenticated users can delete registrations"
on public.kala_registrations for delete to authenticated using (true);
grant select, insert, update, delete on public.kala_registrations to authenticated;
