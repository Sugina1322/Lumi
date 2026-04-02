Transit data lives here.

Files:
- `places.json`: canonical named places and aliases that can be seeded into `transit_places`
- `community-routes.json`: structured local routes with ordered steps
- `community-route-template.json`: copy this when adding a new exact route

Importer:
- Run `npm run transit:validate` to validate the community route dataset
- Run `npm run transit:seed` to generate `supabase/seed/transit_seed.sql`
- Run `npm run transit:seed -- --gtfs-dir=path/to/extracted/gtfs` to generate `supabase/seed/transit_seed.sql` plus ordered GTFS chunk files in `supabase/seed/chunks`
- Run `npm run transit:download-sakay` to download the public `sakayph/gtfs` feed into `data/transit/gtfs/sakayph`
- Run `npm run transit:seed-sakay` to generate seed SQL that includes the downloaded `sakayph/gtfs` files
- Run `npm run transit:apply-seeds` to apply `transit_seed.sql` and all chunk files through the Supabase CLI

Recommended workflow:
1. Add or edit `places.json`
2. Add or edit `community-routes.json`
3. Validate the route dataset
4. Regenerate `supabase/seed/transit_seed.sql`
4. Apply the migration and seed to Supabase
5. Redeploy edge functions if route proxy changes are involved

Sakay GTFS workflow:
1. Run `npm run transit:download-sakay`
2. Run `npm run transit:seed-sakay`
3. Apply both migration files in `supabase/migrations/`
4. Run `npm run transit:apply-seeds`

Notes:
- Community routes should only be added when they are directly verified or source-backed.
- GTFS files should be extracted into a folder before import.
- The `sakayph/gtfs` repository is used as a public GTFS source. Do not scrape Sakay's app/site data.
- `transit_seed.sql` is kept small enough for the Supabase SQL Editor. Large GTFS tables are split into multiple chunk files automatically.
- `transit:apply-seeds` uses the linked Supabase project by default. You can also run `node scripts/apply-transit-seeds.mjs --db-url=...` or set `SUPABASE_DB_URL`.
- To resume a partial import, run `node scripts/apply-transit-seeds.mjs --start-at=031_gtfs_stop_times_part_01.sql`.
