# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Blue Ticket Driving** (青切符ドライブ) — a PWA that tracks whether a cyclist stops at every intersection along a planned route. User sets a destination before riding, an OSRM bicycle route is computed, and GPS tracks whether they stopped (speed < 3 km/h) at each intersection (3+ roads). Built for the April 2026 Japanese bicycle penalty law changes.

Language: Japanese specification/design docs, English code.

## Repository Structure

- `frontend/` — React 19 + Vite + TypeScript PWA
- `backend/` — Python FastAPI + OSRM + geopy
- `仕様書.md` — Requirements specification
- `設計書.md` — Technical design document

## Frontend Commands

Run from `frontend/`:

```bash
npm run dev       # Vite dev server (HTTPS + proxy to backend)
npm run build     # tsc -b && vite build
npm run lint      # eslint .
```

## Backend Commands

Run from `backend/`:

```bash
uv venv .venv && uv pip install -r requirements.txt  # first time
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # dev server
```

## Dev Setup

Run both servers:
1. `cd backend && .venv/bin/uvicorn app.main:app --port 8000 --reload`
2. `cd frontend && npm run dev`

Vite proxies `/api/*` → `http://localhost:8000` (configured in `vite.config.ts`). The frontend uses HTTPS via `@vitejs/plugin-basic-ssl` (required for GPS on mobile LAN access).

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router v7, Zustand (client state), Dexie.js (IndexedDB offline buffer), React Leaflet (maps), lucide-react (icons)
- **Backend**: FastAPI, OSRM (public API for bicycle routing), geopy (distance calculations), httpx, Pydantic v2
- **Storage**: IndexedDB (local-first) + in-memory dict on backend (Supabase integration deferred)
- **Communication**: HTTP POST for GPS batch (every 5s)

## Architecture

```
PWA (React SPA)
  ├─ Wake Lock API (screen on during rides)
  ├─ Destination setup: Nominatim search + map tap → OSRM route
  ├─ GPS watchPosition → Dexie.js → POST /api/gps (5s batch)
  └─ Local IndexedDB (trips, gpsPoints, intersectionResults, routes)

FastAPI Server (single app, router separation)
  ├─ POST /api/trips — Create trip with destination
  ├─ POST /api/trips/{id}/route — OSRM bicycle route + intersection extraction
  ├─ POST /api/gps — GPS batch → intersection stop check + auto-reroute
  ├─ GET /api/trips/{id}/intersections — Intersection results summary
  └─ Intersection = node with 3+ bearings from OSRM, stop = speed < 3 km/h within 15m
```

## Key Files

- `frontend/src/pages/RidingPage.tsx` — Two-phase UI: destination setup → riding with live map
- `frontend/src/pages/ResultPage.tsx` — Trip summary with intersection stop/miss markers (green/red)
- `frontend/src/hooks/useGpsTracker.ts` — GPS tracking + Dexie write + batch sync + intersection updates
- `frontend/src/hooks/useWakeLock.ts` — Screen Wake Lock lifecycle
- `frontend/src/stores/rideStore.ts` — Zustand store (ride state + route + intersection counts)
- `frontend/src/lib/db.ts` — Dexie IndexedDB schema (trips, gpsPoints, intersectionResults, routes)
- `frontend/src/lib/api.ts` — API client + Nominatim search
- `backend/app/adapters/osrm_gateway.py` — OSRM API client, intersection extraction (bearings >= 3)
- `backend/app/usecases/gps_analysis.py` — Intersection stop detection + off-route rerouting
- `backend/app/usecases/route_planning.py` — Route planning use case
- `backend/app/adapters/memory_repo.py` — In-memory repo (trips, GPS, routes, intersection results)
- `backend/app/config.py` — All tunable thresholds (env prefix: BTD_)

## Key Constraints

- Background GPS is impossible in browser — Wake Lock API keeps screen ON during rides
- iOS Safari: Service Worker freezes when backgrounded, no Background Sync
- GPS requires HTTPS (localhost is exempt)
- OSRM public API: no API key needed, but rate-limited — for production use self-hosted OSRM
- Intersection definition: OSRM step intersection with bearings.length >= 3 (T-junction or more)
