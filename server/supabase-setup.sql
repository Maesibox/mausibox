-- =====================================================================
--  MAUSIBOX App – Datenbank-Einrichtung für Supabase
--
--  So verwenden: Supabase-Projekt öffnen → links "SQL Editor" → "New query"
--  → den GANZEN Inhalt dieser Datei hineinkopieren → "Run".
--  Ganz unten erscheint dein erster Einladungscode (für dein eigenes Konto).
--
--  Die Datei darf mehrmals ausgeführt werden (bestehende Daten bleiben erhalten).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tabellen ----------

-- Clubs
create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_lat   double precision,
  start_lon   double precision,
  start_zoom  int,
  created_at  timestamptz not null default now()
);

-- Benutzerprofile (zu jedem Login genau eins)
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       text not null check (username ~ '^[A-Za-z0-9_.-]{3,30}$'),
  is_superadmin  boolean not null default false,
  disabled       boolean not null default false,
  created_at     timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

-- Mitgliedschaften: wer gehört zu welchem Club, als Mitglied oder Admin
create table if not exists public.memberships (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  club_id     uuid not null references public.clubs (id) on delete cascade,
  role        text not null default 'member' check (role in ('member', 'admin')),
  created_at  timestamptz not null default now(),
  primary key (user_id, club_id)
);

-- Einladungscodes. club_id leer = Code für Privatperson (ohne Club)
create table if not exists public.invite_codes (
  code        text primary key check (code ~ '^[A-Z0-9-]{4,40}$'),
  club_id     uuid references public.clubs (id) on delete cascade,
  role        text not null default 'member' check (role in ('member', 'admin')),
  max_uses    int not null default 1 check (max_uses > 0),
  uses        int not null default 0,
  expires_at  timestamptz,
  active      boolean not null default true,
  note        text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Wer hat welchen Code eingelöst
create table if not exists public.redemptions (
  code     text not null,
  user_id  uuid not null references public.profiles (id) on delete cascade,
  at       timestamptz not null default now()
);

-- Club-Claims (aus KML/GeoJSON umgewandelt, gespeichert als GeoJSON)
create table if not exists public.club_files (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs (id) on delete cascade,
  name         text not null,
  geojson      jsonb not null,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Fehlversuche beim Login (Schutz gegen Durchprobieren von Passwörtern)
create table if not exists public.login_attempts (
  username  text not null,
  at        timestamptz not null default now()
);
create index if not exists login_attempts_idx on public.login_attempts (lower(username), at);

-- ---------- Hilfsfunktionen für die Zugriffsregeln ----------

create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and is_superadmin and not disabled);
$$;

create or replace function public.is_member(club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m join profiles p on p.id = m.user_id
    where m.user_id = auth.uid() and m.club_id = club and not p.disabled);
$$;

create or replace function public.is_club_admin(club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m join profiles p on p.id = m.user_id
    where m.user_id = auth.uid() and m.club_id = club and m.role = 'admin' and not p.disabled);
$$;

-- ---------- Zugriffsregeln (Row Level Security) ----------

alter table public.clubs          enable row level security;
alter table public.profiles       enable row level security;
alter table public.memberships    enable row level security;
alter table public.invite_codes   enable row level security;
alter table public.redemptions    enable row level security;
alter table public.club_files     enable row level security;
alter table public.login_attempts enable row level security;   -- keine Regel = niemand von aussen

-- Clubs: Mitglieder sehen ihren Club; Club-Admin darf ihn bearbeiten; Superadmin alles
drop policy if exists clubs_select on public.clubs;
create policy clubs_select on public.clubs for select using (is_member(id) or is_superadmin());
drop policy if exists clubs_update on public.clubs;
create policy clubs_update on public.clubs for update using (is_club_admin(id) or is_superadmin());
drop policy if exists clubs_insert on public.clubs;
create policy clubs_insert on public.clubs for insert with check (is_superadmin());
drop policy if exists clubs_delete on public.clubs;
create policy clubs_delete on public.clubs for delete using (is_superadmin());

-- Profile: eigenes; Club-Admins sehen die Mitglieder ihrer Clubs; Superadmin alles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or is_superadmin() or exists (
    select 1 from memberships m where m.user_id = profiles.id and is_club_admin(m.club_id)));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (is_superadmin());

