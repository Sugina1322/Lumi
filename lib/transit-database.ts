import { RouteOption, TransportMode } from './route-algorithm';
import { supabase } from './supabase';

type CommunityRouteRow = {
  slug: string;
  origin_slug: string;
  destination_slug: string;
  summary: string;
  confidence: string;
  source: string;
  source_url: string | null;
  notes: string | null;
  total_duration: number | null;
  total_cost: number | null;
  total_distance_meters: number | null;
  community_route_steps: CommunityRouteStepRow[];
};

type CommunityRouteStepRow = {
  step_order: number;
  mode: TransportMode;
  from_label: string;
  to_label: string;
  instruction: string;
  line_name: string | null;
  duration_minutes: number;
  distance_meters: number;
  cost: number;
  is_estimated: boolean;
};

type CommunityPlaceRow = {
  slug: string;
  name: string;
  aliases: string[] | null;
  lat: number;
  lng: number;
};

type SearchPlaceInput = {
  name: string;
  lat: number;
  lng: number;
  aliases?: string[];
};

type GtfsStopRow = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
};

type GtfsStopTimeRow = {
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  arrival_time: string | null;
  departure_time: string | null;
};

type GtfsTripRow = {
  trip_id: string;
  route_id: string | null;
  trip_headsign: string | null;
  direction_id: number | null;
};

type GtfsRouteRow = {
  route_id: string;
  route_short_name: string | null;
  route_long_name: string | null;
  route_type: number | null;
};

type GtfsFrequencyRow = {
  trip_id: string;
  headway_secs: number;
};

type GtfsTransferRow = {
  from_stop_id: string;
  to_stop_id: string;
  min_transfer_time: number | null;
};

const VALID_MODES: TransportMode[] = [
  'walk',
  'bus',
  'train',
  'subway',
  'jeepney',
  'tricycle',
  'taxi',
  'rideshare',
  'ferry',
  'tram',
];

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function slugify(text: string) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildRouteId(slug: string) {
  return `db-${slug}`;
}

function safeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeMode(value: unknown): TransportMode {
  return VALID_MODES.includes(value as TransportMode) ? (value as TransportMode) : 'walk';
}

