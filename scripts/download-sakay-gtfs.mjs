import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'data', 'transit', 'gtfs', 'sakayph');
const baseUrl = 'https://raw.githubusercontent.com/sakayph/gtfs/master';
const files = [
  'agency.txt',
  'calendar.txt',
  'feed_info.txt',
  'frequencies.txt',
  'routes.txt',
  'shapes.txt',
  'stop_times.txt',
  'stops.txt',
  'trips.txt',
];

async function download(fileName) {
  const url = `${baseUrl}/${fileName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${fileName}: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  fs.writeFileSync(path.join(outputDir, fileName), text, 'utf8');
  console.log(`Downloaded ${fileName}`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const fileName of files) {
    // Sequential keeps logs readable and is gentler on the source.
    await download(fileName);
  }

  console.log(`Saved Sakay GTFS files to ${outputDir}`);
  console.log('Next step: npm run transit:seed -- --gtfs-dir=data/transit/gtfs/sakayph');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
