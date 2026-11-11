-- =====================================================================
--  Abgleich zwischen Geräten (Version 9): eigene Punkte, Strecken und Fotos.
--  Alles privat: jede Person sieht nur ihre eigenen Daten.
--  Kann mehrfach ausgeführt werden.
-- =====================================================================

create table if not exists public.user_points (
  id         uuid primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.user_tracks (
  id         uuid primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists user_points_owner on public.user_points (owner);
create index if not exists user_tracks_owner on public.user_tracks (owner);

alter table public.user_points enable row level security;
alter table public.user_tracks enable row level security;

drop policy if exists own_points on public.user_points;
create policy own_points on public.user_points for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists own_tracks on public.user_tracks;
create policy own_tracks on public.user_tracks for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

revoke all on public.user_points, public.user_tracks from anon;
grant select, insert, update, delete on public.user_points, public.user_tracks to authenticated;

-- Fotos: privater Speicher "photos", jede Person nur im eigenen Ordner <Benutzer-ID>/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists photos_own_select on storage.objects;
create policy photos_own_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists photos_own_insert on storage.objects;
create policy photos_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists photos_own_update on storage.objects;
create policy photos_own_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists photos_own_delete on storage.objects;
create policy photos_own_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

select 'Abgleich eingerichtet' as ergebnis;