function summarizeSteps(steps: RouteOption['steps']) {
  const labels: string[] = [];
  for (const step of steps) {
    if (step.mode === 'walk') continue;
    const label = typeof step.lineName === 'string' && step.lineName.trim().length > 0
      ? step.lineName
      : step.mode;
    if (!labels.includes(label)) labels.push(label);
  }
  return labels.length > 0 ? labels.join(' + ') : 'Structured route';
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function parseGtfsTimeToMinutes(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  return hours * 60 + minutes + Math.round(seconds / 60);
}

function mapRouteTypeToMode(routeType: number | null, routeLabel: string): TransportMode {
  const label = routeLabel.toLowerCase();
  if (label.includes('jeep')) return 'jeepney';
  switch (routeType) {
    case 0:
      return 'tram';
    case 1:
      return 'subway';
    case 2:
      return 'train';
    case 3:
      return 'bus';
    case 4:
      return 'ferry';
    default:
      return 'bus';
  }
}

function estimateGtfsFare(distanceMeters: number, mode: TransportMode) {
  const km = distanceMeters / 1000;
  if (mode === 'train' || mode === 'subway') return Math.max(15, Math.round(15 + km * 2));
  if (mode === 'ferry') return Math.max(20, Math.round(20 + km * 2));
  return Math.max(13, Math.round(12 + km * 1.5));
}

function buildGtfsLabel(route: GtfsRouteRow | undefined, trip: GtfsTripRow | undefined) {
  return route?.route_short_name?.trim()
    || route?.route_long_name?.trim()
    || trip?.trip_headsign?.trim()
    || 'Transit';
}

function buildRouteFromRow(row: CommunityRouteRow): RouteOption {
  const steps = [...(row.community_route_steps ?? [])]
    .sort((a, b) => safeNumber(a.step_order) - safeNumber(b.step_order))
    .map((step) => ({
      mode: safeMode(step.mode),
      from: safeText(step.from_label, 'Origin'),
      to: safeText(step.to_label, 'Destination'),
      instruction: safeText(step.instruction, 'Continue to the next step'),
      durationMinutes: safeNumber(step.duration_minutes),
      distanceMeters: safeNumber(step.distance_meters),
      cost: safeNumber(step.cost),
      lineName: typeof step.line_name === 'string' && step.line_name.trim().length > 0 ? step.line_name : undefined,
    }));

  const duration = safeNumber(row.total_duration, steps.reduce((sum, step) => sum + step.durationMinutes, 0));
  const cost = safeNumber(row.total_cost, steps.reduce((sum, step) => sum + step.cost, 0));
  const walkingMeters = steps.filter((step) => step.mode === 'walk').reduce((sum, step) => sum + step.distanceMeters, 0);
  const transfers = Math.max(0, steps.filter((step) => step.mode !== 'walk').length - 1);
  const waitMinutes = Math.max(0, duration - steps.reduce((sum, step) => sum + step.durationMinutes, 0));

  return {
    id: buildRouteId(safeText(row.slug, 'route')),
    summary: safeText(row.summary, summarizeSteps(steps)),
    steps,
    duration,
    cost,
    transfers,
    walkingMeters,
    waitMinutes,
    comfort: 0.62,
  };
}

export function buildPlaceSlugCandidates(input: string, aliases: string[] = []) {
  return Array.from(new Set([slugify(input), ...aliases.map(slugify)].filter(Boolean)));
}

function mergeStructuredRoutes(routes: RouteOption[], slugPath: string[]) {
  const allSteps = routes.flatMap((route) => route.steps);
  const duration = routes.reduce((sum, route) => sum + route.duration, 0);
  const cost = routes.reduce((sum, route) => sum + route.cost, 0);
  const walkingMeters = routes.reduce((sum, route) => sum + route.walkingMeters, 0);
  const waitMinutes = routes.reduce((sum, route) => sum + route.waitMinutes, 0);
  const transfers = Math.max(0, allSteps.filter((step) => step.mode !== 'walk').length - 1);

  return {
    id: buildRouteId(`path-${slugPath.join('-')}`),
    summary: summarizeSteps(allSteps),
    steps: allSteps,
    duration,
    cost,
    transfers,
    walkingMeters,
    waitMinutes,
    comfort: 0.64,
  } satisfies RouteOption;
}

function dedupeRouteOptions(routes: RouteOption[]) {
  const seen = new Set<string>();
  const deduped: RouteOption[] = [];

  for (const route of routes) {
    const signature = [
      route.summary,
      ...route.steps.map((step) => `${step.mode}:${step.from}:${step.to}:${step.lineName ?? ''}`),
    ].join('|');

    if (seen.has(signature)) continue;
    seen.add(signature);
    deduped.push(route);
  }

  return deduped;
}

function buildSlugAliases(places: CommunityPlaceRow[]) {
  const lookup = new Map<string, string[]>();
  for (const place of places) {
    const keys = buildPlaceSlugCandidates(place.name, place.aliases ?? []);
    for (const key of keys) {
      const current = lookup.get(key) ?? [];
      if (!current.includes(place.slug)) current.push(place.slug);
      lookup.set(key, current);
    }
  }
  return lookup;
}

function pickBestPlace(
  slugs: string[],
  places: CommunityPlaceRow[],
  fallbackPlace?: SearchPlaceInput | null,
) {
  const matched = places.find((place) => slugs.includes(place.slug));
  if (matched) return matched;
  if (!fallbackPlace) return null;
  return {
    slug: slugify(fallbackPlace.name),
    name: fallbackPlace.name,
    aliases: fallbackPlace.aliases ?? null,
    lat: fallbackPlace.lat,
    lng: fallbackPlace.lng,
  } satisfies CommunityPlaceRow;
}

async function fetchNearbyStopsForPlace(place: CommunityPlaceRow, radiusMeters = 800) {
  const latDelta = radiusMeters / 111000;
  const lngDelta = radiusMeters / (111000 * Math.cos((place.lat * Math.PI) / 180));
  const { data, error } = await supabase
    .from('gtfs_stops')
    .select('stop_id, stop_name, stop_lat, stop_lon')
    .gte('stop_lat', place.lat - latDelta)
    .lte('stop_lat', place.lat + latDelta)
    .gte('stop_lon', place.lng - lngDelta)
    .lte('stop_lon', place.lng + lngDelta);

  if (error) throw new Error(`GTFS stop lookup failed: ${error.message}`);

  return ((data ?? []) as GtfsStopRow[])
    .map((stop) => ({
      ...stop,
      walkingMeters: haversineMeters(
        { lat: place.lat, lng: place.lng },
        { lat: safeNumber(stop.stop_lat), lng: safeNumber(stop.stop_lon) },
      ),
    }))
    .filter((stop) => stop.walkingMeters <= radiusMeters)
    .sort((a, b) => a.walkingMeters - b.walkingMeters)
    .slice(0, 12);
}

async function fetchGtfsDirectRoutes(
  originPlace: CommunityPlaceRow | null,
  destinationPlace: CommunityPlaceRow | null,
) {
  if (!originPlace || !destinationPlace) return [] as RouteOption[];

  const [originStops, destinationStops] = await Promise.all([
    fetchNearbyStopsForPlace(originPlace),
    fetchNearbyStopsForPlace(destinationPlace),
  ]);

  if (originStops.length === 0 || destinationStops.length === 0) return [] as RouteOption[];

  const originStopIds = originStops.map((stop) => stop.stop_id);
  const destinationStopIds = destinationStops.map((stop) => stop.stop_id);

  const [{ data: originTimesData, error: originTimesError }, { data: destinationTimesData, error: destinationTimesError }] = await Promise.all([
    supabase
      .from('gtfs_stop_times')
      .select('trip_id, stop_id, stop_sequence, arrival_time, departure_time')
      .in('stop_id', originStopIds),
    supabase
      .from('gtfs_stop_times')
      .select('trip_id, stop_id, stop_sequence, arrival_time, departure_time')
      .in('stop_id', destinationStopIds),
  ]);

  if (originTimesError) throw new Error(`GTFS origin stop_times lookup failed: ${originTimesError.message}`);
  if (destinationTimesError) throw new Error(`GTFS destination stop_times lookup failed: ${destinationTimesError.message}`);

  const originTimes = (originTimesData ?? []) as GtfsStopTimeRow[];
  const destinationTimes = (destinationTimesData ?? []) as GtfsStopTimeRow[];
  const originByTrip = new Map(originTimes.map((row) => [row.trip_id, row]));
  const destinationByTrip = new Map(destinationTimes.map((row) => [row.trip_id, row]));

  const candidateTripIds = Array.from(new Set(
    originTimes
      .map((row) => row.trip_id)
      .filter((tripId) => {
        const originRow = originByTrip.get(tripId);
        const destinationRow = destinationByTrip.get(tripId);
        return !!originRow && !!destinationRow && safeNumber(originRow.stop_sequence) < safeNumber(destinationRow.stop_sequence);
      }),
  )).slice(0, 80);

  if (candidateTripIds.length === 0) return [] as RouteOption[];

  const [{ data: tripsData, error: tripsError }, { data: frequenciesData, error: frequenciesError }] = await Promise.all([
    supabase
      .from('gtfs_trips')
      .select('trip_id, route_id, trip_headsign, direction_id')
      .in('trip_id', candidateTripIds),
    supabase
      .from('gtfs_frequencies')
      .select('trip_id, headway_secs')
      .in('trip_id', candidateTripIds),
  ]);

  if (tripsError) throw new Error(`GTFS trip lookup failed: ${tripsError.message}`);
  if (frequenciesError) throw new Error(`GTFS frequency lookup failed: ${frequenciesError.message}`);

  const trips = (tripsData ?? []) as GtfsTripRow[];
  const routeIds = Array.from(new Set(trips.map((trip) => trip.route_id).filter(Boolean))) as string[];
  const { data: routesData, error: routesError } = await supabase
    .from('gtfs_routes')
    .select('route_id, route_short_name, route_long_name, route_type')
    .in('route_id', routeIds);

  if (routesError) throw new Error(`GTFS route lookup failed: ${routesError.message}`);

  const routes = (routesData ?? []) as GtfsRouteRow[];
  const tripLookup = new Map(trips.map((trip) => [trip.trip_id, trip]));
  const routeLookup = new Map(routes.map((route) => [route.route_id, route]));
  const frequencyLookup = new Map<string, number>();
  for (const row of (frequenciesData ?? []) as GtfsFrequencyRow[]) {
    const current = frequencyLookup.get(row.trip_id);
    if (!current || row.headway_secs < current) frequencyLookup.set(row.trip_id, row.headway_secs);
  }
  const originStopLookup = new Map(originStops.map((stop) => [stop.stop_id, stop]));
  const destinationStopLookup = new Map(destinationStops.map((stop) => [stop.stop_id, stop]));
  const routeOptions: RouteOption[] = [];
  const seen = new Set<string>();

  for (const tripId of candidateTripIds) {
    const originStopTime = originByTrip.get(tripId);
    const destinationStopTime = destinationByTrip.get(tripId);
    const trip = tripLookup.get(tripId);
    if (!originStopTime || !destinationStopTime || !trip?.route_id) continue;

    const originStop = originStopLookup.get(originStopTime.stop_id);
    const destinationStop = destinationStopLookup.get(destinationStopTime.stop_id);
    const route = routeLookup.get(trip.route_id);
    if (!originStop || !destinationStop || !route) continue;

    const routeLabel = buildGtfsLabel(route, trip);
    const mode = mapRouteTypeToMode(route.route_type, routeLabel);
    const dedupeKey = `${trip.route_id}:${originStop.stop_id}:${destinationStop.stop_id}:${trip.direction_id ?? 'x'}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const walkToStopMeters = safeNumber((originStop as GtfsStopRow & { walkingMeters?: number }).walkingMeters);
    const walkFromStopMeters = safeNumber((destinationStop as GtfsStopRow & { walkingMeters?: number }).walkingMeters);
    const rideDistanceMeters = haversineMeters(
      { lat: originStop.stop_lat, lng: originStop.stop_lon },
      { lat: destinationStop.stop_lat, lng: destinationStop.stop_lon },
    );
    const departureMinutes = parseGtfsTimeToMinutes(originStopTime.departure_time ?? originStopTime.arrival_time);
    const arrivalMinutes = parseGtfsTimeToMinutes(destinationStopTime.arrival_time ?? destinationStopTime.departure_time);
    const inVehicleMinutes = departureMinutes !== null && arrivalMinutes !== null && arrivalMinutes > departureMinutes
      ? arrivalMinutes - departureMinutes
      : Math.max(6, Math.round(rideDistanceMeters / 280));
    const waitMinutes = Math.round((frequencyLookup.get(tripId) ?? 600) / 120);
    const walkToMinutes = Math.max(1, Math.round(walkToStopMeters / 75));
    const walkFromMinutes = Math.max(1, Math.round(walkFromStopMeters / 75));
    const fare = estimateGtfsFare(rideDistanceMeters, mode);

    routeOptions.push({
      id: buildRouteId(`gtfs-${tripId}-${originStop.stop_id}-${destinationStop.stop_id}`),
      summary: `${routeLabel} to ${destinationPlace.name}`,
      steps: [
        {
          mode: 'walk',
          from: originPlace.name,
          to: originStop.stop_name,
          instruction: `Walk to ${originStop.stop_name}`,
          durationMinutes: walkToMinutes,
          distanceMeters: Math.round(walkToStopMeters),
          cost: 0,
        },
        {
          mode,
          from: originStop.stop_name,
          to: destinationStop.stop_name,
          instruction: `Ride ${routeLabel}${trip.trip_headsign ? ` toward ${trip.trip_headsign}` : ''}`,
          durationMinutes: inVehicleMinutes,
          distanceMeters: Math.round(rideDistanceMeters),
          cost: fare,
          lineName: routeLabel,
        },
        {
          mode: 'walk',
          from: destinationStop.stop_name,
          to: destinationPlace.name,
          instruction: `Walk to ${destinationPlace.name}`,
          durationMinutes: walkFromMinutes,
          distanceMeters: Math.round(walkFromStopMeters),
          cost: 0,
        },
      ],
      duration: walkToMinutes + inVehicleMinutes + walkFromMinutes + waitMinutes,
      cost: fare,
      transfers: 0,
      walkingMeters: Math.round(walkToStopMeters + walkFromStopMeters),
      waitMinutes,
      comfort: mode === 'train' || mode === 'subway' ? 0.72 : 0.58,
    });
  }

  return routeOptions
    .sort((a, b) => a.duration - b.duration || a.walkingMeters - b.walkingMeters || a.cost - b.cost)
    .slice(0, 5);
}

async function fetchGtfsTransferRoutes(
  originPlace: CommunityPlaceRow | null,
  destinationPlace: CommunityPlaceRow | null,
) {
  if (!originPlace || !destinationPlace) return [] as RouteOption[];

  const [originStops, destinationStops] = await Promise.all([
    fetchNearbyStopsForPlace(originPlace),
    fetchNearbyStopsForPlace(destinationPlace),
  ]);

  if (originStops.length === 0 || destinationStops.length === 0) return [] as RouteOption[];

  const originStopIds = originStops.map((stop) => stop.stop_id);
  const destinationStopIds = destinationStops.map((stop) => stop.stop_id);

  const [{ data: originTimesData, error: originTimesError }, { data: destinationTimesData, error: destinationTimesError }] = await Promise.all([
    supabase
      .from('gtfs_stop_times')
      .select('trip_id, stop_id, stop_sequence, arrival_time, departure_time')
      .in('stop_id', originStopIds),
    supabase
      .from('gtfs_stop_times')
      .select('trip_id, stop_id, stop_sequence, arrival_time, departure_time')
      .in('stop_id', destinationStopIds),
  ]);

  if (originTimesError) throw new Error(`GTFS origin stop_times lookup failed: ${originTimesError.message}`);
  if (destinationTimesError) throw new Error(`GTFS destination stop_times lookup failed: ${destinationTimesError.message}`);

  const originTimes = (originTimesData ?? []) as GtfsStopTimeRow[];
  const destinationTimes = (destinationTimesData ?? []) as GtfsStopTimeRow[];
  const originTripIds = Array.from(new Set(originTimes.map((row) => row.trip_id))).slice(0, 40);
  const destinationTripIds = Array.from(new Set(destinationTimes.map((row) => row.trip_id))).slice(0, 40);

  if (originTripIds.length === 0 || destinationTripIds.length === 0) return [] as RouteOption[];

  const [{ data: firstLegStopTimesData, error: firstLegStopTimesError }, { data: secondLegStopTimesData, error: secondLegStopTimesError }] = await Promise.all([
    supabase
      .from('gtfs_stop_times')
      .select('trip_id, stop_id, stop_sequence, arrival_time, departure_time')
      .in('trip_id', originTripIds),
    supabase
      .from('gtfs_stop_times')
      .select('trip_id, stop_id, stop_sequence, arrival_time, departure_time')
      .in('trip_id', destinationTripIds),
  ]);

  if (firstLegStopTimesError) throw new Error(`GTFS first-leg stop_times lookup failed: ${firstLegStopTimesError.message}`);
  if (secondLegStopTimesError) throw new Error(`GTFS second-leg stop_times lookup failed: ${secondLegStopTimesError.message}`);

  const firstLegStopTimes = (firstLegStopTimesData ?? []) as GtfsStopTimeRow[];
  const secondLegStopTimes = (secondLegStopTimesData ?? []) as GtfsStopTimeRow[];
  const originByTrip = new Map(originTimes.map((row) => [row.trip_id, row]));
  const destinationByTrip = new Map(destinationTimes.map((row) => [row.trip_id, row]));
  const firstLegByTrip = new Map<string, GtfsStopTimeRow[]>();
  const secondLegByTrip = new Map<string, GtfsStopTimeRow[]>();

  for (const row of firstLegStopTimes) {
    const current = firstLegByTrip.get(row.trip_id) ?? [];
    current.push(row);
    firstLegByTrip.set(row.trip_id, current);
  }
  for (const row of secondLegStopTimes) {
    const current = secondLegByTrip.get(row.trip_id) ?? [];
    current.push(row);
    secondLegByTrip.set(row.trip_id, current);
  }

  const tripIds = Array.from(new Set([...originTripIds, ...destinationTripIds]));
  const [{ data: tripsData, error: tripsError }, { data: frequenciesData, error: frequenciesError }] = await Promise.all([
    supabase
      .from('gtfs_trips')
      .select('trip_id, route_id, trip_headsign, direction_id')
      .in('trip_id', tripIds),
    supabase
      .from('gtfs_frequencies')
      .select('trip_id, headway_secs')
      .in('trip_id', tripIds),
  ]);

  if (tripsError) throw new Error(`GTFS trip lookup failed: ${tripsError.message}`);
  if (frequenciesError) throw new Error(`GTFS frequency lookup failed: ${frequenciesError.message}`);

  const trips = (tripsData ?? []) as GtfsTripRow[];
  const routeIds = Array.from(new Set(trips.map((trip) => trip.route_id).filter(Boolean))) as string[];
  const { data: routesData, error: routesError } = await supabase
    .from('gtfs_routes')
    .select('route_id, route_short_name, route_long_name, route_type')
    .in('route_id', routeIds);

  if (routesError) throw new Error(`GTFS route lookup failed: ${routesError.message}`);

  const transferStopIds = Array.from(new Set(
    [...firstLegStopTimes, ...secondLegStopTimes].map((row) => row.stop_id),
  ));
  const [{ data: transferStopsData, error: transferStopsError }, { data: transferLinksData, error: transferLinksError }] = await Promise.all([
    supabase
      .from('gtfs_stops')
      .select('stop_id, stop_name, stop_lat, stop_lon')
      .in('stop_id', transferStopIds),
    supabase
      .from('gtfs_transfers')
      .select('from_stop_id, to_stop_id, min_transfer_time')
      .in('from_stop_id', transferStopIds)
      .in('to_stop_id', transferStopIds),
  ]);

  if (transferStopsError) throw new Error(`GTFS transfer stop lookup failed: ${transferStopsError.message}`);
  if (transferLinksError) throw new Error(`GTFS transfer link lookup failed: ${transferLinksError.message}`);

  const tripsLookup = new Map(trips.map((trip) => [trip.trip_id, trip]));
  const routeLookup = new Map(((routesData ?? []) as GtfsRouteRow[]).map((route) => [route.route_id, route]));
  const stopLookup = new Map(((transferStopsData ?? []) as GtfsStopRow[]).map((stop) => [stop.stop_id, stop]));
  const transferLinkLookup = new Map<string, { stopId: string; minTransferTime: number }[]>();
  for (const link of (transferLinksData ?? []) as GtfsTransferRow[]) {
    const current = transferLinkLookup.get(link.from_stop_id) ?? [];
    current.push({ stopId: link.to_stop_id, minTransferTime: safeNumber(link.min_transfer_time) / 60 });
    transferLinkLookup.set(link.from_stop_id, current);
  }
  const frequencyLookup = new Map<string, number>();
  for (const row of (frequenciesData ?? []) as GtfsFrequencyRow[]) {
    const current = frequencyLookup.get(row.trip_id);
    if (!current || row.headway_secs < current) frequencyLookup.set(row.trip_id, row.headway_secs);
  }
  const originStopLookup = new Map(originStops.map((stop) => [stop.stop_id, stop]));
  const destinationStopLookup = new Map(destinationStops.map((stop) => [stop.stop_id, stop]));
  const results: RouteOption[] = [];
  const seen = new Set<string>();

  for (const firstTripId of originTripIds) {
    const originStopTime = originByTrip.get(firstTripId);
    const firstTrip = tripsLookup.get(firstTripId);
    const firstTripStops = firstLegByTrip.get(firstTripId) ?? [];
    if (!originStopTime || !firstTrip?.route_id || firstTripStops.length === 0) continue;

    for (const secondTripId of destinationTripIds) {
      const destinationStopTime = destinationByTrip.get(secondTripId);
      const secondTrip = tripsLookup.get(secondTripId);
      const secondTripStops = secondLegByTrip.get(secondTripId) ?? [];
      if (!destinationStopTime || !secondTrip?.route_id || secondTripStops.length === 0) continue;
      if (firstTrip.route_id === secondTrip.route_id) continue;

      const secondStopMap = new Map(secondTripStops.map((row) => [row.stop_id, row]));

      for (const transferFromFirst of firstTripStops) {
        if (safeNumber(transferFromFirst.stop_sequence) <= safeNumber(originStopTime.stop_sequence)) continue;
        const transferCandidates = [
          { stopId: transferFromFirst.stop_id, minTransferMinutes: 0 },
          ...(transferLinkLookup.get(transferFromFirst.stop_id) ?? []).map((link) => ({
            stopId: link.stopId,
            minTransferMinutes: Math.max(1, Math.round(link.minTransferTime)),
          })),
        ];

        for (const transferCandidate of transferCandidates) {
          const transferToSecond = secondStopMap.get(transferCandidate.stopId);
          if (!transferToSecond) continue;
          if (safeNumber(transferToSecond.stop_sequence) >= safeNumber(destinationStopTime.stop_sequence)) continue;

          const originStop = originStopLookup.get(originStopTime.stop_id);
          const transferFromStop = stopLookup.get(transferFromFirst.stop_id);
          const transferToStop = stopLookup.get(transferCandidate.stopId);
          const destinationStop = destinationStopLookup.get(destinationStopTime.stop_id);
          const firstRoute = routeLookup.get(firstTrip.route_id);
          const secondRoute = routeLookup.get(secondTrip.route_id);
          if (!originStop || !transferFromStop || !transferToStop || !destinationStop || !firstRoute || !secondRoute) continue;

          const firstLabel = buildGtfsLabel(firstRoute, firstTrip);
          const secondLabel = buildGtfsLabel(secondRoute, secondTrip);
          const dedupeKey = `${firstTrip.route_id}:${secondTrip.route_id}:${originStop.stop_id}:${transferFromStop.stop_id}:${transferToStop.stop_id}:${destinationStop.stop_id}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          const firstMode = mapRouteTypeToMode(firstRoute.route_type, firstLabel);
          const secondMode = mapRouteTypeToMode(secondRoute.route_type, secondLabel);
          const walkToStopMeters = safeNumber((originStop as GtfsStopRow & { walkingMeters?: number }).walkingMeters);
          const walkFromStopMeters = safeNumber((destinationStop as GtfsStopRow & { walkingMeters?: number }).walkingMeters);
          const transferWalkMeters = haversineMeters(
            { lat: transferFromStop.stop_lat, lng: transferFromStop.stop_lon },
            { lat: transferToStop.stop_lat, lng: transferToStop.stop_lon },
          );
          const firstRideMeters = haversineMeters(
            { lat: originStop.stop_lat, lng: originStop.stop_lon },
            { lat: transferFromStop.stop_lat, lng: transferFromStop.stop_lon },
          );
          const secondRideMeters = haversineMeters(
            { lat: transferToStop.stop_lat, lng: transferToStop.stop_lon },
            { lat: destinationStop.stop_lat, lng: destinationStop.stop_lon },
          );
          const firstDeparture = parseGtfsTimeToMinutes(originStopTime.departure_time ?? originStopTime.arrival_time);
          const firstArrival = parseGtfsTimeToMinutes(transferFromFirst.arrival_time ?? transferFromFirst.departure_time);
          const secondDeparture = parseGtfsTimeToMinutes(transferToSecond.departure_time ?? transferToSecond.arrival_time);
          const secondArrival = parseGtfsTimeToMinutes(destinationStopTime.arrival_time ?? destinationStopTime.departure_time);
          const firstRideMinutes = firstDeparture !== null && firstArrival !== null && firstArrival > firstDeparture
            ? firstArrival - firstDeparture
            : Math.max(6, Math.round(firstRideMeters / 280));
          const secondRideMinutes = secondDeparture !== null && secondArrival !== null && secondArrival > secondDeparture
            ? secondArrival - secondDeparture
            : Math.max(6, Math.round(secondRideMeters / 280));
          const transferWalkMinutes = Math.max(
            transferCandidate.minTransferMinutes,
            transferCandidate.stopId === transferFromFirst.stop_id ? 0 : Math.max(1, Math.round(transferWalkMeters / 75)),
          );
          const transferWaitMinutes = firstArrival !== null && secondDeparture !== null && secondDeparture >= firstArrival
            ? Math.max(2, secondDeparture - firstArrival)
            : Math.round((frequencyLookup.get(secondTripId) ?? 600) / 120);
          const initialWaitMinutes = Math.round((frequencyLookup.get(firstTripId) ?? 600) / 120);
          const walkToMinutes = Math.max(1, Math.round(walkToStopMeters / 75));
          const walkFromMinutes = Math.max(1, Math.round(walkFromStopMeters / 75));
          const firstFare = estimateGtfsFare(firstRideMeters, firstMode);
          const secondFare = estimateGtfsFare(secondRideMeters, secondMode);

          const steps: RouteOption['steps'] = [
            {
              mode: 'walk',
              from: originPlace.name,
              to: originStop.stop_name,
              instruction: `Walk to ${originStop.stop_name}`,
              durationMinutes: walkToMinutes,
              distanceMeters: Math.round(walkToStopMeters),
              cost: 0,
            },
            {
              mode: firstMode,
              from: originStop.stop_name,
              to: transferFromStop.stop_name,
              instruction: `Ride ${firstLabel}${firstTrip.trip_headsign ? ` toward ${firstTrip.trip_headsign}` : ''}`,
              durationMinutes: firstRideMinutes,
              distanceMeters: Math.round(firstRideMeters),
              cost: firstFare,
              lineName: firstLabel,
            },
          ];

          if (transferCandidate.stopId !== transferFromFirst.stop_id) {
            steps.push({
              mode: 'walk',
              from: transferFromStop.stop_name,
              to: transferToStop.stop_name,
              instruction: `Transfer on foot to ${transferToStop.stop_name}`,
              durationMinutes: transferWalkMinutes,
              distanceMeters: Math.round(transferWalkMeters),
              cost: 0,
            });
          }

          steps.push(
            {
              mode: secondMode,
              from: transferToStop.stop_name,
              to: destinationStop.stop_name,
              instruction: `Transfer to ${secondLabel}${secondTrip.trip_headsign ? ` toward ${secondTrip.trip_headsign}` : ''}`,
              durationMinutes: secondRideMinutes,
              distanceMeters: Math.round(secondRideMeters),
              cost: secondFare,
              lineName: secondLabel,
            },
            {
              mode: 'walk',
              from: destinationStop.stop_name,
              to: destinationPlace.name,
              instruction: `Walk to ${destinationPlace.name}`,
              durationMinutes: walkFromMinutes,
              distanceMeters: Math.round(walkFromStopMeters),
              cost: 0,
            },
          );

          results.push({
            id: buildRouteId(`gtfs-transfer-${firstTripId}-${secondTripId}-${transferFromStop.stop_id}-${transferToStop.stop_id}`),
            summary: `${firstLabel} + ${secondLabel}`,
            steps,
            duration: walkToMinutes + firstRideMinutes + transferWalkMinutes + transferWaitMinutes + secondRideMinutes + walkFromMinutes + initialWaitMinutes,
            cost: firstFare + secondFare,
            transfers: 1,
            walkingMeters: Math.round(walkToStopMeters + transferWalkMeters + walkFromStopMeters),
            waitMinutes: initialWaitMinutes + transferWaitMinutes,
            comfort: firstMode === 'train' && secondMode === 'train' ? 0.68 : 0.54,
          });
        }
      }
    }
  }

  return results
    .sort((a, b) => a.duration - b.duration || a.walkingMeters - b.walkingMeters || a.cost - b.cost)
    .slice(0, 5);
}

