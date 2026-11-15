-- =====================================================================
--  Version 13: Einladungscodes für mehrere Clubs, BLM-Änderungen, Club-Chat.
--  Kann mehrfach ausgeführt werden.
-- =====================================================================

-- ---------- Einladungscodes für mehrere Clubs ----------
-- club_id = Haupt-Club, extra_clubs = weitere Clubs, denen man mit demselben Code beitritt
alter table public.invite_codes add column if not exists extra_clubs uuid[] not null default '{}';

-- Weitere Clubs darf nur eintragen, wer auch dort Admin ist (oder Superadmin)
drop policy if exists codes_insert on public.invite_codes;
create policy codes_insert on public.invite_codes for insert with check (
  is_superadmin() or (club_id is not null and is_club_admin(club_id)
    and not exists (select 1 from unnest(extra_clubs) x where not is_club_admin(x))));

create or replace function public._redeem(p_code text, p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare c invite_codes; x uuid;
begin
  select * into c from invite_codes where code = upper(trim(p_code)) for update;
  if not found or not c.active or (c.expires_at is not null and c.expires_at < now()) or c.uses >= c.max_uses then
    raise exception 'INVALID_INVITE';
  end if;
  update invite_codes set uses = uses + 1 where code = c.code;
  insert into redemptions (code, user_id) values (c.code, p_user);
  foreach x in array (case when c.club_id is null then '{}'::uuid[] else array[c.club_id] end) || coalesce(c.extra_clubs, '{}') loop
    insert into memberships (user_id, club_id, role) values (p_user, x, c.role)
    on conflict (user_id, club_id) do update
      set role = case when excluded.role = 'admin' then 'admin' else memberships.role end;
  end loop;
  return c.club_id;
end $$;
revoke all on function public._redeem(text, uuid) from public, anon, authenticated;

-- Vor der Registrierung: zeigt alle Clubs des Codes
create or replace function public.check_invite(p_code text) returns json
language plpgsql stable security definer set search_path = public as $$
declare c invite_codes; club_name text;
begin
  select * into c from invite_codes where code = upper(trim(p_code));
  if not found or not c.active or (c.expires_at is not null and c.expires_at < now()) or c.uses >= c.max_uses then
    return json_build_object('valid', false);
  end if;
  select string_agg(name, ', ' order by name) into club_name from clubs
    where id = c.club_id or id = any(coalesce(c.extra_clubs, '{}'));
  return json_build_object('valid', true, 'club', club_name);
end $$;
grant execute on function public.check_invite(text) to anon, authenticated;

-- ---------- BLM-Änderungen (neu / abgelaufen) ----------
-- Die App vergleicht einmal pro Tag die aktiven BLM-Claims im beobachteten Gebiet mit dem letzten Stand.
create table if not exists public.blm_active (
  cse_nr     text primary key,
  area       text not null,
  name       text,
  lat        double precision,
  lon        double precision,
  first_seen timestamptz not null default now()
);
create table if not exists public.blm_changes (
  cse_nr   text not null,
  change   text not null check (change in ('new', 'closed')),
  area     text not null,
  name     text,
  loc_dt   date,
  acres    double precision,
  lat      double precision,
  lon      double precision,
  seen_at  timestamptz not null default now(),
  primary key (cse_nr, change)
);
create table if not exists public.blm_checks (
  area       text primary key,
  checked_at timestamptz not null default now()
);
alter table public.blm_active  enable row level security;
alter table public.blm_changes enable row level security;
alter table public.blm_checks  enable row level security;
-- öffentliche BLM-Daten: jede angemeldete Person darf lesen und den Vergleich nachführen
drop policy if exists blm_active_all on public.blm_active;
create policy blm_active_all on public.blm_active for all to authenticated using (true) with check (true);
drop policy if exists blm_changes_read on public.blm_changes;
create policy blm_changes_read on public.blm_changes for select to authenticated using (true);
drop policy if exists blm_changes_add on public.blm_changes;
create policy blm_changes_add on public.blm_changes for insert to authenticated with check (true);
drop policy if exists blm_checks_all on public.blm_checks;
create policy blm_checks_all on public.blm_checks for all to authenticated using (true) with check (true);
revoke all on public.blm_active, public.blm_changes, public.blm_checks from anon;
grant select, insert, update, delete on public.blm_active, public.blm_checks to authenticated;
grant select, insert on public.blm_changes to authenticated;

-- ---------- Club-Chat ----------
create table if not exists public.club_messages (
  id         bigint generated always as identity primary key,
  club_id    uuid not null references public.clubs (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  username   text not null,
  body       text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists club_messages_club on public.club_messages (club_id, created_at desc);
alter table public.club_messages enable row level security;
drop policy if exists msg_read on public.club_messages;
create policy msg_read on public.club_messages for select to authenticated using (is_member(club_id) or is_superadmin());
drop policy if exists msg_write on public.club_messages;
create policy msg_write on public.club_messages for insert to authenticated
  with check (user_id = auth.uid() and (is_member(club_id) or is_superadmin()));
drop policy if exists msg_delete on public.club_messages;
create policy msg_delete on public.club_messages for delete to authenticated
  using (user_id = auth.uid() or is_club_admin(club_id) or is_superadmin());
revoke all on public.club_messages from anon;
grant select, insert, delete on public.club_messages to authenticated;
-- neue Nachrichten sofort an alle offenen Apps schicken
do $$ begin
  alter publication supabase_realtime add table public.club_messages;
exception when duplicate_object then null; end $$;

select 'Version 13 eingerichtet' as ergebnis;
