# WardrobeIQ — Integrated Frontend + Backend

This repo contains two apps that were already built to talk to each other:

- `backend/backend` — Express + TypeScript API (MongoDB, LangGraph AI stylist agent)
- `frontend/frontend` — React + Vite + TypeScript client

## What I checked/fixed to confirm integration

- **API contract**: every call in `frontend/frontend/src/api/client.ts` maps 1:1 to a route in
  `backend/backend/src/routes/v1/*`, including aliases (`/customers` ↔ `/profile`, `/customers/:id/closet` ↔ `/closet`).
- **Response envelope**: backend wraps success as `{ data }` and errors as `{ error: { message } }`
  (`utils/response.ts`); the frontend's `fetchJson` unwraps exactly that shape.
- **Types**: `types/domain.ts` and `types/dto.ts` are structurally identical between frontend and
  backend (backend just has a few extra internal Mongo document interfaces).
- **CORS**: backend allows `http://localhost:5173` and any `http://localhost:*` origin, matching Vite's default port.
- **Ports/env**: backend defaults to port `3000`, frontend's `VITE_API_BASE_URL=http://localhost:3000`,
  and Vite's dev server also proxies `/api` and `/health` to `localhost:3000` as a fallback.
- **Build verification**: `npm run build` in the frontend (tsc + vite) completes with no errors.
  I also fixed a missing optional native dependency (`@rollup/rollup-linux-x64-gnu`) that blocked the build.
- **Backend startup**: verified the server boots, attempts MongoDB, and falls back to an in-memory
  MongoDB (`mongodb-memory-server`) when no local Mongo is running — this fallback needs to download a
  `mongod` binary from `fastdl.mongodb.org` the first time, which requires outbound internet access.

Net result: the two codebases are already correctly wired together. Nothing needed to be changed in
the application code itself.

## Run it (recommended: Docker Compose)

I added `docker-compose.yml`, `backend/backend/Dockerfile`, and `frontend/frontend/Dockerfile` so you
can bring up a real MongoDB + backend + frontend with one command:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (health check at `/health`)
- Mongo: localhost:27017 (persisted in a named volume)

Set `OPENAI_API_KEY` in your shell (or a `.env` next to `docker-compose.yml`) if you want the AI
stylist agent to use a real LLM instead of its rule-based fallback stylist.

## Run it without Docker

You need a MongoDB instance reachable at `mongodb://localhost:27017` (or update `backend/backend/.env`).

```bash
# Terminal 1
cd backend/backend
npm install
npm run dev

# Terminal 2
cd frontend/frontend
npm install
npm run dev
```

Then open http://localhost:5173. The backend auto-seeds the database on first boot if it's empty.

> Note: if no MongoDB is reachable, the backend tries to spin up an in-memory MongoDB automatically,
> which requires downloading a `mongod` binary the first time it runs (needs internet access).
