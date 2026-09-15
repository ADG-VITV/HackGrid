# HackGrid frontend

The HackGrid web app: landing page, rules, Google sign-in, team onboarding,
the organiser portal and the live bidding room. **Next.js 16 (App Router)**,
React 19, Tailwind 4, Firebase Auth, `socket.io-client`.

This directory is a complete, standalone application. It has no dependency on
the backend's source or on any parent directory — copy it into its own
repository and everything in this document still applies. It talks to the
**HackGrid backend** (a separate deployment) over HTTPS and WebSocket, at the
URL you configure.

```
browser ──► this app (Vercel)
              │  server actions  ──HTTPS──►  backend REST API   (/api/auction, /api/teams, /api/admin)
              │
              └──── socket.io-client ──WSS──►  backend Socket.IO (/socket.io)
```

---

## Contents

1. [What is in here](#1-what-is-in-here)
2. [Requirements](#2-requirements)
3. [Setup](#3-setup)
4. [Environment variables](#4-environment-variables)
5. [Running the frontend](#5-running-the-frontend)
6. [How the frontend talks to the backend](#6-how-the-frontend-talks-to-the-backend)
7. [Pages and the backend calls behind them](#7-pages-and-the-backend-calls-behind-them)
8. [Authentication](#8-authentication)
9. [Deploying to Vercel](#9-deploying-to-vercel)
10. [Verifying frontend ↔ backend communication](#10-verifying-frontend--backend-communication)
11. [Shared contract files](#11-shared-contract-files)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What is in here

```
frontend/
├── app/
│   ├── layout.tsx, ClientLayout.tsx   root layout, navbar, auth provider
│   ├── page.tsx                       landing page
│   ├── rules/                         rulebook
│   ├── login/                         Google sign-in
│   ├── teams/                         create / join a team, team dashboard
│   │   └── actions.ts                 server actions → backend /api/teams
│   ├── bidding/                       the live auction room
│   │   ├── actions.ts                 server actions → backend /api/auction
│   │   └── use-auction-socket.ts      the Socket.IO client hook
│   └── admin/                         organiser portal
│       └── actions.ts                 server actions → backend /api/admin
├── components/                        UI (navbar, hero, timeline, footer, primitives)
├── context/AuthContext.tsx            Firebase auth state
├── lib/
│   ├── backend.ts                     backend URL + the one fetch helper the actions use
│   ├── socket-events.ts               the Socket.IO event/payload types (mirrors the backend)
│   ├── firebase.ts                    Firebase app init from NEXT_PUBLIC_FIREBASE_*
│   ├── use-viewer.ts                  who is signed in (Google, or dev-only "act as")
│   ├── auction-catalog.mjs (+.d.mts)  copy of the backend's catalogue (capsules, tiers)
│   └── auction-rules.mjs   (+.d.mts)  copy of the backend's rules (constants, codes)
├── public/                            static assets, fonts
├── next.config.ts, tsconfig.json, postcss.config.mjs, eslint.config.mjs
├── package.json, package-lock.json
├── .env.example                       every variable, documented
└── README.md                          this file
```

There is **no database code, no Prisma, no Express and no Socket.IO server**
here. Every piece of data comes from the backend over HTTP or the socket.

---

## 2. Requirements

| Requirement | Version |
| --- | --- |
| Node.js | **≥ 20.12** (24.x tested) — `package.json` declares `"engines": { "node": ">=20.12.0" }` |
| npm | ≥ 9 |
| A running HackGrid backend | local (`http://localhost:4000`) or deployed |
| A Firebase project with Google sign-in enabled | for `/login` |

---

## 3. Setup

```bash
git clone <this repository>
cd frontend                   # or the repository root, if this directory is the repo
npm install
cp .env.example .env.local    # then edit: backend URL + Firebase config
npm run dev                   # http://localhost:3000
```

Have the backend running first (`npm run dev` in the backend repository, on
port 4000 by default). The Teams, Bidding and Admin pages will show
"Could not reach the backend" until it is.

---

## 4. Environment variables

Next.js reads `.env.local` in development and `.env.production` /
`.env.local` for builds; on Vercel, set them in the dashboard.

> **`NEXT_PUBLIC_*` variables are inlined into the browser bundle at build
> time.** Changing one on Vercel requires a **redeploy** to take effect.
> Variables without the prefix are server-only and are read at runtime.

| Variable | Required | Exposed to browser | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BACKEND_URL` | **yes** | yes | Public origin of the backend, **no trailing slash**: `http://localhost:4000` locally, `https://hackgrid-backend.onrender.com` in production. The browser opens its Socket.IO connection here, and the server actions call the REST API here unless `BACKEND_URL` overrides them. |
| `BACKEND_URL` | no | no | Optional server-only override for the server actions (e.g. an internal address). Defaults to `NEXT_PUBLIC_BACKEND_URL`. |
| `ADMIN_API_KEY` | no | **no** | Must equal the backend's `ADMIN_API_KEY`. The admin server actions send it as `x-admin-key`, which is what unlocks organiser controls when the backend runs in production. Never prefix it with `NEXT_PUBLIC_`. Without it, the admin page's buttons return the backend's "requires admin authentication" message in production (they work without it against a local dev backend). |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | yes | Firebase web config — Firebase console → Project settings → Your apps → SDK setup |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | yes | ″ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | yes | ″ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | yes | yes | ″ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | yes | yes | ″ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | yes | ″ |

The Firebase values are public identifiers (Firebase protects sign-in with
its authorised-domains list, not by keeping these secret).

A local `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…
```

---

## 5. Running the frontend

All commands run from this directory.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with Fast Refresh on `http://localhost:3000`. Uses `.env.local`. The dev-only "act as" picker on `/teams` appears in this mode. |
| `npm run build` | Production build (`next build`). Type-checks, lints, compiles and prerenders. This is what Vercel runs. Requires the `NEXT_PUBLIC_*` variables to be present **at build time**. |
| `npm start` | Serves the production build (`next start`) on port 3000 (`PORT` to change). Run `npm run build` first. Use this to test the production bundle locally or on a non-Vercel host. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |

The frontend never needs the database and never needs to run on the same
machine, port or origin as the backend.

---

## 6. How the frontend talks to the backend

There are two channels, both configured by `NEXT_PUBLIC_BACKEND_URL`.

### REST, via server actions (`lib/backend.ts`)

Every data read and every mutation on the Teams, Bidding and Admin pages is a
Next.js **server action** (`app/*/actions.ts`). Each one is a thin proxy: it
calls `backendRequest(path, …)` from `lib/backend.ts`, which does a
`fetch` to `<backend>/api/…` with `cache: "no-store"` and returns the
backend's JSON to the page.

Why proxy through server actions instead of fetching from the browser?

- The client components and their types (`AdminContext`, `BiddingContext`,
  `AuctionTeamState`, …) are unchanged from when the data came from the
  database directly — the pages did not have to be rewritten.
- `ADMIN_API_KEY` stays on the server. The browser never sees it.
- `revalidatePath()` still runs after a successful mutation.

`backendRequest` returns the backend's body for `2xx` **and `4xx`** — the
backend's `4xx` bodies are `{ status: "error", message }` reports the UI
already renders inline (validation messages, "already live", the organiser
gate's 403). Only an unreachable backend, a non-JSON answer or a `5xx` throws
`BackendError`; each action turns that into the page's own error state
("Could not reach the backend…").

On Vercel these server actions run as serverless functions, so the request
path is **browser → Vercel → Render → Vercel → browser**. Latency is a few
tens of milliseconds more than a direct call; the auction's real-time path
(bids, outbids, timers) does not go through it — that is the socket.

### Socket.IO, directly from the browser (`app/bidding/use-auction-socket.ts`)

The bidding page opens **one Socket.IO connection straight from the browser to
the backend**:

```ts
io(getPublicBackendUrl(), {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  auth: { podId, teamId, email },   // identity in the handshake, not the query string
});
```

Only the **team lead** opens a socket; a member gets the read-only view
without one (a second seat would count towards the pod's quorum). Reconnection
and backoff are Socket.IO's own. The event contract is typed in
`lib/socket-events.ts` and documented in the backend README (§7).

Because this is a cross-origin connection, the backend's `CORS_ORIGIN` must
include this app's origin. If it does not, the socket never connects (browser
console: CORS error on `/socket.io/?EIO=4…`).

---

## 7. Pages and the backend calls behind them

| Page | What it calls | Backend route |
| --- | --- | --- |
| `/` , `/rules` | nothing | — |
| `/login` | Firebase only | — |
| `/teams` | `getAuctionTeamForEmailAction(email)` | `GET /api/teams/by-email/:email` |
| | `submitAuctionTeamAction(form)` — create or join | `POST /api/teams/submit` |
| | `listUsersAction()` — dev-only "act as" roster | `GET /api/teams/users` |
| | team dashboard: `getBiddingContextAction(email)` | `GET /api/auction/context/:teamIdOrEmail` |
| `/bidding` | `getBiddingContextAction(email)` on load and after every lifecycle event | `GET /api/auction/context/:teamIdOrEmail` |
| | Socket.IO room (lead only): `ROOM_STATE`, `BID` → ack, `SYNC`, `OUTBID`, `LOT_*`, `CAPSULE_*`, `EVENT_COMPLETE` | `wss://…/socket.io` |
| `/admin` | `getAdminContextAction()` on load and every 10 s | `GET /api/admin/context` |
| | `startEventAdminAction()` | `POST /api/admin/event/start` |
| | `resetEventAdminAction()` | `POST /api/admin/event/reset` |
| | `startRoundAction(key)` | `POST /api/admin/capsules/:key/start` |
| | `resetCapsuleAction(key)` | `POST /api/admin/capsules/:key/reset` |
| | `resetSubCapsuleAction(key, tier)` | `POST /api/admin/capsules/:key/sub-capsules/:tier/reset` |
| | `createManualPodAction(key, n, remainder)` | `POST /api/admin/capsules/:key/pods` |
| | `resetPodAction(key, podId)` | `POST /api/admin/capsules/:key/pods/:podId/reset` |
| | `addTeamToPodAction(key, podId, teamId)` | `POST /api/admin/capsules/:key/pods/:podId/teams` |
| | `removeTeamFromPodAction(key, podId, teamId)` | `DELETE /api/admin/capsules/:key/pods/:podId/teams/:teamId` |
| | `setPodRemainderFlagAction(key, podId, flag)` | `PATCH /api/admin/capsules/:key/pods/:podId/remainder` |
| | `deleteManualPodAction(key, podId)` | `DELETE /api/admin/capsules/:key/pods/:podId` |

All admin mutations send `x-admin-key` when `ADMIN_API_KEY` is set.

---

## 8. Authentication

- **Users** sign in with Google through Firebase Auth (`/login`). The signed-in
  email is the identity the backend uses to find their team and decide whether
  they are its lead. Firebase sign-in is client-side; the backend trusts the
  email the app sends (this is the original application's model).
- **Firebase authorised domains**: in the Firebase console → Authentication →
  Settings → Authorised domains, add your Vercel domain(s) (`*.vercel.app`
  previews included) or the Google popup will be refused.
- **Development "act as"**: in `npm run dev` only, the Teams page shows a
  picker that lets this tab impersonate any user in the backend's roster
  (`GET /api/teams/users`, which the backend only serves in its own
  development mode). It is stored in `sessionStorage` per tab and never exists
  in a production build.
- **Organisers**: the `/admin` page has no login of its own. Its mutations are
  authorised by `ADMIN_API_KEY` (server-only) as described in §4 and in the
  backend README §9. The page itself is reachable by anyone who knows the URL;
  without the key, the backend refuses every mutation in production.

---

## 9. Deploying to Vercel

The frontend is a standard Next.js app; Vercel needs no custom configuration.

### First deploy

1. Push this directory's repository to GitHub/GitLab/Bitbucket.
2. Vercel dashboard → **Add New → Project** → import the repository.
3. **Framework Preset**: Next.js (auto-detected).
   **Root Directory**: leave blank if this directory is the repository root;
   otherwise set it to `frontend`.
   **Build Command**: `npm run build` (default). **Install Command**:
   `npm ci` / `npm install` (default). **Output**: default.
4. **Environment Variables** — add for *Production* (and *Preview* if you use
   previews):

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_BACKEND_URL` | `https://<your-backend>.onrender.com` (no trailing slash) |
   | `ADMIN_API_KEY` | the backend's `ADMIN_API_KEY` (only if you want the admin page to work in production) |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` … `NEXT_PUBLIC_FIREBASE_APP_ID` | from the Firebase console |

5. **Deploy.** Vercel runs `npm ci` + `next build` and serves the app; server
   actions become serverless functions automatically.

### After the first deploy

- Copy the production URL (`https://<project>.vercel.app`, plus any custom
  domain) into the **backend's `CORS_ORIGIN`** and redeploy the backend.
  Preview deployments have distinct origins — add the ones you use, or use
  the stable `https://<project>-git-<branch>-<team>.vercel.app` form.
- Add the same domain(s) to Firebase's **authorised domains**.
- Any later change to a `NEXT_PUBLIC_*` variable needs a **Redeploy**
  (Deployments → ⋯ → Redeploy) because it is baked in at build time.

### Node version

Vercel picks Node from `package.json`'s `engines` (`>=20.12`); its default
(20.x or newer) satisfies it. Override in Project Settings → General → Node.js
Version if needed.

### Non-Vercel hosts

`npm run build && npm start` runs the production server on any Node host
(port from `PORT`). Nothing here is Vercel-specific.

---

## 10. Verifying frontend ↔ backend communication

After deploying both:

1. **Backend reachable from the browser**: open
   `https://<backend>/health` in a tab → `{"status":"ok"}`.
2. **CORS**: in the browser console on your deployed frontend, run
   ```js
   fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/health").then(r => r.json()).then(console.log)
   ```
   (or paste the URL literally). A CORS error here means the backend's
   `CORS_ORIGIN` does not contain this exact origin.
3. **Server actions**: sign in and open `/teams`. Your team (or the create /
   join cards) appears → `GET /api/teams/by-email` and
   `GET /api/auction/context` worked through the server action. A red
   "Could not reach the backend" means `NEXT_PUBLIC_BACKEND_URL` is wrong or
   the backend is down / asleep.
4. **Socket**: as a team lead with a live round, open `/bidding`. The console
   panel at the bottom of the room shows `Connected to room <pod id>` and the
   pod's members light up as they arrive. In DevTools → Network → WS you will
   see one connection to `<backend>/socket.io/?EIO=4&transport=websocket`.
   The backend's logs show `[auction] join pod=… team=…`.
5. **Admin**: open `/admin`. The roster and rounds load
   (`GET /api/admin/context`). Press *Refresh*; then try a harmless mutation
   such as creating and deleting a manual pod in a pending round. A `403
   Organiser controls require …` message means `ADMIN_API_KEY` is missing or
   differs between the two deployments.

Locally, the same checks work against `http://localhost:4000`; the backend
prints every API call as `[api] METHOD /path`.

---

## 11. Shared contract files

Two small pure-JS files are duplicated between the two repositories so the UI
can render the catalogue and rule constants without a network round trip:

| Frontend | Backend |
| --- | --- |
| `lib/auction-catalog.mjs` (+ `.d.mts`) | `lib/auction-catalog.mjs` |
| `lib/auction-rules.mjs` (+ `.d.mts`) | `lib/auction-rules.mjs` |

They must stay identical. If a price, tier name, timing or rejection code
changes on the backend, copy the file here too. The Socket.IO payload types
in `lib/socket-events.ts` likewise mirror what `backend/server.mjs` and
`backend/lib/auction-hub.mjs` emit.

---

## 12. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| "Could not reach the backend" on Teams / Bidding / Admin | `NEXT_PUBLIC_BACKEND_URL` unset, has a trailing slash or typo, or the backend is down. Remember: redeploy after changing a `NEXT_PUBLIC_*` variable on Vercel. |
| Teams page loads but the bidding room never connects; console shows a CORS error on `/socket.io/…` | Backend `CORS_ORIGIN` does not include this exact origin (scheme, host, port; no path). |
| Room says "Connection lost — reconnecting" for ~1 minute on first open | The backend is on Render's free plan and was asleep. Wait, or move to a paid plan. |
| Admin buttons return "Organiser controls require …" | Production backend without `ADMIN_API_KEY`, or the frontend's `ADMIN_API_KEY` differs. Set both, redeploy both. |
| Google popup: `auth/unauthorized-domain` | Add the Vercel domain to Firebase → Authentication → Authorised domains. |
| `/teams` "act as" picker is missing or empty | It only exists in `npm run dev`, and only lists users when the **backend** is also in development mode. |
| Build fails with a missing `NEXT_PUBLIC_*` variable | Set it in Vercel's environment for the environment being built (Production / Preview). |
