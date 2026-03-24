/**
 * Lumi Route Scoring Algorithm
 *
 * Ranks transit routes using a weighted multi-factor score.
 * Learns user preferences over time by adjusting weights
 * based on which routes the user selects.
 */

// ── Types ──

export interface RouteOption {
  id: string;
  /** e.g. "Jeepney → MRT → Bus" */
  summary: string;
  steps: RouteStep[];
  /** Total minutes door-to-door */
  duration: number;
  /** Estimated cost in local currency */
  cost: number;
  /** Number of vehicle changes */
  transfers: number;
  /** Total walking distance in meters */
  walkingMeters: number;
  /** Total waiting time in minutes */
  waitMinutes: number;
  /** Comfort score 0-1 (AC, seat availability, crowding) */
  comfort: number;
  /** Algorithm-computed score (lower = better) */
  score?: number;
}

export interface RouteStep {
  mode: TransportMode;
  instruction: string;
  /** e.g. "MRT-3 North" */
  lineName?: string;
  from: string;
  to: string;
  durationMinutes: number;
  distanceMeters: number;
  cost: number;
}

export type TransportMode =
  | 'walk'
  | 'bus'
  | 'train'
  | 'subway'
  | 'jeepney'
  | 'tricycle'
  | 'taxi'
  | 'rideshare'
  | 'ferry'
  | 'tram';

// ── Scoring weights ──

export interface UserWeights {
  time: number;
  cost: number;
  transfers: number;
  walking: number;
  waiting: number;
  comfort: number;
}

export const DEFAULT_WEIGHTS: UserWeights = {
  time: 0.30,
  cost: 0.25,
  transfers: 0.20,
  walking: 0.10,
  waiting: 0.08,
  comfort: 0.07,
};

// ── Normalization helpers ──

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// ── Core scoring ──

export function scoreRoutes(routes: RouteOption[], weights: UserWeights): RouteOption[] {
  if (routes.length === 0) return [];

  const mins = {
    duration: Math.min(...routes.map((r) => r.duration)),
    cost: Math.min(...routes.map((r) => r.cost)),
    transfers: Math.min(...routes.map((r) => r.transfers)),
    walking: Math.min(...routes.map((r) => r.walkingMeters)),
    waiting: Math.min(...routes.map((r) => r.waitMinutes)),
    comfort: Math.min(...routes.map((r) => r.comfort)),
  };
  const maxs = {
    duration: Math.max(...routes.map((r) => r.duration)),
    cost: Math.max(...routes.map((r) => r.cost)),
    transfers: Math.max(...routes.map((r) => r.transfers)),
    walking: Math.max(...routes.map((r) => r.walkingMeters)),
    waiting: Math.max(...routes.map((r) => r.waitMinutes)),
    comfort: Math.max(...routes.map((r) => r.comfort)),
  };

  const scored = routes.map((route) => {
    // Lower is better for all except comfort (higher is better)
    const score =
      weights.time * normalize(route.duration, mins.duration, maxs.duration) +
      weights.cost * normalize(route.cost, mins.cost, maxs.cost) +
      weights.transfers * normalize(route.transfers, mins.transfers, maxs.transfers) +
      weights.walking * normalize(route.walkingMeters, mins.walking, maxs.walking) +
      weights.waiting * normalize(route.waitMinutes, mins.waiting, maxs.waiting) +
      weights.comfort * (1 - normalize(route.comfort, mins.comfort, maxs.comfort));

    return { ...route, score };
  });

  return scored.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
}

// ── Preference learning ──

const LEARNING_RATE = 0.15;

/**
 * Adjusts weights toward the characteristics of the route the user chose.
 * Uses exponential moving average so recent choices matter more.
 */
export function learnFromSelection(
  currentWeights: UserWeights,
  allRoutes: RouteOption[],
  chosenRoute: RouteOption,
): UserWeights {
  if (allRoutes.length < 2) return currentWeights;

  // Compute rank of the chosen route's attribute among all routes
  // If the user picked the cheapest route, cost weight should increase
  const rank = (values: number[], chosen: number, lowerIsBetter: boolean) => {
    const sorted = [...values].sort((a, b) => (lowerIsBetter ? a - b : b - a));
    const position = sorted.indexOf(chosen);
    // 1.0 = best, 0.0 = worst
    return 1 - position / (sorted.length - 1);
  };

  const signals: UserWeights = {
    time: rank(allRoutes.map((r) => r.duration), chosenRoute.duration, true),
    cost: rank(allRoutes.map((r) => r.cost), chosenRoute.cost, true),
    transfers: rank(allRoutes.map((r) => r.transfers), chosenRoute.transfers, true),
    walking: rank(allRoutes.map((r) => r.walkingMeters), chosenRoute.walkingMeters, true),
    waiting: rank(allRoutes.map((r) => r.waitMinutes), chosenRoute.waitMinutes, true),
    comfort: rank(allRoutes.map((r) => r.comfort), chosenRoute.comfort, false),
  };

  // EMA update
  const updated: UserWeights = {
    time: currentWeights.time + LEARNING_RATE * (signals.time - currentWeights.time),
    cost: currentWeights.cost + LEARNING_RATE * (signals.cost - currentWeights.cost),
    transfers: currentWeights.transfers + LEARNING_RATE * (signals.transfers - currentWeights.transfers),
    walking: currentWeights.walking + LEARNING_RATE * (signals.walking - currentWeights.walking),
    waiting: currentWeights.waiting + LEARNING_RATE * (signals.waiting - currentWeights.waiting),
    comfort: currentWeights.comfort + LEARNING_RATE * (signals.comfort - currentWeights.comfort),
  };

  // Re-normalize so weights sum to 1
  const sum = Object.values(updated).reduce((a, b) => a + b, 0);
  return {
    time: updated.time / sum,
    cost: updated.cost / sum,
    transfers: updated.transfers / sum,
    walking: updated.walking / sum,
    waiting: updated.waiting / sum,
    comfort: updated.comfort / sum,
  };
}

// ── Label helpers ──

export function getScoreLabel(score: number): string {
  if (score <= 0.25) return 'Best match';
  if (score <= 0.45) return 'Good option';
  if (score <= 0.65) return 'Decent';
  return 'Alternative';
}

export function getModeIcon(mode: TransportMode): string {
  const icons: Record<TransportMode, string> = {
    walk: 'walk-outline',
    bus: 'bus-outline',
    train: 'train-outline',
    subway: 'subway-outline',
    jeepney: 'car-outline',
    tricycle: 'bicycle-outline',
    taxi: 'car-sport-outline',
    rideshare: 'car-outline',
    ferry: 'boat-outline',
    tram: 'train-outline',
  };
  return icons[mode] ?? 'navigate-outline';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatCost(cost: number, currency = 'PHP'): string {
  return `${currency} ${cost.toFixed(0)}`;
}
