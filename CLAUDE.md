# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Rulely Tracker — a single-user, local-only web app for running a 6-week customer-discovery sprint for a parenting product ("Rulely"). The owner cold-outreaches parents and moves them through a pipeline toward 14-day product trials. The app's job is to keep the funnel from leaking and to sustain daily momentum via a weekday streak.

## Commands

```
npm run dev        # Vite dev server on :5173 (talks directly to Supabase)
npm run build      # static production build → dist/  (needs VITE_SUPABASE_* env)
npm run preview    # build, then serve the static dist with `vite preview`
npm run typecheck  # tsc --noEmit
```

There is no test runner and no linter — `npm run typecheck` is the only automated check. The app needs `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (see `.env.example`); copy to `.env.local` for dev. Deploy as a **static site** (Vercel/GitHub Pages); run `db/schema.sql` once in the Supabase project. For a GitHub Pages *project* site set `VITE_BASE=/<repo>/` at build time.

## Architecture

**Single source of truth, re-read wholesale.** The entire UI state is one `DB` object: `{ parents, journal, messageCounts, followups }` (shape in src/types.ts).

- **Backend is Supabase** (Postgres), not a local server. `src/api.ts` creates the client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` and maps four tables (`parents`, `journal`, `followups`, `message_counts`) to/from the `DB` shape. `db/schema.sql` is the source of truth for tables + RLS. Watch the mapping seams: followups `parent_id` ⇄ `parentId`, and `message_counts` rows ⇄ the `messageCounts` object.
- **Every api method does its write, then re-reads the whole DB** (`getState`) and resolves to it, so callers keep doing `setDb(await api.foo(...))`. App.tsx holds the one `db` and passes `db` + `setDb` to every component — no partial updates or client cache. The status-history append, `trial_start_date` auto-set, and message clamp logic live in `src/api.ts` (ported from the old server).
- **Ships empty; data entry is in-app CRUD** — the "Add a parent" form, row ✎/✕ buttons, and click-to-advance status badge (Pipeline tab). Topbar: Load sample / Export backup / Clear all. No file-upload/import flow.
- **`server/` is legacy** — the previous Express + `server/data.json` backend, no longer used by the app (kept for reference only).

**Derived data is computed, never stored.** src/stats.ts derives everything the dashboard, follow-up queue, and patterns tab show, directly from the DB:
- *Follow-up queue* is generated from rules, not stored as a todo list: trial check-ins surface at trial-day 3/7/14, and unanswered cold contacts surface "bump 1" at 4 days and "bump 2" at 10 days. Marking one done writes a `followup` record keyed `parentId:type`, which then filters that item out. Items sort by an urgency score.
- *Streak* = consecutive **weekdays** with any activity, ending today. Weekends never count and never break it; the current day gets grace (an as-yet-inactive in-progress weekday doesn't reset it). "Activity" = a message, journal entry, follow-up, or status change on that day.
- A *conversation* is defined as a parent entering the `interviewed` status (read from status_history timestamps), not a separate record.

**The pipeline is the domain core.** A parent advances along `HAPPY_PATH` (types.ts): cold_sent → replied → scheduled → interviewed → trial_started → trial_active → trial_completed, with `churned` off to the side. The UI advances one step per click via `nextStatus()`. Server-side `setStatus()` appends every change to the parent's `status_history` (an ISO-timestamped timeline the stats depend on) and auto-sets `trial_start_date` when a parent reaches `trial_started`. Route status changes through `setStatus()` so the timeline stays complete.

**Dates are local, not UTC, and the logic is duplicated.** Everything keys on `YYYY-MM-DD` from `todayKey()`, computed from local time on purpose so "today" matches the user's wall clock. This helper lives in **both** server/util.js and src/dateUtils.ts — keep them in sync if you touch date logic.

## Product constraint: minimalism is intentional

Keep the *feature set* tiny — favor the existing surfaces (dashboard/streak, pipeline table, follow-up queue, patterns, end-of-day journal) over adding new ones; the owner originally ruled out charts/AI/calendar/email. **Note:** the earlier "local-only / no database / no mobile" rule no longer holds — as of 2026-05 the app is deployed (Supabase backend, usable on a phone). There is still **no login**: the anon RLS policies leave data open to anyone with the URL — a known follow-up if privacy is needed.