function findChainedRoutes(
  routes: CommunityRouteRow[],
  originSlugs: string[],
  destinationSlugs: string[],
) {
  const routeMap = new Map<string, RouteOption>();
  const adjacency = new Map<string, CommunityRouteRow[]>();

  for (const row of routes) {
    routeMap.set(row.slug, buildRouteFromRow(row));
    const current = adjacency.get(row.origin_slug) ?? [];
    current.push(row);
    adjacency.set(row.origin_slug, current);
  }

  const results: RouteOption[] = [];
  const queue = originSlugs.map((slug) => ({ current: slug, path: [] as CommunityRouteRow[], visited: new Set<string>([slug]) }));

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node.path.length >= 4) continue;

    for (const next of adjacency.get(node.current) ?? []) {
      if (node.visited.has(next.destination_slug)) continue;
      const nextPath = [...node.path, next];

      if (destinationSlugs.includes(next.destination_slug)) {
        const routeOptions = nextPath
          .map((route) => routeMap.get(route.slug))
          .filter(Boolean) as RouteOption[];
        results.push(mergeStructuredRoutes(routeOptions, nextPath.map((route) => route.slug)));
      } else {
        const visited = new Set(node.visited);
        visited.add(next.destination_slug);
        queue.push({
          current: next.destination_slug,
          path: nextPath,
          visited,
        });
      }
    }
  }

  return results.sort((a, b) => a.duration - b.duration || a.cost - b.cost).slice(0, 5);
}

