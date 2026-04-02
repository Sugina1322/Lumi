/**
 * Transit data provider.
 *
 * Uses Google Routes API when EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY is present.
 * Falls back to distance-based estimates when live routing is unavailable.
 */

import { RouteOption, TransportMode } from './route-algorithm';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { buildPlaceSlugCandidates, fetchDatabaseRoutes } from './transit-database';
import { TravelModePreference } from './preferences';

export interface Location {
  name: string;
  lat: number;
  lng: number;
  aliases?: string[];
  zone?: 'quezon-city' | 'cubao' | 'marikina' | 'pasig' | 'ortigas' | 'makati' | 'manila' | 'south';
  corridor?: 'marcos-highway' | 'ortigas-avenue' | 'c5' | 'commonwealth' | 'edsa';
}

export const KNOWN_LOCATIONS: Location[] = [
  { name: 'SM North EDSA', lat: 14.6567, lng: 121.0295 },
  { name: 'Makati CBD', lat: 14.5547, lng: 121.0244 },
  { name: 'BGC High Street', lat: 14.5500, lng: 121.0509 },
  { name: 'Quezon City Hall', lat: 14.6328, lng: 121.0451 },
  { name: 'UP Diliman', lat: 14.6537, lng: 121.0684, zone: 'quezon-city', corridor: 'commonwealth' },
  { name: 'Ateneo de Manila University', lat: 14.6398, lng: 121.0770, aliases: ['Ateneo'], zone: 'quezon-city', corridor: 'marcos-highway' },
  { name: 'Miriam College', lat: 14.6382, lng: 121.0765, zone: 'quezon-city', corridor: 'marcos-highway' },
  { name: 'Trinoma', lat: 14.6535, lng: 121.0330, zone: 'quezon-city', corridor: 'edsa' },
  { name: 'Quezon Memorial Circle', lat: 14.6507, lng: 121.0494, aliases: ['QC Circle'], zone: 'quezon-city', corridor: 'commonwealth' },
  { name: 'Commonwealth Market', lat: 14.7001, lng: 121.0878, zone: 'quezon-city', corridor: 'commonwealth' },
  { name: 'Ever Gotesco Commonwealth', lat: 14.6765, lng: 121.0858, zone: 'quezon-city', corridor: 'commonwealth' },
  { name: 'Fairview Terraces', lat: 14.7349, lng: 121.0584, zone: 'quezon-city', corridor: 'commonwealth' },
  { name: 'SM Fairview', lat: 14.7342, lng: 121.0561, zone: 'quezon-city', corridor: 'commonwealth' },
  { name: 'Cubao Gateway', lat: 14.6194, lng: 121.0531, aliases: ['Gateway Cubao', 'Gateway'], zone: 'cubao', corridor: 'edsa' },
  { name: 'Ali Mall Cubao', lat: 14.6206, lng: 121.0539, aliases: ['Ali Mall'], zone: 'cubao', corridor: 'edsa' },
  { name: 'East Avenue Medical Center', lat: 14.6378, lng: 121.0479, aliases: ['East Ave Medical Center', 'EAMC'], zone: 'quezon-city', corridor: 'edsa' },
  { name: 'St. Luke\'s Medical Center Quezon City', lat: 14.6248, lng: 121.0405, aliases: ['St Lukes QC', 'St. Lukes QC'], zone: 'quezon-city', corridor: 'edsa' },
  { name: 'Araneta City Cubao', lat: 14.6213, lng: 121.0537, aliases: ['Araneta Cubao', 'Cubao'], zone: 'cubao', corridor: 'edsa' },
  { name: 'Manila City Hall', lat: 14.5896, lng: 120.9842 },
  { name: 'MOA Complex', lat: 14.5351, lng: 120.9832 },
  { name: 'Ortigas Center', lat: 14.5880, lng: 121.0614, aliases: ['Ortigas'], zone: 'ortigas', corridor: 'ortigas-avenue' },
  { name: 'SM Megamall', lat: 14.5849, lng: 121.0567, aliases: ['Megamall'], zone: 'ortigas', corridor: 'ortigas-avenue' },
  { name: 'Robinsons Galleria Ortigas', lat: 14.5895, lng: 121.0597, aliases: ['Rob Galleria', 'Galleria Ortigas'], zone: 'ortigas', corridor: 'ortigas-avenue' },
  { name: 'Shangri-La Plaza', lat: 14.5812, lng: 121.0536, aliases: ['Shang', 'Shang Plaza'], zone: 'ortigas', corridor: 'edsa' },
  { name: 'Capitol Commons', lat: 14.5720, lng: 121.0636, zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Tiendesitas', lat: 14.5768, lng: 121.0781, zone: 'pasig', corridor: 'c5' },
  { name: 'Arcovia City', lat: 14.5788, lng: 121.0805, zone: 'pasig', corridor: 'c5' },
  { name: 'Pasig City Hall', lat: 14.5614, lng: 121.0781, aliases: ['Pasig Palengke', 'Pasig Hall'], zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Ayala Malls The 30th', lat: 14.5842, lng: 121.0634, aliases: ['The 30th'], zone: 'ortigas', corridor: 'ortigas-avenue' },
  { name: 'PhilSports Arena', lat: 14.5762, lng: 121.0662, aliases: ['Ultra'], zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Rosario Pasig', lat: 14.5885, lng: 121.0837, aliases: ['Rosario'], zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Jennys Avenue', lat: 14.5765, lng: 121.0846, aliases: ['Jenny\'s', 'Jennys'], zone: 'pasig', corridor: 'c5' },
  { name: 'Manggahan Pasig', lat: 14.6052, lng: 121.0932, aliases: ['Manggahan'], zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Napico Manggahan', lat: 14.6075, lng: 121.0966, aliases: ['Napico', 'Napico Pasig'], zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Gate 5 Karangalan', lat: 14.6148, lng: 121.1018, aliases: ['Karangalan', 'Gate 5', 'Karangalan Gate 5'], zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Cainta Junction', lat: 14.6046, lng: 121.1057, aliases: ['Junction'], zone: 'pasig', corridor: 'ortigas-avenue' },
  { name: 'Cubao Araneta', lat: 14.6218, lng: 121.0530, aliases: ['Araneta Center Cubao'], zone: 'cubao', corridor: 'edsa' },
  { name: 'Alabang Town Center', lat: 14.4235, lng: 121.0479 },
  { name: 'Eastwood City', lat: 14.6108, lng: 121.0800, zone: 'pasig', corridor: 'c5' },
  { name: 'Marikina Sports Center', lat: 14.6397, lng: 121.1020, aliases: ['Marikina Sports'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'Marikina River Park', lat: 14.6405, lng: 121.0978, aliases: ['River Park'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'SM City Marikina', lat: 14.6325, lng: 121.0943, aliases: ['SM Marikina'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'Riverbanks Center', lat: 14.6356, lng: 121.0995, aliases: ['Riverbanks'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'Marikina Public Market', lat: 14.6500, lng: 121.1027, aliases: ['Marikina Bayan', 'Bayan Marikina'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'Ayala Malls Marikina', lat: 14.6297, lng: 121.1019, aliases: ['Ayala Marikina'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'Ligaya', lat: 14.6265, lng: 121.0916, aliases: ['Ligaya Marikina'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'Santolan Pasig', lat: 14.6134, lng: 121.0907, aliases: ['Santolan Area'], zone: 'pasig', corridor: 'marcos-highway' },
  { name: 'Sta. Lucia East Grand Mall', lat: 14.6191, lng: 121.1017, aliases: ['Sta Lucia', 'Sta. Lucia'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'LRT-2 Santolan Station', lat: 14.6223, lng: 121.0864, aliases: ['Santolan Station', 'Santolan LRT'], zone: 'marikina', corridor: 'marcos-highway' },
  { name: 'Shibuya, Tokyo', lat: 35.6580, lng: 139.7016 },
  { name: 'Myeongdong, Seoul', lat: 37.5636, lng: 126.9869 },
  { name: 'Orchard Rd, Singapore', lat: 1.3048, lng: 103.8318 },
];

const GOOGLE_ROUTES_API_KEY = (process.env.EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY ?? '').trim();
const GOOGLE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const ANDROID_PACKAGE_NAME = 'com.sugina.lumi';
const ANDROID_CERT_SHA1 = (process.env.EXPO_PUBLIC_ANDROID_CERT_SHA1 ?? 'BE:07:D2:06:8C:3E:89:1A:BB:46:06:EB:F4:12:65:BB:F1:AB:2B:F6')
  .replace(/[^a-fA-F0-9]/g, '')
  .toUpperCase();

function isExpoGo() {
  return Constants.executionEnvironment === 'storeClient';
}

function fieldMaskForMode(travelMode: 'TRANSIT' | 'DRIVE' | 'WALK') {
  return travelMode === 'TRANSIT'
    ? 'routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.distanceMeters,routes.legs.steps.navigationInstruction,routes.legs.steps.transitDetails,routes.legs.steps.travelMode,routes.travelAdvisory.transitFare'
    : 'routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.distanceMeters,routes.legs.steps.navigationInstruction';
}

type LatLng = { latitude: number; longitude: number };

type GoogleRoutesResponse = {
  routes?: GoogleRoute[];
};

type GoogleRoute = {
  distanceMeters?: number;
  duration?: string;
  legs?: GoogleLeg[];
  travelAdvisory?: {
    transitFare?: GoogleFare;
  };
};

type GoogleLeg = {
  distanceMeters?: number;
  duration?: string;
  startLocation?: { latLng?: LatLng };
  endLocation?: { latLng?: LatLng };
  steps?: GoogleStep[];
  travelAdvisory?: {
    transitFare?: GoogleFare;
  };
};

type GoogleStep = {
  distanceMeters?: number;
  duration?: string;
  staticDuration?: string;
  travelMode?: string;
  navigationInstruction?: {
    instructions?: string;
  };
  transitDetails?: {
    headsign?: string;
    stopDetails?: {
      departureStop?: {
        name?: string;
        location?: { latLng?: LatLng };
      };
      arrivalStop?: {
        name?: string;
        location?: { latLng?: LatLng };
      };
    };
    transitLine?: {
      name?: string;
      nameShort?: string;
      vehicle?: {
        type?: string;
        name?: {
          text?: string;
        };
      };
    };
  };
};

type GoogleFare = {
  currencyCode?: string;
  units?: string;
  nanos?: number;
};

export type RouteSource = 'database' | 'live' | 'fallback';

export type RouteFetchResult = {
  routes: RouteOption[];
  source: RouteSource;
  message?: string;
};

let idCounter = 0;

function nextId() {
  return `route-${++idCounter}`;
}

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toWaypoint(query: string, location?: Location | null) {
  if (location) {
    return {
      location: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng,
        },
      },
    };
  }

  return { address: query };
}

function findKnownLocation(query: string): Location | null {
  const q = normalize(query);
  return KNOWN_LOCATIONS.find((loc) => {
    const terms = [loc.name, ...(loc.aliases ?? [])].map(normalize);
    return terms.some((term) => term === q || term.includes(q) || q.includes(term));
  }) ?? null;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function parseDurationSeconds(value?: string): number {
  if (!value) return 0;
  const match = value.match(/^([0-9.]+)s$/);
  if (!match) return 0;
  return Math.round(Number(match[1]));
}

function secondsToMinutes(value?: string): number {
  return Math.max(1, Math.round(parseDurationSeconds(value) / 60));
}

function stepDurationToMinutes(step: GoogleStep) {
  return secondsToMinutes(step.staticDuration ?? step.duration);
}

function googleFareToPhp(fare?: GoogleFare): number | null {
  if (!fare) return null;
  const units = Number(fare.units ?? 0);
  const nanos = Number(fare.nanos ?? 0) / 1_000_000_000;
  const total = units + nanos;
  if (!Number.isFinite(total) || total <= 0) return null;
  return Math.round(total);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mapVehicleType(type?: string): TransportMode {
  switch ((type ?? '').toUpperCase()) {
    case 'BUS':
      return 'bus';
    case 'SUBWAY':
    case 'LIGHT_RAIL':
    case 'RAIL':
    case 'TRAIN':
      return 'train';
    case 'FERRY':
      return 'ferry';
    case 'TRAM':
      return 'tram';
    default:
      return 'train';
  }
}

function transitLabel(step: GoogleStep) {
  const line = step.transitDetails?.transitLine;
  const vehicleType = line?.vehicle?.type ?? 'TRANSIT';
  const vehicleName = line?.vehicle?.name?.text?.trim();
  return line?.nameShort?.trim()
    || line?.name?.trim()
    || vehicleName
    || vehicleType.toLowerCase();
}

function buildStep(
  mode: TransportMode,
  from: string,
  to: string,
  instruction: string,
  durationMinutes: number,
  distanceMeters: number,
  cost: number,
  lineName?: string,
) {
  return { mode, from, to, instruction, durationMinutes, distanceMeters, cost, lineName };
}

function buildRoute(
  summary: string,
  steps: ReturnType<typeof buildStep>[],
  comfort: number,
  overrides?: {
    duration?: number;
    cost?: number;
    transfers?: number;
    walkingMeters?: number;
    waitMinutes?: number;
  },
) {
  const duration = overrides?.duration ?? steps.reduce((sum, step) => sum + step.durationMinutes, 0);
  const cost = overrides?.cost ?? steps.reduce((sum, step) => sum + step.cost, 0);
  const walkingMeters = overrides?.walkingMeters ?? steps.filter((step) => step.mode === 'walk').reduce((sum, step) => sum + step.distanceMeters, 0);
  const transitSegments = steps.filter((step) => step.mode !== 'walk');

  return {
    id: nextId(),
    summary,
    steps,
    duration,
    cost,
    transfers: overrides?.transfers ?? Math.max(0, transitSegments.length - 1),
    walkingMeters,
    waitMinutes: overrides?.waitMinutes ?? Math.max(0, duration - walkingMeters / 75 - transitSegments.reduce((sum, step) => sum + step.durationMinutes, 0)),
    comfort: clamp(comfort, 0.05, 0.98),
  } satisfies RouteOption;
}

function buildRouteSummaryFromSteps(steps: ReturnType<typeof buildStep>[]) {
  const labels: string[] = [];
  for (const step of steps) {
    if (step.mode === 'walk') continue;
    const label = step.lineName?.trim()
      || (step.mode === 'jeepney' ? 'Jeepney' : step.mode === 'tricycle' ? 'Tricycle' : step.mode === 'bus' ? 'Bus' : step.mode === 'train' ? 'Train' : step.mode);
    if (!labels.includes(label)) labels.push(label);
  }
  if (labels.length === 0) return 'Transit route';
  return labels.join(' + ');
}

function buildTransitRoute(route: GoogleRoute, from: string, to: string, index: number): RouteOption | null {
  const leg = route.legs?.[0];
  const steps = leg?.steps ?? [];
  if (steps.length === 0) return null;

  let transitMinutes = 0;
  let walkingMinutes = 0;
  let walkingMeters = 0;
  let transitStops = 0;
  const parsedSteps = steps.map((step) => {
    const durationMinutes = stepDurationToMinutes(step);
    const distanceMeters = Math.max(0, Math.round(step.distanceMeters ?? 0));

    if (step.transitDetails) {
      transitStops += 1;
      transitMinutes += durationMinutes;

      const dep = step.transitDetails.stopDetails?.departureStop?.name?.trim() || from;
      const arr = step.transitDetails.stopDetails?.arrivalStop?.name?.trim() || to;
      const label = transitLabel(step);
      const lineName = label;
      const headsign = step.transitDetails.headsign?.trim() || arr;
      const mode = mapVehicleType(step.transitDetails.transitLine?.vehicle?.type);

      return buildStep(
        mode,
        dep,
        arr,
        `Take ${label} toward ${headsign}`,
        durationMinutes,
        distanceMeters,
        0,
        lineName,
      );
    }

    walkingMinutes += durationMinutes;
    walkingMeters += distanceMeters;
    const instruction = step.navigationInstruction?.instructions?.trim()
      || `Walk from ${from} to ${to}`;

    return buildStep('walk', from, to, instruction, durationMinutes, distanceMeters, 0);
  });

  const fare = googleFareToPhp(route.travelAdvisory?.transitFare) ?? googleFareToPhp(leg?.travelAdvisory?.transitFare);
  const totalDuration = secondsToMinutes(route.duration ?? leg?.duration);
  const totalDistance = Math.max(0, Math.round(route.distanceMeters ?? leg?.distanceMeters ?? 0));
  const totalCost = fare ?? estimateTransitFare(totalDistance, transitStops);
  const waitMinutes = Math.max(0, totalDuration - transitMinutes - walkingMinutes);
  const comfort = clamp(
    0.55 + transitStops * 0.06 - (walkingMeters / 1000) * 0.04 - Math.max(0, transitStops - 2) * 0.05,
    0.15,
    0.95,
  );

  let fareApplied = false;
  const fullyPricedSteps = parsedSteps.map((step) => {
    if (step.mode !== 'walk' && !fareApplied) {
      fareApplied = true;
      return { ...step, cost: totalCost };
    }
    return step;
  });

  return buildRoute(
    buildRouteSummaryFromSteps(fullyPricedSteps),
    fullyPricedSteps,
    comfort,
    {
      duration: totalDuration,
      cost: totalCost,
      waitMinutes,
    },
  );
}

function buildWalkRoute(route: GoogleRoute, from: string, to: string): RouteOption | null {
  const leg = route.legs?.[0];
  const totalDuration = secondsToMinutes(route.duration ?? leg?.duration);
  const totalDistance = Math.max(0, Math.round(route.distanceMeters ?? leg?.distanceMeters ?? 0));
  if (!totalDuration || !totalDistance) return null;

  return buildRoute(
    `Walk direct to ${to}`,
    [
      buildStep(
        'walk',
        from,
        to,
        `Walk directly to ${to}`,
        totalDuration,
        totalDistance,
        0,
      ),
    ],
    clamp(0.9 - (totalDistance / 1000) * 0.08, 0.2, 0.9),
    {
      duration: totalDuration,
      cost: 0,
      waitMinutes: 0,
    },
  );
}

function estimateTransitFare(distanceMeters: number, transitStops: number) {
  const km = distanceMeters / 1000;
  return Math.max(13, Math.round(10 + km * 4 + transitStops * 6));
}

async function fetchGoogleRoutes(
  from: string,
  to: string,
  travelMode: 'TRANSIT' | 'DRIVE' | 'WALK',
  options?: {
    computeAlternativeRoutes?: boolean;
    transitRoutingPreference?: 'LESS_WALKING' | 'FEWER_TRANSFERS';
    originLocation?: Location | null;
    destinationLocation?: Location | null;
  },
): Promise<{ data: GoogleRoutesResponse | null; error?: string }> {
  if (!GOOGLE_ROUTES_API_KEY) return { data: null, error: 'Missing Google Routes API key.' };

  const body: Record<string, unknown> = {
    origin: toWaypoint(from, options?.originLocation),
    destination: toWaypoint(to, options?.destinationLocation),
    travelMode,
    languageCode: 'en',
    units: 'METRIC',
  };

  if (options?.computeAlternativeRoutes) {
    body.computeAlternativeRoutes = true;
  }

  if (travelMode === 'TRANSIT' && options?.transitRoutingPreference) {
    body.transitPreferences = {
      routingPreference: options.transitRoutingPreference,
    };
  }

  const fieldMask = fieldMaskForMode(travelMode);

  const response = await fetch(GOOGLE_ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_ROUTES_API_KEY,
      'X-Goog-FieldMask': fieldMask,
      ...(Platform.OS === 'android'
        ? {
            'X-Android-Package': ANDROID_PACKAGE_NAME,
            'X-Android-Cert': ANDROID_CERT_SHA1,
          }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return {
      data: null,
      error: `Routes API request failed (${response.status}). ${detail || response.statusText}`.trim(),
    };
  }

  return { data: (await response.json()) as GoogleRoutesResponse };
}

async function fetchGoogleRoutesViaProxy(
  from: string,
  to: string,
  travelMode: 'TRANSIT' | 'DRIVE' | 'WALK',
  options?: {
    computeAlternativeRoutes?: boolean;
    transitRoutingPreference?: 'LESS_WALKING' | 'FEWER_TRANSFERS';
    originLocation?: Location | null;
    destinationLocation?: Location | null;
  },
): Promise<{ data: GoogleRoutesResponse | null; error?: string }> {
  const { data, error } = await supabase.functions.invoke('google-routes', {
    body: {
      from,
      to,
      travelMode,
      options,
      originLatLng: options?.originLocation
        ? { latitude: options.originLocation.lat, longitude: options.originLocation.lng }
        : undefined,
      destinationLatLng: options?.destinationLocation
        ? { latitude: options.destinationLocation.lat, longitude: options.destinationLocation.lng }
        : undefined,
      fieldMask: fieldMaskForMode(travelMode),
    },
  });

  if (error) {
    return { data: null, error: `Routes proxy failed. ${error.message}`.trim() };
  }

  if (!data) {
    return { data: null, error: 'Routes proxy returned an empty response.' };
  }

  if (typeof data === 'object' && data && 'error' in data) {
    const proxyError = (data as { error?: string }).error;
    return { data: null, error: proxyError || 'Routes proxy returned an error.' };
  }

  return { data: data as GoogleRoutesResponse };
}

function buildFallbackRoutes(from: string, to: string): RouteOption[] {
  const origin = findKnownLocation(from);
  const destination = findKnownLocation(to);
  const distanceMeters = origin && destination
    ? haversineMeters(origin, destination)
    : Math.max(2500, Math.min(25000, (from.length + to.length) * 120));

  const distanceKm = distanceMeters / 1000;
  const urbanMinutes = Math.max(8, Math.round(distanceMeters / 280));
  const walkMinutes = Math.max(20, Math.round(distanceMeters / 75));
  const transitMinutes = Math.max(18, Math.round(distanceMeters / 210));

  const routes: RouteOption[] = [
    buildRoute(
      'Transit mix',
      [
        buildStep('walk', from, `${from} stop`, 'Walk to the nearest transit stop', Math.max(4, Math.round(distanceMeters * 0.04)), Math.round(distanceMeters * 0.08), 0),
        buildStep('train', `${from} stop`, 'City transfer', 'Take rail service toward the main transfer point', Math.max(10, Math.round(transitMinutes * 0.4)), Math.round(distanceMeters * 0.5), 18),
        buildStep('walk', 'City transfer', 'Last stop', 'Walk to the last leg connection', Math.max(3, Math.round(distanceMeters * 0.02)), Math.round(distanceMeters * 0.04), 0),
        buildStep('bus', 'Last stop', to, `Continue to ${to}`, Math.max(8, Math.round(transitMinutes * 0.35)), Math.round(distanceMeters * 0.35), estimateTransitFare(Math.round(distanceMeters), 2)),
      ],
      0.56,
    ),
    buildRoute(
      `Walk direct to ${to}`,
      [
        buildStep('walk', from, to, `Walk directly to ${to}`, walkMinutes, Math.round(distanceMeters), 0),
      ],
      clamp(0.9 - distanceKm * 0.08, 0.2, 0.9),
      {
        duration: walkMinutes,
        cost: 0,
        waitMinutes: 0,
      },
    ),
  ];

  if (distanceKm > 6) {
    routes.splice(
      1,
      0,
      buildRoute(
        'Short transit hop',
        [
          buildStep('walk', from, `${from} station`, 'Walk to the nearest station', Math.max(4, Math.round(distanceMeters * 0.03)), Math.round(distanceMeters * 0.06), 0),
          buildStep('train', `${from} station`, `${to} station`, 'Take rail service for the main trip', Math.max(12, Math.round(urbanMinutes * 0.6)), Math.round(distanceMeters * 0.65), estimateTransitFare(Math.round(distanceMeters), 1)),
          buildStep('walk', `${to} station`, to, `Walk to ${to}`, Math.max(4, Math.round(distanceMeters * 0.03)), Math.round(distanceMeters * 0.06), 0),
        ],
        0.63,
      ),
    );
  }

  return routes;
}

export function isLiveTransitEnabled() {
  return true;
}

function getTransitRoutingPreference(mode: TravelModePreference) {
  if (mode === 'fast') return 'FEWER_TRANSFERS' as const;
  return 'LESS_WALKING' as const;
}

export async function fetchRoutes(
  from: string,
  to: string,
  options?: { travelModePreference?: TravelModePreference },
): Promise<RouteFetchResult> {
  const origin = from.trim();
  const destination = to.trim();
  if (!origin || !destination) return { routes: [], source: 'fallback', message: 'Enter both an origin and destination.' };
  const travelModePreference = options?.travelModePreference ?? 'balanced';
  const originLocation = findKnownLocation(origin);
  const destinationLocation = findKnownLocation(destination);
  const originCandidates = buildPlaceSlugCandidates(originLocation?.name ?? origin, originLocation?.aliases);
  const destinationCandidates = buildPlaceSlugCandidates(destinationLocation?.name ?? destination, destinationLocation?.aliases);

  idCounter = 0;

  try {
    const databaseResult = await fetchDatabaseRoutes(originCandidates, destinationCandidates, {
      originPlace: originLocation
        ? {
            name: originLocation.name,
            lat: originLocation.lat,
            lng: originLocation.lng,
            aliases: originLocation.aliases,
          }
        : null,
      destinationPlace: destinationLocation
        ? {
            name: destinationLocation.name,
            lat: destinationLocation.lat,
            lng: destinationLocation.lng,
            aliases: destinationLocation.aliases,
          }
        : null,
    });
    if (databaseResult.routes.length > 0) {
      return {
        routes: databaseResult.routes,
        source: 'database',
        message: databaseResult.message ?? 'Routes loaded from Lumi transit data.',
      };
    }

    if (databaseResult.supportedOrigin && databaseResult.supportedDestination) {
      return {
        routes: buildFallbackRoutes(origin, destination),
        source: 'fallback',
        message: 'Lumi knows these places but does not have a verified community route for this trip yet.',
      };
    }
  } catch {
    // Fall through to live routing.
  }

  try {
    const [transitResponse, walkResponse] = await Promise.all([
      fetchGoogleRoutesViaProxy(origin, destination, 'TRANSIT', {
        computeAlternativeRoutes: true,
        transitRoutingPreference: getTransitRoutingPreference(travelModePreference),
        originLocation,
        destinationLocation,
      }),
      fetchGoogleRoutesViaProxy(origin, destination, 'WALK', {
        originLocation,
        destinationLocation,
      }),
    ]);

    const liveErrors = [transitResponse.error, walkResponse.error].filter(Boolean) as string[];
    const liveRoutes: RouteOption[] = [];
    const transitRoutes = transitResponse.data?.routes ?? [];

    for (const route of transitRoutes.slice(0, 4)) {
      const parsed = buildTransitRoute(route, origin, destination, liveRoutes.length);
      if (parsed) liveRoutes.push(parsed);
    }

    const walkRoute = walkResponse.data?.routes?.[0];
    if (walkRoute) {
      const parsed = buildWalkRoute(walkRoute, origin, destination);
      if (parsed) liveRoutes.push(parsed);
    }

    if (liveRoutes.length > 0) {
      return {
        routes: liveRoutes,
        source: 'live',
        message: liveErrors.length > 0 ? liveErrors[0] : undefined,
      };
    }
  } catch {
    // Fall through to direct or local fallback.
  }

  if (GOOGLE_ROUTES_API_KEY && !isExpoGo()) {
    try {
      const [transitResponse, walkResponse] = await Promise.all([
        fetchGoogleRoutes(origin, destination, 'TRANSIT', {
          computeAlternativeRoutes: true,
          transitRoutingPreference: getTransitRoutingPreference(travelModePreference),
          originLocation,
          destinationLocation,
        }),
        fetchGoogleRoutes(origin, destination, 'WALK', {
          originLocation,
          destinationLocation,
        }),
      ]);

      const liveErrors = [transitResponse.error, walkResponse.error].filter(Boolean) as string[];
      const liveRoutes: RouteOption[] = [];
      const transitRoutes = transitResponse.data?.routes ?? [];

      for (const route of transitRoutes.slice(0, 4)) {
        const parsed = buildTransitRoute(route, origin, destination, liveRoutes.length);
        if (parsed) liveRoutes.push(parsed);
      }

      const walkRoute = walkResponse.data?.routes?.[0];
      if (walkRoute) {
        const parsed = buildWalkRoute(walkRoute, origin, destination);
        if (parsed) liveRoutes.push(parsed);
      }

      if (liveRoutes.length > 0) {
        return {
          routes: liveRoutes,
          source: 'live',
          message: liveErrors.length > 0 ? liveErrors[0] : undefined,
        };
      }

      return {
        routes: buildFallbackRoutes(origin, destination),
        source: 'fallback',
        message: liveErrors[0] ?? 'No live routes were returned, so Lumi used local estimates.',
      };
    } catch {
      // Fall through to local estimates.
    }
  }

  return {
    routes: buildFallbackRoutes(origin, destination),
    source: 'fallback',
    message: isExpoGo()
      ? 'Live routing needs the deployed routes proxy or a dev build with a working Android Routes key. Lumi used local estimates instead.'
      : GOOGLE_ROUTES_API_KEY
        ? 'Live routing failed, so Lumi used local estimates.'
        : 'No Google Routes key detected, so Lumi used local estimates.',
  };
}