-- Mitgliedschaften
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select using (
  user_id = auth.uid() or is_club_admin(club_id) or is_superadmin());
drop policy if exists memberships_update on public.memberships;
create policy memberships_update on public.memberships for update using (is_club_admin(club_id) or is_superadmin());
drop policy if exists memberships_delete on public.memberships;
create policy memberships_delete on public.memberships for delete using (is_club_admin(club_id) or is_superadmin());
drop policy if exists memberships_insert on public.memberships;
create policy memberships_insert on public.memberships for insert with check (is_superadmin());

-- Einladungscodes: Club-Admin für seinen Club; Codes für Privatpersonen nur Superadmin
drop policy if exists codes_select on public.invite_codes;
create policy codes_select on public.invite_codes for select using (
  is_superadmin() or (club_id is not null and is_club_admin(club_id)));
drop policy if exists codes_insert on public.invite_codes;
create policy codes_insert on public.invite_codes for insert with check (
  is_superadmin() or (club_id is not null and is_club_admin(club_id)));
drop policy if exists codes_update on public.invite_codes;
create policy codes_update on public.invite_codes for update using (
  is_superadmin() or (club_id is not null and is_club_admin(club_id)));
drop policy if exists codes_delete on public.invite_codes;
create policy codes_delete on public.invite_codes for delete using (
  is_superadmin() or (club_id is not null and is_club_admin(club_id)));

drop policy if exists redemptions_select on public.redemptions;
create policy redemptions_select on public.redemptions for select using (
  is_superadmin() or exists (
    select 1 from invite_codes c where c.code = redemptions.code and c.club_id is not null and is_club_admin(c.club_id)));

-- Club-Claims: nur Mitglieder lesen; Club-Admin und Superadmin verwalten
drop policy if exists files_select on public.club_files;
create policy files_select on public.club_files for select using (is_member(club_id) or is_superadmin());
drop policy if exists files_insert on public.club_files;
create policy files_insert on public.club_files for insert with check (is_club_admin(club_id) or is_superadmin());
drop policy if exists files_delete on public.club_files;
create policy files_delete on public.club_files for delete using (is_club_admin(club_id) or is_superadmin());

-- ---------- Registrierung: nur mit gültigem Code ----------

