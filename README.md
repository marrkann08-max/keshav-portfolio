# Keshav Markan — React portfolio

A React and TypeScript portfolio with an explorable 3D campus, local camera hand scrolling, discovery puzzles, and a shared guestbook.

Live: https://keshavmarkan.com

## Stack

- React 19 with actual components and state for page modes, experience tabs, case studies, the project journey, and guestbook.
- TypeScript with strict checking for the frontend and Worker.
- Vite for development, code splitting, and the production build. Build-time React rendering puts the portfolio content in initial HTML; hydration enables the same interactive UI afterward.
- Three.js and OrbitControls, installed through npm and bundled with the website. There are no runtime CDN imports.
- Cloudflare Worker API and D1 database for the shared guestbook.
- Vitest, Miniflare, and real local D1 storage for backend tests.
- Custom responsive CSS preserves the approved design.

Dependency versions are pinned, with a lockfile for reproducible installation.

## What visitors see

1. Introduction, interactive sculpture, and a prominent 3D campus button.
2. Work experience: Research Assistant → Deepiri → PAL → OER → CSI.
3. Featured projects: Software Effort Estimator, ChainBreak Lab, and Naftelia.
4. The 100-day project series, with three published projects: Smart Traffic Navigator, this portfolio, and Ki Forge.
5. GDG community leadership.
6. “I was here” guestbook.
7. Education and contact information.

PAL, OER, and CSI are separate paid-work entries. GDG is separate community leadership. The campus retains orbit, zoom, walking, project destinations, selectable days, and a physical guestbook with lights.

The normal view includes a numbered section index and an experience browser. Each of the five roles has a Read more dialog, with detailed contributions, skills, and supporting photos where supplied. PAL is framed as peer-learning facilitation. OER includes the owner's digital equity work with accessible templates in Pressbooks, H5P Studio, and WordPress, supporting 1,000+ students. The Build with AI photo has been removed; remaining community photos are Growth Summit and Build with Gemma.

## Run the complete version locally

Use Node.js 22.12 or later; Node.js 24 was used for validation.

```sh
npm ci
npm run setup:local
npm run dev:full
```

Open `http://localhost:8787`.

`setup:local` creates an uncommitted random cookie-signing secret and applies the database migration to local D1. It does not overwrite an existing secret. `dev:full` builds the frontend and runs the Worker, assets, and database together. Marks persist locally across restarts.

For frontend development with hot reload, keep the full local server running and run `npm run dev` in another terminal. Vite forwards `/api` requests to the local Worker.

## How the guestbook works

- Reading a page does not create a mark.
- Clicking “I was here” records a mark in D1 and returns the shared total.
- A signed, HTTP-only cookie identifies the browser. A unique database constraint prevents duplicate and simultaneous clicks from increasing the count more than once.
- It counts marks from browsers, not verified unique people. Clearing cookies or changing browsers can allow another mark.
- Cross-origin writes are rejected. A short-lived keyed hash of the connection address provides basic abuse throttling; raw addresses are not stored in the database.
- No login, email address, name, or message is requested from visitors.
- If the live API is unavailable or not configured, the interface says so. It never substitutes a local fake total.
- The 3D guestbook uses the same API state. Its decorative ring displays up to 40 illuminated points; the numeric count remains uncapped.

## Publish on Cloudflare

The website is live at **https://keshavmarkan.com**. The Cloudflare Worker, production D1 database, schema, custom domain, and private cookie-signing secret were deployed on October 29, 2026. The configuration includes the real database binding and domain. This archive excludes account credentials, signing secrets, and local runtime data.

Deploy the complete Worker application, rather than uploading only `dist/`. Uploading only static files will not install the shared guestbook API.

From a normal terminal authenticated to the Cloudflare account that owns `keshavmarkan.com`:

```sh
npm ci
npx wrangler login --device
```

For future updates in the same account, reuse the configured database and existing secret:

```sh
npx wrangler d1 migrations apply portfolio-guestbook --remote
npm run deploy
```

The production `COOKIE_SECRET` is already stored in Cloudflare. Keep it stable so existing browser cookies continue to verify. Never commit it to source. For a separate deployment, create a separate D1 database, update its ID and domain in `wrangler.jsonc`, apply migrations, and use `npx wrangler secret put COOKIE_SECRET` to set a fresh random value of at least 32 characters.

The `routes` configuration already connects `keshavmarkan.com` as a custom domain. The page's canonical and sharing metadata use the same domain.

## Edit your content and add pictures

