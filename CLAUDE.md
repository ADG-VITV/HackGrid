# HackGrid

Two independent applications in one repository — do not add a root package.json
or anything that couples them:

- `frontend/` — Next.js app (Vercel). Talks to the backend only over HTTP
  (`lib/backend.ts`, server actions in `app/*/actions.ts`) and Socket.IO
  (`app/bidding/use-auction-socket.ts`) at `NEXT_PUBLIC_BACKEND_URL`.
- `backend/` — Express + Socket.IO + Prisma (Render). Plain `.mjs`, no build.
  Routers in `backend/lib/*-router.mjs`; the engine and hub in
  `backend/lib/auction-{engine,hub}.mjs`.

`frontend/lib/auction-catalog.mjs` and `frontend/lib/auction-rules.mjs` are
verbatim copies of the backend files of the same name — change both together.

Run each with `npm run dev` inside its directory. The READMEs in each directory
are the deployment documentation; keep them accurate when routes, env vars or
commands change.

@frontend/AGENTS.md
