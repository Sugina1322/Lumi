create extension if not exists pgcrypto;

create table if not exists public.transit_places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  aliases text[] not null default '{}',
  lat double precision not null,
  lng double precision not null,
  zone text,
  corridor text,
  source text not null default 'local',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  origin_slug text not null,
  destination_slug text not null,
  summary text not null,
  source text not null default 'community',
  confidence text not null default 'community-sourced',
  source_url text,
  notes text,
  total_duration integer,
  total_cost numeric(10,2),
  total_distance_meters integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_routes_origin_destination_idx
  on public.community_routes (origin_slug, destination_slug);

create table if not exists public.community_route_steps (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.community_routes(id) on delete cascade,
  step_order integer not null,
  mode text not null,
  from_label text not null,
  to_label text not null,
  instruction text not null,
  line_name text,
  duration_minutes integer not null default 0,
  distance_meters integer not null default 0,
  cost numeric(10,2) not null default 0,
  is_estimated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(route_id, step_order)
);

create table if not exists public.gtfs_stops (
  stop_id text primary key,
  stop_code text,
  stop_name text not null,
  stop_desc text,
  stop_lat double precision not null,
  stop_lon double precision not null,
  zone_id text,
  stop_url text,
  location_type integer,
  parent_station text,
  wheelchair_boarding integer,
  platform_code text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.gtfs_routes (
  route_id text primary key,
  agency_id text,
  route_short_name text,
  route_long_name text,
  route_desc text,
  route_type integer,
  route_url text,
  route_color text,
  route_text_color text,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.gtfs_trips (
  trip_id text primary key,
  route_id text references public.gtfs_routes(route_id) on delete cascade,
  service_id text,
  trip_headsign text,
  trip_short_name text,
  direction_id integer,
  block_id text,
  shape_id text,
  wheelchair_accessible integer,
  bikes_allowed integer,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create table if not exists public.gtfs_stop_times (
  trip_id text not null references public.gtfs_trips(trip_id) on delete cascade,
  arrival_time text,
  departure_time text,
  stop_id text not null references public.gtfs_stops(stop_id) on delete cascade,
  stop_sequence integer not null,
  stop_headsign text,
  pickup_type integer,
  drop_off_type integer,
  shape_dist_traveled numeric,
  timepoint integer,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  primary key (trip_id, stop_sequence)
);

create table if not exists public.gtfs_shapes (
  shape_id text not null,
  shape_pt_lat double precision not null,
  shape_pt_lon double precision not null,
  shape_pt_sequence integer not null,
  shape_dist_traveled numeric,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  primary key (shape_id, shape_pt_sequence)
);

create table if not exists public.gtfs_transfers (
  from_stop_id text not null references public.gtfs_stops(stop_id) on delete cascade,
  to_stop_id text not null references public.gtfs_stops(stop_id) on delete cascade,
  transfer_type integer,
  min_transfer_time integer,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  primary key (from_stop_id, to_stop_id)
);

alter table public.transit_places enable row level security;
alter table public.community_routes enable row level security;
alter table public.community_route_steps enable row level security;
alter table public.gtfs_stops enable row level security;
alter table public.gtfs_routes enable row level security;
alter table public.gtfs_trips enable row level security;
alter table public.gtfs_stop_times enable row level security;
alter table public.gtfs_shapes enable row level security;
alter table public.gtfs_transfers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'transit_places' and policyname = 'transit_places_read'
  ) then
    create policy transit_places_read on public.transit_places for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'community_routes' and policyname = 'community_routes_read'
  ) then
    create policy community_routes_read on public.community_routes for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'community_route_steps' and policyname = 'community_route_steps_read'
  ) then
    create policy community_route_steps_read on public.community_route_steps for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_stops' and policyname = 'gtfs_stops_read'
  ) then
    create policy gtfs_stops_read on public.gtfs_stops for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_routes' and policyname = 'gtfs_routes_read'
  ) then
    create policy gtfs_routes_read on public.gtfs_routes for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_trips' and policyname = 'gtfs_trips_read'
  ) then
    create policy gtfs_trips_read on public.gtfs_trips for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_stop_times' and policyname = 'gtfs_stop_times_read'
  ) then
    create policy gtfs_stop_times_read on public.gtfs_stop_times for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_shapes' and policyname = 'gtfs_shapes_read'
  ) then
    create policy gtfs_shapes_read on public.gtfs_shapes for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gtfs_transfers' and policyname = 'gtfs_transfers_read'
  ) then
    create policy gtfs_transfers_read on public.gtfs_transfers for select using (true);
  end if;
end $$;