-- Code einlösen (intern). Gibt den Club zurück (oder null bei Privat-Code).
create or replace function public._redeem(p_code text, p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare c invite_codes;
begin
  select * into c from invite_codes where code = upper(trim(p_code)) for update;
  if not found or not c.active or (c.expires_at is not null and c.expires_at < now()) or c.uses >= c.max_uses then
    raise exception 'INVALID_INVITE';
  end if;
  update invite_codes set uses = uses + 1 where code = c.code;
  insert into redemptions (code, user_id) values (c.code, p_user);
  if c.club_id is not null then
    insert into memberships (user_id, club_id, role) values (p_user, c.club_id, c.role)
    on conflict (user_id, club_id) do update
      set role = case when excluded.role = 'admin' then 'admin' else memberships.role end;
  end if;
  return c.club_id;
end $$;
revoke all on function public._redeem(text, uuid) from public, anon, authenticated;

-- Wird automatisch ausgeführt, wenn sich jemand registriert.
-- Ohne gültigen Code wird die Registrierung abgelehnt.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  select not exists (select 1 from profiles) into first_user;
  insert into profiles (id, username, is_superadmin)
  values (new.id, trim(new.raw_user_meta_data ->> 'username'), first_user);
  perform _redeem(new.raw_user_meta_data ->> 'invite_code', new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funktionen, die die App aufruft ----------

-- Vor der Registrierung: ist der Code gültig? (zeigt den Clubnamen)
create or replace function public.check_invite(p_code text) returns json
language plpgsql stable security definer set search_path = public as $$
declare c invite_codes; club_name text;
begin
  select * into c from invite_codes where code = upper(trim(p_code));
  if not found or not c.active or (c.expires_at is not null and c.expires_at < now()) or c.uses >= c.max_uses then
    return json_build_object('valid', false);
  end if;
  select name into club_name from clubs where id = c.club_id;
  return json_build_object('valid', true, 'club', club_name);
end $$;

create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where lower(username) = lower(trim(p_username)));
$$;

-- Login mit Benutzername: liefert die E-Mail NUR bei richtigem Passwort
-- (damit niemand E-Mail-Adressen herausfinden kann). Max. 10 Fehlversuche pro 15 Minuten.
create or replace function public.login_email(p_username text, p_password text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare u record; fails int;
begin
  select count(*) into fails from login_attempts
    where lower(username) = lower(trim(p_username)) and at > now() - interval '15 minutes';
  if fails >= 10 then raise exception 'TOO_MANY_ATTEMPTS'; end if;
  delete from login_attempts where at < now() - interval '1 day';

  select au.email, au.encrypted_password into u
    from profiles p join auth.users au on au.id = p.id
    where lower(p.username) = lower(trim(p_username));
  if found and u.encrypted_password is not null and crypt(p_password, u.encrypted_password) = u.encrypted_password then
    return u.email;
  end if;
  insert into login_attempts (username) values (lower(trim(p_username)));
  return null;
end $$;

-- Für angemeldete Benutzer: weiteren Code einlösen (z. B. Privatperson tritt einem Club bei)
create or replace function public.redeem_code(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'NOT_LOGGED_IN'; end if;
  return _redeem(p_code, auth.uid());
end $$;

-- Alles, was die App nach dem Login über den Benutzer wissen muss
create or replace function public.my_account() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', p.id, 'username', p.username, 'is_superadmin', p.is_superadmin, 'disabled', p.disabled,
    'clubs', coalesce((
      select json_agg(json_build_object('id', c.id, 'name', c.name, 'role', m.role,
        'start_lat', c.start_lat, 'start_lon', c.start_lon, 'start_zoom', c.start_zoom) order by c.name)
      from memberships m join clubs c on c.id = m.club_id where m.user_id = p.id), '[]'::json))
  from profiles p where p.id = auth.uid();
$$;

-- Mitglieder eines Clubs mit Benutzername (für Admins)
create or replace function public.club_members(p_club uuid) returns table (user_id uuid, username text, role text, disabled boolean, joined timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, m.role, p.disabled, m.created_at
  from memberships m join profiles p on p.id = m.user_id
  where m.club_id = p_club and (is_club_admin(p_club) or is_superadmin())
  order by lower(p.username);
$$;

grant execute on function public.check_invite(text), public.username_available(text), public.login_email(text, text) to anon, authenticated;
grant execute on function public.redeem_code(text), public.my_account(), public.club_members(uuid) to authenticated;

-- =====================================================================
--  Eigene Claims mit Location Monument und Pfosten
--  visibility 'private' = nur der Ersteller; 'club' = alle Mitglieder des Clubs
-- =====================================================================

create table if not exists public.claims (
  id          uuid primary key,
  owner       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  club_id     uuid references public.clubs (id) on delete cascade,
  visibility  text not null default 'private' check (visibility in ('private', 'club')),
  data        jsonb not null,
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now(),
  check (visibility = 'private' or club_id is not null)
);
alter table public.claims enable row level security;

drop policy if exists claims_select on public.claims;
create policy claims_select on public.claims for select using (
  owner = auth.uid() or (visibility = 'club' and (is_member(club_id) or is_superadmin())));
drop policy if exists claims_insert on public.claims;
create policy claims_insert on public.claims for insert with check (
  owner = auth.uid() and (visibility = 'private' or is_member(club_id)));
drop policy if exists claims_update on public.claims;
create policy claims_update on public.claims for update
  using (owner = auth.uid() or (visibility = 'club' and is_club_admin(club_id)))
  with check ((owner = auth.uid() and (visibility = 'private' or is_member(club_id)))
           or (visibility = 'club' and is_club_admin(club_id)));
drop policy if exists claims_delete on public.claims;
create policy claims_delete on public.claims for delete using (
  owner = auth.uid() or (visibility = 'club' and is_club_admin(club_id)));

-- ---------- Erster Code für dein eigenes Konto ----------
-- Wer sich als ERSTER registriert, wird automatisch Superadmin (= du).

insert into public.invite_codes (code, max_uses, note)
select 'START-' || upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8)), 1, 'Erstes Konto (Superadmin)'
where not exists (select 1 from public.profiles) and not exists (select 1 from public.invite_codes where note = 'Erstes Konto (Superadmin)');

select code as "Dein erster Einladungscode" from public.invite_codes where note = 'Erstes Konto (Superadmin)';
