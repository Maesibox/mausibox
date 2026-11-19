-- =====================================================================
--  MAUSIBOX App – Version 49: Club-Seiten für Gäste und Gast-Anfragen
--
--  So verwenden: Supabase-Projekt öffnen → links "SQL Editor" → "New query"
--  → den GANZEN Inhalt dieser Datei hineinkopieren → "Run".
--  Die Datei darf mehrmals ausgeführt werden (bestehende Daten bleiben erhalten).
--  Voraussetzung: supabase-setup.sql wurde schon ausgeführt.
-- =====================================================================

-- ---------- Club-Seite (eine pro Club, vom Club-Admin gepflegt) ----------
create table if not exists public.club_pages (
  club_id      uuid primary key references public.clubs (id) on delete cascade,
  published    boolean not null default false,     -- erst sichtbar, wenn der Admin veröffentlicht
  description  text check (length(description) <= 3000),
  place        text check (length(place) <= 200),  -- Ort / Region (nicht die Claims!)
  country      text check (length(country) <= 2),  -- Ländercode, z. B. US, CH, AU
  lat          double precision,
  lon          double precision,
  languages    text check (length(languages) <= 200),
  guests       text check (length(guests) <= 1000),      -- Tagespass, Gastmitgliedschaft, Probemonat
  guest_price  text check (length(guest_price) <= 300),
  camping      text check (length(camping) <= 1000),     -- Camping, Strom, Wasser
  events       text check (length(events) <= 2000),      -- Treffen, Ausflüge, Kurse
  rules        text check (length(rules) <= 2000),       -- Regeln auf den Claims
  bring        text check (length(bring) <= 1000),       -- was mitbringen
  contact      text check (length(contact) <= 300),
  website      text check (length(website) <= 300),
  updated_at   timestamptz not null default now()
);

alter table public.club_pages enable row level security;

drop policy if exists pages_select on public.club_pages;
create policy pages_select on public.club_pages for select to anon, authenticated
  using (published or is_club_admin(club_id) or is_superadmin());
drop policy if exists pages_insert on public.club_pages;
create policy pages_insert on public.club_pages for insert to authenticated
  with check (is_club_admin(club_id) or is_superadmin());
drop policy if exists pages_update on public.club_pages;
create policy pages_update on public.club_pages for update to authenticated
  using (is_club_admin(club_id) or is_superadmin()) with check (is_club_admin(club_id) or is_superadmin());
drop policy if exists pages_delete on public.club_pages;
create policy pages_delete on public.club_pages for delete to authenticated
  using (is_club_admin(club_id) or is_superadmin());

grant select on public.club_pages to anon, authenticated;
grant insert, update, delete on public.club_pages to authenticated;

-- Clubname für veröffentlichte Seiten auch für Nicht-Mitglieder lesbar machen
create or replace function public.published_club_pages() returns table (
  club_id uuid, club_name text, description text, place text, country text, lat double precision, lon double precision,
  languages text, guests text, guest_price text, camping text, events text, rules text, bring text,
  contact text, website text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.club_id, c.name, p.description, p.place, p.country, p.lat, p.lon, p.languages, p.guests, p.guest_price,
         p.camping, p.events, p.rules, p.bring, p.contact, p.website, p.updated_at
  from club_pages p join clubs c on c.id = p.club_id
  where p.published;
$$;
grant execute on function public.published_club_pages() to anon, authenticated;

-- ---------- Gast-Anfragen (nur mit Konto) ----------
create table if not exists public.guest_requests (
  id          bigint generated always as identity primary key,
  club_id     uuid not null references public.clubs (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  username    text not null default '',
  date_from   date,
  date_to     date,
  people      int not null default 1 check (people between 1 and 50),
  message     text not null check (length(message) between 1 and 2000),
  status      text not null default 'open' check (status in ('open', 'accepted', 'declined')),
  reply       text check (length(reply) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists guest_requests_club on public.guest_requests (club_id, created_at desc);
create index if not exists guest_requests_user on public.guest_requests (user_id, created_at desc);

-- Benutzername immer vom Server setzen, Status beim Anlegen immer "open"
create or replace function public.guest_request_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.username := coalesce((select username from profiles where id = auth.uid()), '');
    new.status := 'open';
    new.reply := null;
  else
    -- Anfragende dürfen nur ihre eigene Nachricht nicht nachträglich ändern lassen: nur Status/Antwort ändern sich
    new.user_id := old.user_id; new.username := old.username; new.club_id := old.club_id;
    new.message := old.message; new.date_from := old.date_from; new.date_to := old.date_to; new.people := old.people;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists guest_request_defaults on public.guest_requests;
create trigger guest_request_defaults before insert or update on public.guest_requests
  for each row execute function public.guest_request_defaults();

alter table public.guest_requests enable row level security;

drop policy if exists gr_insert on public.guest_requests;
create policy gr_insert on public.guest_requests for insert to authenticated
  with check (exists (select 1 from club_pages p where p.club_id = guest_requests.club_id and p.published)
              and exists (select 1 from profiles where id = auth.uid() and not disabled));
drop policy if exists gr_select on public.guest_requests;
create policy gr_select on public.guest_requests for select to authenticated
  using (user_id = auth.uid() or is_club_admin(club_id) or is_superadmin());
drop policy if exists gr_update on public.guest_requests;
create policy gr_update on public.guest_requests for update to authenticated
  using (is_club_admin(club_id) or is_superadmin()) with check (is_club_admin(club_id) or is_superadmin());
drop policy if exists gr_delete on public.guest_requests;
create policy gr_delete on public.guest_requests for delete to authenticated
  using (user_id = auth.uid() or is_club_admin(club_id) or is_superadmin());

grant select, insert, update, delete on public.guest_requests to authenticated;

select 'Version 49 eingerichtet: Club-Seiten und Gast-Anfragen' as ergebnis;
