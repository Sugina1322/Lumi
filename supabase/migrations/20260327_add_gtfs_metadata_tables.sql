create table if not exists public.gtfs_agency (
  agency_id text primary key,
  agency_name text not null,
  agency_url text not null,
  agency_timezone text not null,
  agency_lang text,
  agency_phone text,
  agency_fare_url text,
  agency_email text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.gtfs_calendar (
  service_id text primary key,
  monday integer,
  tuesday integer,
  wednesday integer,
  thursday integer,
  friday integer,
  saturday integer,
  sunday integer,
  start_date text,
  end_date text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.gtfs_feed_info (
  feed_publisher_name text not null,
  feed_publisher_url text not null,
  feed_lang text not null,
  default_lang text,
  feed_start_date text,
  feed_end_date text,
  feed_version text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  primary key (feed_publisher_name, feed_publisher_url, feed_lang)
);

create table if not exists public.gtfs_frequencies (
  trip_id text not null references public.gtfs_trips(trip_id) on delete cascade,
  start_time text not null,
  end_time text not null,
  headway_secs integer not null,
  exact_times integer,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  primary key (trip_id, start_time, end_time)
);

alter table public.gtfs_agency enable row level security;
alter table public.gtfs_calendar enable row level security;
alter table public.gtfs_feed_info enable row level security;
alter table public.gtfs_frequencies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_agency' and policyname = 'gtfs_agency_read'
  ) then
    create policy gtfs_agency_read on public.gtfs_agency for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_calendar' and policyname = 'gtfs_calendar_read'
  ) then
    create policy gtfs_calendar_read on public.gtfs_calendar for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_feed_info' and policyname = 'gtfs_feed_info_read'
  ) then
    create policy gtfs_feed_info_read on public.gtfs_feed_info for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_frequencies' and policyname = 'gtfs_frequencies_read'
  ) then
    create policy gtfs_frequencies_read on public.gtfs_frequencies for select using (true);
  end if;
end $$;
