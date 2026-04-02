import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data', 'transit');
const outputDir = path.join(root, 'supabase', 'seed');
const outputFile = path.join(outputDir, 'transit_seed.sql');
const chunkDir = path.join(outputDir, 'chunks');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value === null || value === undefined || value === '') return 'null';
  return String(value);
}

function sqlTextArray(values = []) {
  const items = values.map((value) => sqlString(value)).join(', ');
  return `ARRAY[${items}]`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value ?? {}))}::jsonb`;
}

function buildPlaceInsert(place) {
  return `insert into public.transit_places (slug, name, aliases, lat, lng, zone, corridor, source, metadata)
values (${sqlString(place.slug)}, ${sqlString(place.name)}, ${sqlTextArray(place.aliases ?? [])}::text[], ${sqlNumber(place.lat)}, ${sqlNumber(place.lng)}, ${sqlString(place.zone)}, ${sqlString(place.corridor)}, ${sqlString(place.source ?? 'community')}, ${sqlJson(place.metadata)})
on conflict (slug) do update set
  name = excluded.name,
  aliases = excluded.aliases,
  lat = excluded.lat,
  lng = excluded.lng,
  zone = excluded.zone,
  corridor = excluded.corridor,
  source = excluded.source,
  metadata = excluded.metadata,
  updated_at = now();`;
}

function buildCommunityRouteSql(route) {
  const stepStatements = route.steps.map((step) => `insert into public.community_route_steps (
  route_id, step_order, mode, from_label, to_label, instruction, line_name, duration_minutes, distance_meters, cost, is_estimated, metadata
)
select id, ${sqlNumber(step.step_order)}, ${sqlString(step.mode)}, ${sqlString(step.from_label)}, ${sqlString(step.to_label)}, ${sqlString(step.instruction)}, ${sqlString(step.line_name)}, ${sqlNumber(step.duration_minutes)}, ${sqlNumber(step.distance_meters)}, ${sqlNumber(step.cost)}, ${step.is_estimated ? 'true' : 'false'}, ${sqlJson(step.metadata)}
from public.community_routes
where slug = ${sqlString(route.slug)}
on conflict (route_id, step_order) do update set
  mode = excluded.mode,
  from_label = excluded.from_label,
  to_label = excluded.to_label,
  instruction = excluded.instruction,
  line_name = excluded.line_name,
  duration_minutes = excluded.duration_minutes,
  distance_meters = excluded.distance_meters,
  cost = excluded.cost,
  is_estimated = excluded.is_estimated,
  metadata = excluded.metadata;`);

  return [
    `insert into public.community_routes (
  slug, origin_slug, destination_slug, summary, source, confidence, source_url, notes, total_duration, total_cost, total_distance_meters
)
values (
  ${sqlString(route.slug)},
  ${sqlString(route.origin_slug)},
  ${sqlString(route.destination_slug)},
  ${sqlString(route.summary)},
  ${sqlString(route.source ?? 'community')},
  ${sqlString(route.confidence ?? 'community-sourced')},
  ${sqlString(route.source_url)},
  ${sqlString(route.notes)},
  ${sqlNumber(route.total_duration)},
  ${sqlNumber(route.total_cost)},
  ${sqlNumber(route.total_distance_meters)}
)
on conflict (slug) do update set
  origin_slug = excluded.origin_slug,
  destination_slug = excluded.destination_slug,
  summary = excluded.summary,
  source = excluded.source,
  confidence = excluded.confidence,
  source_url = excluded.source_url,
  notes = excluded.notes,
  total_duration = excluded.total_duration,
  total_cost = excluded.total_cost,
  total_distance_meters = excluded.total_distance_meters,
  updated_at = now();`,
    `delete from public.community_route_steps
