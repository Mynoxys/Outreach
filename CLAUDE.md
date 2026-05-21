# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Rulely Tracker — a single-user, local-only web app for running a 6-week customer-discovery sprint for a parenting product ("Rulely"). The owner cold-outreaches parents and moves them through a pipeline toward 14-day product trials. The app's job is to keep the funnel from leaking and to sustain daily momentum via a weekday streak.

## Commands

```
npm run dev        # Vite dev server (5173) + Express API (3001) together, both auto-reload
npm run server     # Express API only
npm run build      # Vite production build → dist/
npm run preview    # build, then serve everything from Express (prod-like, single port 3001)
npm run seed       # fill server/data.json with realistic sample data
npm run reset      # clear server/data.json back to empty
npm run typecheck  # tsc --noEmit
```

There is no test runner and no linter — `npm run typecheck` is the only automated check. In dev, Vite proxies `/api/*` to Express on :3001 (vite.config.ts).

## Architecture

**Single source of truth, replaced wholesale.** The entire application state is one `DB` object: `{ parents, journal, messageCounts, followups }` (shape in src/types.ts and server/db.js).

- The server keeps the DB in memory and persists the *whole thing* to `server/data.json` on every mutation via `mutate()` (atomic write: temp file + rename). There is no database. Whole-DB swaps (clear / load sample / import a backup) go through `replaceDB(next)` instead of `mutate()`.
- **Every API mutation responds with the full, updated DB.** src/api.ts is built entirely around this: each call resolves to a `DB`, and callers do `setDb(await api.foo(...))`. App.tsx holds the one `db` in state and passes `db` + `setDb` to every component. There is no partial update, optimistic UI, or client cache — state is always a full replacement from the server. When adding an endpoint, follow the contract: mutate via `mutate()` (or `replaceDB()` for whole-DB ops), then `res.json(getDB())`.
- **Ships empty; primary data entry is in-app CRUD.** `server/data.json` starts as the empty `DEFAULT_DB`. Parents are created/edited/deleted directly in the Pipeline tab (the "Add a parent" form, the row ✎/✕ buttons, and the click-to-advance status badge). The topbar has Load sample / Export backup / Clear all (`POST /api/data/sample`, `GET /api/export`, `POST /api/data/clear`); sample data is built by `server/sampleData.js` (`buildSampleData()`, dates relative to today), and `npm run seed`/`reset` are CLI equivalents. A strict `POST /api/import` exists for restoring an exported backup via curl (validated by `isValidDB()`; 400 + DB untouched on bad shape) — it is intentionally **not** surfaced in the UI (no file-upload flow).

**Derived data is computed, never stored.** src/stats.ts derives everything the dashboard, follow-up queue, and patterns tab show, directly from the DB:
- *Follow-up queue* is generated from rules, not stored as a todo list: trial check-ins surface at trial-day 3/7/14, and unanswered cold contacts surface "bump 1" at 4 days and "bump 2" at 10 days. Marking one done writes a `followup` record keyed `parentId:type`, which then filters that item out. Items sort by an urgency score.
- *Streak* = consecutive **weekdays** with any activity, ending today. Weekends never count and never break it; the current day gets grace (an as-yet-inactive in-progress weekday doesn't reset it). "Activity" = a message, journal entry, follow-up, or status change on that day.
- A *conversation* is defined as a parent entering the `interviewed` status (read from status_history timestamps), not a separate record.

**The pipeline is the domain core.** A parent advances along `HAPPY_PATH` (types.ts): cold_sent → replied → scheduled → interviewed → trial_started → trial_active → trial_completed, with `churned` off to the side. The UI advances one step per click via `nextStatus()`. Server-side `setStatus()` appends every change to the parent's `status_history` (an ISO-timestamped timeline the stats depend on) and auto-sets `trial_start_date` when a parent reaches `trial_started`. Route status changes through `setStatus()` so the timeline stays complete.

**Dates are local, not UTC, and the logic is duplicated.** Everything keys on `YYYY-MM-DD` from `todayKey()`, computed from local time on purpose so "today" matches the user's wall clock. This helper lives in **both** server/util.js and src/dateUtils.ts — keep them in sync if you touch date logic.

## Product constraint: minimalism is intentional

This tool is deliberately tiny. The owner has explicitly chosen *not* to build: authentication, charts/graphs, AI features, calendar or email integration, and mobile support. It is single-user and local by design (hence no auth). Treat scope creep as a regression — when in doubt, favor the five existing surfaces (dashboard/streak, pipeline table, follow-up queue, patterns, end-of-day journal) over adding new ones.
