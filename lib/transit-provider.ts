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

export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export const KNOWN_LOCATIONS: Location[] = [
  { name: 'SM North EDSA', lat: 14.6567, lng: 121.0295 },
  { name: 'Makati CBD', lat: 14.5547, lng: 121.0244 },
  { name: 'BGC High Street', lat: 14.5500, lng: 121.0509 },
  { name: 'Quezon City Hall', lat: 14.6328, lng: 121.0451 },
  { name: 'Manila City Hall', lat: 14.5896, lng: 120.9842 },
  { name: 'MOA Complex', lat: 14.5351, lng: 120.9832 },
  { name: 'Ortigas Center', lat: 14.5880, lng: 121.0614 },
  { name: 'Cubao Araneta', lat: 14.6218, lng: 121.0530 },
  { name: 'Alabang Town Center', lat: 14.4235, lng: 121.0479 },
  { name: 'Eastwood City', lat: 14.6108, lng: 121.0800 },
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

export type RouteSource = 'live' | 'fallback';

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

function findKnownLocation(query: string): Location | null {
  const q = normalize(query);
  return KNOWN_LOCATIONS.find((loc) => {
    const name = normalize(loc.name);
    return name === q || name.includes(q) || q.includes(name);
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

function buildTransitSummary(steps: GoogleStep[]) {
  const labels: string[] = [];
  for (const step of steps) {
    if (!step.transitDetails) continue;
    const label = transitLabel(step);
    if (!labels.includes(label)) labels.push(label);
  }
  if (labels.length === 0) return 'Live transit route';
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
  const pricedSteps = parsedSteps.map((step) => {
    if (step.mode !== 'walk' && !fareApplied) {
      fareApplied = true;
      return { ...step, cost: totalCost };
    }
    return step;
  });

  return buildRoute(
    buildTransitSummary(steps),
    pricedSteps,
    comfort,
    {
      duration: totalDuration,
      cost: totalCost,
      waitMinutes,
    },
  );
}

function buildDriveRoute(route: GoogleRoute, from: string, to: string): RouteOption | null {
  const leg = route.legs?.[0];
  const totalDuration = secondsToMinutes(route.duration ?? leg?.duration);
  const totalDistance = Math.max(0, Math.round(route.distanceMeters ?? leg?.distanceMeters ?? 0));
  if (!totalDuration || !totalDistance) return null;

  const durationWithPickup = Math.max(3, totalDuration + 4);
  const fare = estimateRideFare(totalDistance, durationWithPickup);

  return buildRoute(
    `Rideshare to ${to}`,
    [
      buildStep(
        'walk',
        from,
        'Pickup point',
        'Walk to pickup point',
        2,
        Math.min(180, Math.round(totalDistance * 0.02)),
        0,
      ),
      buildStep(
        'rideshare',
        'Pickup point',
        to,
        `Ride to ${to}`,
        durationWithPickup,
        totalDistance,
        fare,
      ),
    ],
    0.88,
    {
      duration: durationWithPickup,
      cost: fare,
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

function estimateRideFare(distanceMeters: number, durationMinutes: number) {
  const km = distanceMeters / 1000;
  return Math.max(60, Math.round(45 + km * 18 + durationMinutes * 1.5));
}

async function fetchGoogleRoutes(
  from: string,
  to: string,
  travelMode: 'TRANSIT' | 'DRIVE' | 'WALK',
  options?: {
    computeAlternativeRoutes?: boolean;
    transitRoutingPreference?: 'LESS_WALKING' | 'FEWER_TRANSFERS';
  },
): Promise<{ data: GoogleRoutesResponse | null; error?: string }> {
  if (!GOOGLE_ROUTES_API_KEY) return { data: null, error: 'Missing Google Routes API key.' };

  const body: Record<string, unknown> = {
    origin: { address: from },
    destination: { address: to },
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
  },
): Promise<{ data: GoogleRoutesResponse | null; error?: string }> {
  const { data, error } = await supabase.functions.invoke('google-routes', {
    body: {
      from,
      to,
      travelMode,
      options,
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
  const taxiMinutes = Math.max(10, Math.round(distanceMeters / 260));

  const routes: RouteOption[] = [
    buildRoute(
      `Rideshare to ${to}`,
      [
        buildStep('walk', from, 'Pickup point', 'Walk to pickup point', 3, Math.min(220, Math.round(distanceMeters * 0.02)), 0),
        buildStep('rideshare', 'Pickup point', to, `Ride to ${to}`, taxiMinutes, Math.round(distanceMeters), estimateRideFare(Math.round(distanceMeters), taxiMinutes)),
      ],
      0.88,
      {
        duration: taxiMinutes + 2,
        cost: estimateRideFare(Math.round(distanceMeters), taxiMinutes),
      },
    ),
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

export async function fetchRoutes(from: string, to: string): Promise<RouteFetchResult> {
  const origin = from.trim();
  const destination = to.trim();
  if (!origin || !destination) return { routes: [], source: 'fallback', message: 'Enter both an origin and destination.' };

  idCounter = 0;

  try {
    const [transitResponse, driveResponse, walkResponse] = await Promise.all([
      fetchGoogleRoutesViaProxy(origin, destination, 'TRANSIT', {
        computeAlternativeRoutes: true,
        transitRoutingPreference: 'LESS_WALKING',
      }),
      fetchGoogleRoutesViaProxy(origin, destination, 'DRIVE'),
      fetchGoogleRoutesViaProxy(origin, destination, 'WALK'),
    ]);

    const liveErrors = [transitResponse.error, driveResponse.error, walkResponse.error].filter(Boolean) as string[];
    const liveRoutes: RouteOption[] = [];
    const transitRoutes = transitResponse.data?.routes ?? [];

    for (const route of transitRoutes.slice(0, 4)) {
      const parsed = buildTransitRoute(route, origin, destination, liveRoutes.length);
      if (parsed) liveRoutes.push(parsed);
    }

    const driveRoute = driveResponse.data?.routes?.[0];
    if (driveRoute) {
      const parsed = buildDriveRoute(driveRoute, origin, destination);
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
      const [transitResponse, driveResponse, walkResponse] = await Promise.all([
        fetchGoogleRoutes(origin, destination, 'TRANSIT', {
          computeAlternativeRoutes: true,
          transitRoutingPreference: 'LESS_WALKING',
        }),
        fetchGoogleRoutes(origin, destination, 'DRIVE'),
        fetchGoogleRoutes(origin, destination, 'WALK'),
      ]);

      const liveErrors = [transitResponse.error, driveResponse.error, walkResponse.error].filter(Boolean) as string[];
      const liveRoutes: RouteOption[] = [];
      const transitRoutes = transitResponse.data?.routes ?? [];

      for (const route of transitRoutes.slice(0, 4)) {
        const parsed = buildTransitRoute(route, origin, destination, liveRoutes.length);
        if (parsed) liveRoutes.push(parsed);
      }

      const driveRoute = driveResponse.data?.routes?.[0];
      if (driveRoute) {
        const parsed = buildDriveRoute(driveRoute, origin, destination);
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
