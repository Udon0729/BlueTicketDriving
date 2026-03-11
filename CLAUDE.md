# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Blue Ticket Driving** (青切符ドライブ) — a PWA that detects bicycle traffic violations (signal ignoring, failure to stop) using GPS and camera data, then reports results to parents. Built for the April 2026 Japanese bicycle penalty law changes.

Language: Japanese specification/design docs, English code.

## Repository Structure

- `frontend/` — React 19 + Vite 7 + TypeScript PWA (on `develop` branch; `main` currently only has spec docs)
- `backend/` — Python FastAPI server (placeholder only, on `develop` branch)
- `仕様書.md` — Requirements specification
- `設計書.md` — Technical design document (architecture, API specs, DB schema, dev roadmap)

**Branches**: `main` has spec docs only. `develop` and `kento_branch` have the frontend scaffold.

## Frontend Commands

All commands run from `frontend/`:

```bash
npm run dev       # Vite dev server with HMR
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # Preview production build
```

## Tech Stack

- **Frontend**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS + shadcn/ui, React Router v7
- **State**: Zustand (client state) + TanStack Query (server state) — never mix these concerns
- **PWA**: vite-plugin-pwa (injectManifest mode), Dexie.js (IndexedDB) for offline GPS buffering
- **Backend**: FastAPI (single app, router separation), uv for package management
- **ML/CV**: YOLOv8n + OpenCV for camera analysis, Shapely/geopy for GPS analysis
- **Database**: Supabase (PostgreSQL + Auth + Storage + Edge Functions), RLS enabled on all tables
- **Communication**: WebSocket (reconnecting-websocket) for camera frames, HTTP POST for GPS batch
- **Deploy**: Vercel (frontend), Railway/Render + Docker (backend)

## Architecture

```
PWA (React SPA)
  ├─ Wake Lock API (keep screen on during rides)
  ├─ GPS watchPosition → Dexie.js buffer → HTTP POST batch (every 5s)
  ├─ Camera Canvas+toBlob (480p, 2-5fps) → WebSocket → FastAPI
  └─ Supabase SDK → Auth / DB / Storage

FastAPI Server (single app)
  ├─ /ws/camera — YOLOv8n + OpenCV signal detection
  ├─ /api/gps — OSM + Shapely stop sign detection
  └─ /api/trips — session CRUD

Supabase
  ├─ PostgreSQL (profiles, trips, gps_points, violations)
  ├─ Storage (violation photos)
  └─ Edge Functions (parent email via Resend)
```

## Key Constraints

- Background GPS is impossible in browser — Wake Lock API keeps screen ON during rides
- iOS Safari: Service Worker freezes when backgrounded, no Background Sync — use `online`/`visibilitychange` events for manual sync
- Camera requires `playsinline` attribute on iOS Safari
- All tables have RLS policies (user can only access own data)