where route_id in (select id from public.community_routes where slug = ${sqlString(route.slug)});`,
    ...stepStatements,
  ].join('\n');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function buildGtfsSections(gtfsDir) {
  const mappings = [
    {
      fileName: 'agency.txt',
      tableName: 'gtfs_agency',
      rowsPerChunk: 500,
      build: (row) => `insert into public.gtfs_agency (
  agency_id, agency_name, agency_url, agency_timezone, agency_lang, agency_phone, agency_fare_url, agency_email, raw
)
values (
  ${sqlString(row.agency_id)},
  ${sqlString(row.agency_name)},
  ${sqlString(row.agency_url)},
  ${sqlString(row.agency_timezone)},
  ${sqlString(row.agency_lang)},
  ${sqlString(row.agency_phone)},
  ${sqlString(row.agency_fare_url)},
  ${sqlString(row.agency_email)},
  ${sqlJson(row)}
)
on conflict (agency_id) do update set
  agency_name = excluded.agency_name,
  agency_url = excluded.agency_url,
  agency_timezone = excluded.agency_timezone,
  agency_lang = excluded.agency_lang,
  agency_phone = excluded.agency_phone,
  agency_fare_url = excluded.agency_fare_url,
  agency_email = excluded.agency_email,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'calendar.txt',
      tableName: 'gtfs_calendar',
      rowsPerChunk: 1000,
      build: (row) => `insert into public.gtfs_calendar (
  service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date, raw
)
values (
  ${sqlString(row.service_id)},
  ${sqlNumber(row.monday)},
  ${sqlNumber(row.tuesday)},
  ${sqlNumber(row.wednesday)},
  ${sqlNumber(row.thursday)},
  ${sqlNumber(row.friday)},
  ${sqlNumber(row.saturday)},
  ${sqlNumber(row.sunday)},
  ${sqlString(row.start_date)},
  ${sqlString(row.end_date)},
  ${sqlJson(row)}
)
on conflict (service_id) do update set
  monday = excluded.monday,
  tuesday = excluded.tuesday,
  wednesday = excluded.wednesday,
  thursday = excluded.thursday,
  friday = excluded.friday,
  saturday = excluded.saturday,
  sunday = excluded.sunday,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'stops.txt',
      tableName: 'gtfs_stops',
      rowsPerChunk: 500,
      build: (row) => `insert into public.gtfs_stops (
  stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station, wheelchair_boarding, platform_code, raw
)
values (
  ${sqlString(row.stop_id)},
  ${sqlString(row.stop_code)},
  ${sqlString(row.stop_name)},
  ${sqlString(row.stop_desc)},
  ${sqlNumber(row.stop_lat)},
  ${sqlNumber(row.stop_lon)},
  ${sqlString(row.zone_id)},
  ${sqlString(row.stop_url)},
  ${sqlNumber(row.location_type)},
  ${sqlString(row.parent_station)},
  ${sqlNumber(row.wheelchair_boarding)},
  ${sqlString(row.platform_code)},
  ${sqlJson(row)}
)
on conflict (stop_id) do update set
  stop_code = excluded.stop_code,
  stop_name = excluded.stop_name,
  stop_desc = excluded.stop_desc,
  stop_lat = excluded.stop_lat,
  stop_lon = excluded.stop_lon,
  zone_id = excluded.zone_id,
  stop_url = excluded.stop_url,
  location_type = excluded.location_type,
  parent_station = excluded.parent_station,
  wheelchair_boarding = excluded.wheelchair_boarding,
  platform_code = excluded.platform_code,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'routes.txt',
      tableName: 'gtfs_routes',
      rowsPerChunk: 500,
      build: (row) => `insert into public.gtfs_routes (
  route_id, agency_id, route_short_name, route_long_name, route_desc, route_type, route_url, route_color, route_text_color, raw
)
values (
  ${sqlString(row.route_id)},
  ${sqlString(row.agency_id)},
  ${sqlString(row.route_short_name)},
  ${sqlString(row.route_long_name)},
  ${sqlString(row.route_desc)},
  ${sqlNumber(row.route_type)},
  ${sqlString(row.route_url)},
  ${sqlString(row.route_color)},
  ${sqlString(row.route_text_color)},
  ${sqlJson(row)}
)
on conflict (route_id) do update set
  agency_id = excluded.agency_id,
  route_short_name = excluded.route_short_name,
  route_long_name = excluded.route_long_name,
  route_desc = excluded.route_desc,
  route_type = excluded.route_type,
  route_url = excluded.route_url,
  route_color = excluded.route_color,
  route_text_color = excluded.route_text_color,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'trips.txt',
      tableName: 'gtfs_trips',
      rowsPerChunk: 500,
      build: (row) => `insert into public.gtfs_trips (
  trip_id, route_id, service_id, trip_headsign, trip_short_name, direction_id, block_id, shape_id, wheelchair_accessible, bikes_allowed, raw
)
values (
  ${sqlString(row.trip_id)},
  ${sqlString(row.route_id)},
  ${sqlString(row.service_id)},
  ${sqlString(row.trip_headsign)},
  ${sqlString(row.trip_short_name)},
  ${sqlNumber(row.direction_id)},
  ${sqlString(row.block_id)},
  ${sqlString(row.shape_id)},
  ${sqlNumber(row.wheelchair_accessible)},
  ${sqlNumber(row.bikes_allowed)},
  ${sqlJson(row)}
)
on conflict (trip_id) do update set
  route_id = excluded.route_id,
  service_id = excluded.service_id,
  trip_headsign = excluded.trip_headsign,
  trip_short_name = excluded.trip_short_name,
  direction_id = excluded.direction_id,
  block_id = excluded.block_id,
  shape_id = excluded.shape_id,
  wheelchair_accessible = excluded.wheelchair_accessible,
  bikes_allowed = excluded.bikes_allowed,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'stop_times.txt',
      tableName: 'gtfs_stop_times',
      rowsPerChunk: 250,
      build: (row) => `insert into public.gtfs_stop_times (
  trip_id, arrival_time, departure_time, stop_id, stop_sequence, stop_headsign, pickup_type, drop_off_type, shape_dist_traveled, timepoint, raw
)
values (
  ${sqlString(row.trip_id)},
  ${sqlString(row.arrival_time)},
  ${sqlString(row.departure_time)},
  ${sqlString(row.stop_id)},
  ${sqlNumber(row.stop_sequence)},
  ${sqlString(row.stop_headsign)},
  ${sqlNumber(row.pickup_type)},
  ${sqlNumber(row.drop_off_type)},
  ${sqlNumber(row.shape_dist_traveled)},
  ${sqlNumber(row.timepoint)},
  ${sqlJson(row)}
)
on conflict (trip_id, stop_sequence) do update set
  arrival_time = excluded.arrival_time,
  departure_time = excluded.departure_time,
  stop_id = excluded.stop_id,
  stop_headsign = excluded.stop_headsign,
  pickup_type = excluded.pickup_type,
  drop_off_type = excluded.drop_off_type,
  shape_dist_traveled = excluded.shape_dist_traveled,
  timepoint = excluded.timepoint,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'shapes.txt',
      tableName: 'gtfs_shapes',
      rowsPerChunk: 250,
      build: (row) => `insert into public.gtfs_shapes (
  shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled, raw
)
values (
  ${sqlString(row.shape_id)},
  ${sqlNumber(row.shape_pt_lat)},
  ${sqlNumber(row.shape_pt_lon)},
  ${sqlNumber(row.shape_pt_sequence)},
  ${sqlNumber(row.shape_dist_traveled)},
  ${sqlJson(row)}
)
on conflict (shape_id, shape_pt_sequence) do update set
  shape_pt_lat = excluded.shape_pt_lat,
  shape_pt_lon = excluded.shape_pt_lon,
  shape_dist_traveled = excluded.shape_dist_traveled,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'transfers.txt',
      tableName: 'gtfs_transfers',
      rowsPerChunk: 500,
      build: (row) => `insert into public.gtfs_transfers (
  from_stop_id, to_stop_id, transfer_type, min_transfer_time, raw
)
values (
  ${sqlString(row.from_stop_id)},
  ${sqlString(row.to_stop_id)},
  ${sqlNumber(row.transfer_type)},
  ${sqlNumber(row.min_transfer_time)},
  ${sqlJson(row)}
)
on conflict (from_stop_id, to_stop_id) do update set
  transfer_type = excluded.transfer_type,
  min_transfer_time = excluded.min_transfer_time,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'feed_info.txt',
      tableName: 'gtfs_feed_info',
      rowsPerChunk: 100,
      build: (row) => `insert into public.gtfs_feed_info (
  feed_publisher_name, feed_publisher_url, feed_lang, default_lang, feed_start_date, feed_end_date, feed_version, raw
)
values (
  ${sqlString(row.feed_publisher_name)},
  ${sqlString(row.feed_publisher_url)},
  ${sqlString(row.feed_lang)},
  ${sqlString(row.default_lang)},
  ${sqlString(row.feed_start_date)},
  ${sqlString(row.feed_end_date)},
  ${sqlString(row.feed_version)},
  ${sqlJson(row)}
)
on conflict (feed_publisher_name, feed_publisher_url, feed_lang) do update set
  default_lang = excluded.default_lang,
  feed_start_date = excluded.feed_start_date,
  feed_end_date = excluded.feed_end_date,
  feed_version = excluded.feed_version,
  raw = excluded.raw,
  imported_at = now();`,
    },
    {
      fileName: 'frequencies.txt',
      tableName: 'gtfs_frequencies',
      rowsPerChunk: 250,
      build: (row) => `insert into public.gtfs_frequencies (
  trip_id, start_time, end_time, headway_secs, exact_times, raw
)
values (
  ${sqlString(row.trip_id)},
  ${sqlString(row.start_time)},
  ${sqlString(row.end_time)},
  ${sqlNumber(row.headway_secs)},
  ${sqlNumber(row.exact_times)},
  ${sqlJson(row)}
)
on conflict (trip_id, start_time, end_time) do update set
  headway_secs = excluded.headway_secs,
  exact_times = excluded.exact_times,
  raw = excluded.raw,
  imported_at = now();`,
    },
  ];

  const sections = [];

  for (const { fileName, tableName, rowsPerChunk, build } of mappings) {
    const file = path.join(gtfsDir, fileName);
    if (!fs.existsSync(file)) continue;
    const rows = parseCsv(file);
    sections.push({
      tableName,
      fileName,
      rowsPerChunk,
      statements: rows.map(build),
    });
  }

  return sections;
}

function wrapTransaction(statements) {
  return ['begin;', ...statements, 'commit;'].join('\n\n');
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(chunkDir, { recursive: true });
  for (const existingFile of fs.readdirSync(chunkDir)) {
    fs.rmSync(path.join(chunkDir, existingFile), { force: true });
  }

  const places = readJson(path.join(dataDir, 'places.json'));
  const communityRoutes = readJson(path.join(dataDir, 'community-routes.json'));
  const gtfsDirArg = process.argv.find((arg) => arg.startsWith('--gtfs-dir='));
  const gtfsDir = gtfsDirArg ? path.resolve(root, gtfsDirArg.split('=')[1]) : null;

  const baseStatements = [
    '-- Generated by scripts/import-transit-data.mjs',
    ...places.map(buildPlaceInsert),
    ...communityRoutes.map(buildCommunityRouteSql),
  ];

  fs.writeFileSync(outputFile, `${wrapTransaction(baseStatements)}\n`, 'utf8');

  const chunkFiles = [
    {
      name: '001_places_and_community_routes.sql',
      statements: ['-- Generated by scripts/import-transit-data.mjs', ...places.map(buildPlaceInsert), ...communityRoutes.map(buildCommunityRouteSql)],
    },
  ];

  if (gtfsDir) {
    const gtfsSections = buildGtfsSections(gtfsDir);
    let sequence = 2;

    for (const section of gtfsSections) {
      for (let start = 0; start < section.statements.length; start += section.rowsPerChunk) {
        const end = Math.min(start + section.rowsPerChunk, section.statements.length);
        const chunkIndex = Math.floor(start / section.rowsPerChunk) + 1;
        const needsPartSuffix = section.statements.length > section.rowsPerChunk;
        const partSuffix = needsPartSuffix ? `_part_${String(chunkIndex).padStart(2, '0')}` : '';

        chunkFiles.push({
          name: `${String(sequence).padStart(3, '0')}_${section.tableName}${partSuffix}.sql`,
          statements: [
            '-- Generated by scripts/import-transit-data.mjs',
            `-- ${section.tableName} from ${section.fileName}`,
            ...section.statements.slice(start, end),
          ],
        });
        sequence += 1;
      }
    }
  }

  for (const chunk of chunkFiles) {
    fs.writeFileSync(path.join(chunkDir, chunk.name), `${wrapTransaction(chunk.statements)}\n`, 'utf8');
  }

  const runOrderLines = [
    'Run these files in order in the Supabase SQL Editor:',
    '',
    ...chunkFiles.map((chunk) => chunk.name),
  ];
  fs.writeFileSync(path.join(chunkDir, '000_run_order.txt'), `${runOrderLines.join('\n')}\n`, 'utf8');

  console.log(`Wrote ${outputFile}`);
  console.log(`Wrote chunked seed files to ${chunkDir}`);
}

main();
