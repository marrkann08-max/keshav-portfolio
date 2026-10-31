# Keshav Markan's portfolio

[**keshavmarkan.com**](https://keshavmarkan.com)

My portfolio has two views: a regular page for experience and projects, and a Three.js campus you can explore. It also hosts my 100 Days, 100 Projects series.

## Features

- Experience details, project case studies, and community events.
- A 100-day project trail. New projects are added in `src/content.ts`.
- An explorable campus with orbit, zoom, walking, and touch controls.
- Optional camera hand scrolling using MediaPipe. Frames are processed locally.
- A discovery passport, alternate campus lighting, and a hidden traffic puzzle based on Dijkstra's algorithm.
- A shared “I was here” guestbook backed by Cloudflare D1.

## Stack

React · TypeScript · Vite · Three.js · MediaPipe · Cloudflare Workers · D1

The build renders the normal portfolio into HTML before hydration. Three.js scenes and camera controls load separately. Camera model files are served from this site rather than a third-party CDN.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run setup:local
npm run dev:full
```

Open **http://localhost:8787**.

`setup:local` creates a local cookie-signing secret and applies the D1 migration. Both stay outside Git. For frontend hot reload, leave the full server running and start `npm run dev` in another terminal; Vite forwards API requests to the Worker.

## Project structure

```text
src/          React UI, content, Three.js scenes, and hand controls
worker/       Guestbook API
public/       Photos, crawler files, and camera model/runtime
migrations/   D1 schema
scripts/      Build, prerender, and local setup
tests/        Calendar, guestbook, and discovery checks
```

## Update the content

- `src/content.ts`: experience summaries and published daily projects.
- `src/experience-details.ts`: expanded role descriptions.
- `src/projects.ts`: project contributions and tools.
- `public/images/`: project and event photos.
- `src/series-calendar.ts`: series start date and time zone.

The calendar day advances automatically at midnight in Toronto. Publishing a project is a separate step: add its entry to `dailyProjects`. Instagram posts are not imported automatically.

## Hand scrolling and discoveries

Choose **Try hand control**, wait for the model to load, then select **Start camera**. Hold your index and middle fingers up, keep your hand steady briefly, and move it up or down to scroll. Lower your hand to stop.

Stop, Close, Escape, and hiding the tab release the camera. No video is recorded or uploaded, and the microphone is not used. Normal scrolling remains available.

Visit the four campus destinations to complete the passport and unlock Aurora lighting. Discovery progress is saved in the browser. The traffic puzzle and camera scrolling provide optional bonus discoveries.

## Guestbook

The counter records deliberate marks, not page views. A signed HTTP-only cookie and a database constraint prevent repeat marks from the same browser. Clearing cookies or changing browsers can allow another mark.

The API checks request origins and limits repeated writes. Rate limiting stores a short-lived keyed hash rather than raw connection addresses. No name, email, or message is collected.

## Checks

```sh
npm run build
npm test
```

The test suite covers guestbook persistence and duplicate submissions, date boundaries, passport progress, traffic routing, and gesture-scroll logic.

The hand model and simulated camera controls have been checked. Real camera behavior still needs testing on the target device, particularly on phones with different performance or browser support.

## Deploy

This repository includes the configuration for the existing Cloudflare deployment.

```sh
npx wrangler login --device
npx wrangler d1 migrations apply portfolio-guestbook --remote
npm run deploy
```

The production signing secret is stored in Cloudflare. Keep it stable so existing guestbook cookies continue to work. Credentials, `.env`, `.dev.vars`, dependencies, and local Cloudflare state are excluded from Git.

For a separate deployment, use your own domain and D1 binding in `wrangler.jsonc`, then set a random `COOKIE_SECRET` of at least 32 characters with `wrangler secret put COOKIE_SECRET`. Deploy the Worker and assets together; a static-only upload does not include the guestbook API.

## Contact

[marrkann08@gmail.com](mailto:marrkann08@gmail.com) · [LinkedIn](https://www.linkedin.com/in/keshav-kumar-markan-1bb0483a4)
