# HackGrid

The HackGrid resource auction, split into two independently deployable
applications:

| Directory | What | Stack | Deploys to | Docs |
| --- | --- | --- | --- | --- |
| [`frontend/`](frontend/) | the web app: landing, teams, bidding room, organiser portal | Next.js 16, React 19, Firebase Auth, socket.io-client | **Vercel** | [frontend/README.md](frontend/README.md) |
| [`backend/`](backend/) | the API and the live bidding rooms | Node, Express 5, Socket.IO, Prisma 7 / Postgres | **Render** | [backend/README.md](backend/README.md) |

```
frontend (Vercel)  ──HTTPS + WSS──►  backend (Render)  ──Prisma──►  Postgres
```

Each directory is self-contained — its own `package.json`, lockfile,
environment file and README — and can be moved into its own repository
without changes. Nothing at this root is required by either.

## Running locally

Two terminals:

```bash
cd backend && cp .env.example .env   # set DATABASE_URL
npm install && npm run dev           # http://localhost:4000
```

```bash
cd frontend && cp .env.example .env.local   # NEXT_PUBLIC_BACKEND_URL=http://localhost:4000 + Firebase config
npm install && npm run dev                  # http://localhost:3000
```

The frontend finds the backend through `NEXT_PUBLIC_BACKEND_URL`; the backend
allows the frontend through `CORS_ORIGIN` (any origin in development). See
each README for every variable and the deployment steps.

## Repository layout

```
.
├── backend/     standalone Node service   → backend/README.md
├── frontend/    standalone Next.js app    → frontend/README.md
└── docs/        historical design notes
```