- `src/content.ts`: experience chapters, project summaries, current day, and daily project records.
- `src/projects.ts`: detailed project contributions and technologies.
- `src/App.tsx`: portfolio components and section order.
- `src/guestbook.tsx`: shared guestbook state and interface.
- `src/CampusView.tsx`: React campus controls and destination panels.
- `src/campus.ts`: typed Three.js campus and lifecycle cleanup.
- `src/sculpture-scene.ts`: the independently loaded hero sculpture.
- `src/styles.css` and `src/guestbook.css`: appearance and responsive layouts.
- `worker/index.ts`: production API, cookies, deduplication, and throttling.
- `migrations/0001_guestbook.sql`: D1 schema.

Supplied photos are in `public/images/`: a speaking portrait, Open Learning and CSI work photos, Growth Summit (GDG Conestoga), Build with Gemma (GDG Waterloo), and series media. Instagram links use @kaylocksin. The published trail includes Day 1 Smart Traffic Navigator, Day 2 this portfolio, and Day 3 Ki Forge with its photo and source link. Research and marine project illustrations are labeled schematics; ChainBreak uses a real hardware photo.

Mobile updates lower the campus graphics load on touch devices, provide movement and Open nearby controls, make destination panels available independently of WebGL, and handle lost graphics contexts. A 390px browser check verified campus rendering, movement controls, destination panels, day dialogs, OER photos, and no horizontal overflow or captured console errors. Actual phone confirmation remains with the owner.

## Checks

```sh
npm run build
npm test
```

Validation completed:

- Strict frontend and Worker type checking, plus production build.
- Nine backend tests: page views do not count; separate browsers share the total; duplicate and simultaneous clicks count once; marks survive Worker restart; altered cookies are not trusted; cross-origin writes and unsupported methods are rejected; abuse attempts are throttled; and an unconfigured backend returns an honest unavailable response.
- Browser checks of the React portfolio, experience tabs, project dialog, guestbook submission, and the same count in the 3D guestbook.
- Mobile layout check with no horizontal page overflow and no captured browser console errors or warnings.

The portrait uses a clean rectangular crop with no filters, edge fades, or shadow overlays. Experience photos retain their natural proportions without padded image backgrounds. ChainBreak uses the supplied dashboard/hardware photo in its project card, case study, and campus panel.

The calendar counter advances automatically at midnight in America/Toronto, using October 28, 2026 as Day 1 (October 29 is Day 2). It refreshes on minute boundaries and when the page regains focus. `src/series-calendar.ts` owns the start date/time zone. This counter is separate from published progress: add each real project to `dailyProjects` in `src/content.ts` to publish a day and unlock its tile. Neither Instagram posts nor project content are imported automatically. Four date tests cover midnight, international visitors, daylight saving, and the 1–100 range.

The site serves crawlable initial HTML, canonical metadata, Person/ProfilePage structured data, robots.txt, and a sitemap. Google Search Console ownership is verified, the sitemap is submitted, and homepage indexing has been requested; indexing or ranking is not guaranteed.

Hand scrolling, the discovery passport, and the hidden traffic puzzle are implemented. Supplied portfolio photos are bundled; government documents and permit scans are excluded.

## Discoveries and optional hand scrolling

- Choose Try hand control, wait for the local model, then choose Start camera. Hold up index and middle fingers together; move the hand above or below its resting position to scroll. Lower the hand to stop. Pause, Stop camera, Close, Escape, or hiding the tab stops scrolling; Stop and Close release camera tracks.
- Video is processed locally in a worker. Frames are not uploaded. The self-hosted model and runtime load only when the visitor opens hand control. Camera permission remains optional and scrolling never clicks links or submits forms.
- Visit Research, Projects, 100 Days, and Community in the campus to collect four passport stamps and unlock Aurora lighting. Progress is local to this browser; camera use is not required.
- A blinking signal near the Projects arcade opens a weighted-route puzzle based on Day 1. It uses real Dijkstra shortest-path calculations. Finding and solving it award bonus discoveries.
- Relevant modules: src/HandControl.tsx, src/vision-worker.ts, src/gesture-scroll.ts, src/discoveries.ts, src/DiscoveryHub.tsx, src/TrafficPuzzle.tsx, and src/traffic-graph.ts.
- Validation: 24 automated tests pass. Real MediaPipe model detection was checked with a public portfolio image; simulated camera input verified scrolling, dialog scrolling, hand-loss stop, and track cleanup. A physical webcam and actual phone camera still require a device check. Browser viewport emulation did not apply reliably for this final feature check.
