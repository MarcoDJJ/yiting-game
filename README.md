# Yiting’s Passport · Our Little World

A personal, mobile-first travel game for Yiting and Marco. First playable chapter: **Italia**.

## What is playable

Nine different games, each with twelve stages (108 stages), plus an Italian Date Night ending:

1. Snowman Mania
2. Summit Sprint
3. **Snowbound Drive**
4. **Escape the Castle**
5. Row, Row, Rome
6. Wait, Marco!
7. Gelato Tower
8. Mercato di Sicilia
9. Pasta di Casa
10. Italian Date Night

Finish stage 1 to open the next game. Each game’s later stages unlock in sequence. Best scores, stars, local progress, cosmetic purchases and wardrobe are persistent. A seeded daily challenge is replayable, with no streak pressure. Coins come from first clears and improved stars, never real money. Berlin, Egypt, Taiwan, Tokyo and Okinawa are explicitly marked **Coming soon**, with no fake gameplay.

The Sicilian market is an imagined extra adventure, not a claim about a trip you already took. Menus have English, Italian and Traditional Chinese translations; game instructions and story text are English in v0.1. The photo/comic album is currently illustrated memory cards. No original photos or comic files are included.

## Cloudflare Pages

Connect `MarcoDJJ/yiting-game` to the existing Cloudflare account. Recommended settings:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | leave blank |

**If you previously entered `exit 0` and `.`, change these two fields to `npm run build` and `dist`.** This keeps backend source, scripts and project files out of the public static deployment. No npm dependencies are needed.

This works immediately with **device-local saves**. A plain static deployment is not a cloud-save service. Secure cloud login is implemented but requires the following one-time account setup.

## Activate cloud passports

1. In Cloudflare, go to **Storage & databases → D1**, create a database named `yiting-passport`.
2. Open the database’s Console and execute the contents of [`db/schema.sql`](db/schema.sql).
3. In your Pages project, **Settings → Bindings → Add → D1 database**, set Variable name to **`PASSPORT_DB`**, select `yiting-passport`, and save. Configure production; use a separate database for previews if you need preview cloud saves.
4. On your own computer, run `node scripts/invitations.mjs`. It produces two randomly generated personal login codes and a JSON object of their SHA-256 hashes. Keep the codes private. Do not commit terminal output.
5. Add the hash JSON as an **encrypted secret** named **`PASSPORT_CODES`** in the Pages project’s Variables and Secrets settings. Do not put it in frontend code or GitHub.
6. Redeploy. Open Settings in the game, choose Connect and log in with the personal code. Yiting and Marco have separate saves.

On first sign-in, if the cloud has no save, the current guest progress is uploaded. If the cloud already has a save, that cloud save is loaded. Export a guest backup beforehand if needed. Sessions last 30 days. Cloud saves use optimistic revisions to avoid silently overwriting another device. When sync is interrupted or a conflict occurs, the UI says so; reconnect explicitly chooses the cloud or device copy. Local progress remains available. Browser cookies are secure, HTTP-only and same-site, login attempts are throttled, and API writes check the same origin.

Cloud saves protect **save data**, not the public game itself. This repository is currently **public**. A hard-to-guess URL and noindex do not make a website private. Before adding personal comics or original photos, decide on private repository and deployment access protection. No trackers, ads, real purchases or personal photo originals are included.

## iPhone and Android

Open the deployed URL in Safari → Share → Add to Home Screen → Open as Web App if shown. Android can add it through the browser’s install menu. The service worker caches the game shell and artwork after the first visit. Cloud saves require an internet connection. Export a backup before clearing browser data or changing device; device-local data can be removed by the browser.

Controls support touch, pointer and keyboard. Platform games: arrows and Space. Boat: A and D. Driving: arrows, Space to Push. Kitchen: touch actions, Space fallback. Reduced motion applies to menus, not game movement. Haptics work only on supported devices. The first version has static illustrated avatars; full walking/gesture sprite animations are a future art pass.

## Local development

Node 22.13 or later (the backend tests use Node's built-in SQLite):

```sh
npm run check
npm test
npm run build
npm run dev
```

The built-in development server is a static preview. To exercise the actual Cloudflare backend locally, use Wrangler Pages with a local D1 binding and `.dev.vars` secrets (never committed). Use `db/schema.sql` to initialize that local database.

## Project structure

- `app.js`, `style.css`: responsive game shell, routes, menus, wardrobe and cloud client.
- `lib/content.js`: expandable world, chapter and item catalog.
- `lib/games.js`, `lib/engine.js`: deterministic game logic, canvas renderer, touch controls and pause lifecycle.
- `lib/state.js`: validated save format, economy and seeded randomness.
- `functions/api/[[path]].js`: Cloudflare Pages auth and D1 save API.
- `db/schema.sql`: database schema.
- `assets/`: optimized, original game illustrations and icons.
- `tests/`: game, economy, progression, backend and asset smoke tests.

## Art direction and generated assets

Original illustrations generated with the built-in image tool and integrated into `assets/` as optimized WebP assets. Photo references stay outside this repository.

Italy background brief: cozy watercolor/gouache panorama from snowy mountains and chalet through a stone castle and terracotta village to Rome-inspired architecture and blue water, warm ivory/green/coral palette, no labels or characters. This is an imaginative game landscape, not a geographic map.

Avatar brief: four consistent full-body chibi sprites based on supplied references: Yiting in cream knit and jeans, red turtleneck, blue/yellow winter sweater and beanie; Marco in a white top and dark trousers, transparent backgrounds. Integrated as `assets/yiting.webp`, `yiting-red.webp`, `yiting-winter.webp`, `marco.webp`. Exact generation prompts are in [`docs/art-prompts.md`](docs/art-prompts.md).

## Scope and next milestones

This is a first working vertical slice, not a finished commercial game. 109 stages and daily routes are not a guarantee of months of unique authored content. Longer lifespan comes from replay mastery and adding genuinely new worlds. Real-device Safari/iPhone playtesting, difficulty balancing, full story translations, private comic integration and a more complete sprite animation pass remain important before the Christmas gift.
