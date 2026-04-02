import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const placesPath = path.join(root, 'data', 'transit', 'places.json');
const routesPath = path.join(root, 'data', 'transit', 'community-routes.json');

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function main() {
  const places = readJson(placesPath);
  const routes = readJson(routesPath);
  const placeSlugs = new Set(places.map((place) => place.slug));
  const routeSlugs = new Set();

  for (const route of routes) {
    if (!isNonEmptyString(route.slug)) fail('Route is missing a valid slug.');
    if (routeSlugs.has(route.slug)) fail(`Duplicate route slug: ${route.slug}`);
    routeSlugs.add(route.slug);

    if (!placeSlugs.has(route.origin_slug)) fail(`Unknown origin_slug in ${route.slug}: ${route.origin_slug}`);
    if (!placeSlugs.has(route.destination_slug)) fail(`Unknown destination_slug in ${route.slug}: ${route.destination_slug}`);
    if (!Array.isArray(route.steps) || route.steps.length === 0) fail(`Route ${route.slug} has no steps.`);

    const stepOrders = new Set();
    for (const step of route.steps) {
      if (!isPositiveInteger(step.step_order)) fail(`Invalid step_order in ${route.slug}`);
      if (stepOrders.has(step.step_order)) fail(`Duplicate step_order ${step.step_order} in ${route.slug}`);
      stepOrders.add(step.step_order);
      if (!isNonEmptyString(step.mode)) fail(`Missing mode in ${route.slug} step ${step.step_order}`);
      if (!isNonEmptyString(step.from_label)) fail(`Missing from_label in ${route.slug} step ${step.step_order}`);
      if (!isNonEmptyString(step.to_label)) fail(`Missing to_label in ${route.slug} step ${step.step_order}`);
      if (!isNonEmptyString(step.instruction)) fail(`Missing instruction in ${route.slug} step ${step.step_order}`);
      if (!isPositiveInteger(step.duration_minutes)) fail(`Invalid duration_minutes in ${route.slug} step ${step.step_order}`);
      if (!isPositiveInteger(step.distance_meters)) fail(`Invalid distance_meters in ${route.slug} step ${step.step_order}`);
      if (typeof step.cost !== 'number' || step.cost < 0) fail(`Invalid cost in ${route.slug} step ${step.step_order}`);
    }
  }

  if (process.exitCode) return;
  console.log(`Validated ${routes.length} community routes across ${places.length} places.`);
}

main();