export async function fetchDatabaseRoutes(
  originCandidates: string[],
  destinationCandidates: string[],
  options?: {
    originPlace?: SearchPlaceInput | null;
    destinationPlace?: SearchPlaceInput | null;
  },
) {
  if (originCandidates.length === 0 || destinationCandidates.length === 0) {
    return {
      routes: [],
      message: null as string | null,
      supportedOrigin: false,
      supportedDestination: false,
    };
  }

  const [{ data: routesData, error: routesError }, { data: placesData, error: placesError }] = await Promise.all([
    supabase
      .from('community_routes')
      .select(`
        slug,
        origin_slug,
        destination_slug,
        summary,
        confidence,
        source,
        source_url,
        notes,
        total_duration,
        total_cost,
        total_distance_meters,
        community_route_steps (
          step_order,
          mode,
          from_label,
          to_label,
          instruction,
          line_name,
          duration_minutes,
          distance_meters,
          cost,
          is_estimated
        )
      `)
      .eq('is_active', true),
    supabase
      .from('transit_places')
      .select('slug, name, aliases, lat, lng'),
  ]);

  if (routesError) {
    return { routes: [], message: `Database route lookup failed: ${routesError.message}`, supportedOrigin: false, supportedDestination: false };
  }

  if (placesError) {
    return { routes: [], message: `Transit place lookup failed: ${placesError.message}`, supportedOrigin: false, supportedDestination: false };
  }

  const allRoutes = (routesData ?? []) as CommunityRouteRow[];
  const allPlaces = (placesData ?? []) as CommunityPlaceRow[];
  const aliasLookup = buildSlugAliases(allPlaces);
  const expandedOriginSlugs = Array.from(new Set(originCandidates.flatMap((candidate) => aliasLookup.get(candidate) ?? [candidate])));
  const expandedDestinationSlugs = Array.from(new Set(destinationCandidates.flatMap((candidate) => aliasLookup.get(candidate) ?? [candidate])));
  const supportedOrigin = expandedOriginSlugs.some((slug) => allPlaces.some((place) => place.slug === slug)) || !!options?.originPlace;
  const supportedDestination = expandedDestinationSlugs.some((slug) => allPlaces.some((place) => place.slug === slug)) || !!options?.destinationPlace;

  const exactRows = allRoutes.filter((row) => expandedOriginSlugs.includes(row.origin_slug) && expandedDestinationSlugs.includes(row.destination_slug));
  if (exactRows.length > 0) {
    return {
      routes: exactRows.map(buildRouteFromRow),
      message: 'Routes loaded from Lumi community transit data.',
      supportedOrigin,
      supportedDestination,
    };
  }

  const chainedRoutes = findChainedRoutes(allRoutes, expandedOriginSlugs, expandedDestinationSlugs);
  if (chainedRoutes.length > 0) {
    return {
      routes: chainedRoutes,
      message: 'Routes assembled from Lumi community transit links.',
      supportedOrigin,
      supportedDestination,
    };
  }

  const originPlace = pickBestPlace(expandedOriginSlugs, allPlaces, options?.originPlace);
  const destinationPlace = pickBestPlace(expandedDestinationSlugs, allPlaces, options?.destinationPlace);

  try {
    const [gtfsDirectRoutes, gtfsTransferRoutes] = await Promise.all([
      fetchGtfsDirectRoutes(originPlace, destinationPlace),
      fetchGtfsTransferRoutes(originPlace, destinationPlace),
    ]);
    const gtfsRoutes = dedupeRouteOptions([...gtfsDirectRoutes, ...gtfsTransferRoutes])
      .sort((a, b) => a.duration - b.duration || a.transfers - b.transfers || a.walkingMeters - b.walkingMeters || a.cost - b.cost)
      .slice(0, 5);

    if (gtfsRoutes.length > 0) {
      return {
        routes: gtfsRoutes,
        message: gtfsTransferRoutes.length > 0
          ? 'Routes loaded from GTFS transit trips, including transfer options.'
          : 'Routes loaded from GTFS transit trips between nearby stops.',
        supportedOrigin,
        supportedDestination,
      };
    }
  } catch (error) {
    return {
      routes: [],
      message: error instanceof Error ? error.message : 'GTFS route lookup failed.',
      supportedOrigin,
      supportedDestination,
    };
  }

  const { data, error } = await supabase
    .from('community_routes')
    .select(`
      slug,
      origin_slug,
      destination_slug,
      summary,
      confidence,
      source,
      source_url,
      notes,
      total_duration,
      total_cost,
      total_distance_meters,
      community_route_steps (
        step_order,
        mode,
        from_label,
        to_label,
        instruction,
        line_name,
        duration_minutes,
        distance_meters,
        cost,
        is_estimated
      )
    `)
    .eq('is_active', true)
    .in('origin_slug', originCandidates)
    .in('destination_slug', destinationCandidates);

  if (error) {
    return { routes: [], message: `Database route lookup failed: ${error.message}`, supportedOrigin, supportedDestination };
  }

  const rows = (data ?? []) as CommunityRouteRow[];
  const filtered = rows.filter((row) => originCandidates.includes(row.origin_slug) && destinationCandidates.includes(row.destination_slug));

  return {
    routes: filtered.map(buildRouteFromRow),
    message: filtered.length > 0 ? 'Routes loaded from your structured local transit data.' : null,
    supportedOrigin,
    supportedDestination,
  };
}
