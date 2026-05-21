-- Rulely Tracker — Supabase schema
-- Run this once: Supabase dashboard → SQL Editor → New query → paste → Run.

create table if not exists parents (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null default '',
  source              text not null default '',
  first_contact_date  text not null,
  status              text not null default 'cold_sent',
  trial_start_date    text,
  notes               text not null default '',
  key_quote           text not null default '',
  failure_moment_tag  text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  status_history      jsonb not null default '[]'::jsonb
);

create table if not exists journal (
  id          uuid primary key default gen_random_uuid(),
  date        text not null,
  learned     text not null default '',
  quote       text not null default '',
  changes     text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists followups (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references parents(id) on delete cascade,
  type       text not null,
  date       text not null
);

create table if not exists message_counts (
  date   text primary key,
  count  integer not null default 0
);

-- Row Level Security.
-- The policies below let the PUBLIC anon key read/write everything, which is
-- what makes the app work with no login. TRADE-OFF: anyone who has your app URL
-- can read and edit your data. Fine for a private/low-profile single-user tool;
-- if you want it locked down, ask for the Supabase Auth (login) version and
-- these "anon" policies get replaced with per-user ones.
alter table parents        enable row level security;
alter table journal        enable row level security;
alter table followups      enable row level security;
alter table message_counts enable row level security;

create policy "anon full access - parents"        on parents        for all to anon using (true) with check (true);
create policy "anon full access - journal"         on journal         for all to anon using (true) with check (true);
create policy "anon full access - followups"       on followups       for all to anon using (true) with check (true);
create policy "anon full access - message_counts"  on message_counts  for all to anon using (true) with check (true);

-- Per-day routine checklist: which sprint tasks you ticked off on a given date.
create table if not exists checklist (
  date      text not null,
  task_key  text not null,
  primary key (date, task_key)
);
alter table checklist enable row level security;
create policy "anon full access - checklist" on checklist for all to anon using (true) with check (true);

-- Potential leads: people/sources you haven't contacted yet (a backlog).
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default '',
  source      text not null default '',
  note        text not null default '',
  created_at  timestamptz not null default now()
);
alter table leads enable row level security;
create policy "anon full access - leads" on leads for all to anon using (true) with check (true);

-- Reusable message templates (your editable outreach scripts).
create table if not exists templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  body        text not null default '',
  kind        text not null default '',
  created_at  timestamptz not null default now()
);
alter table templates enable row level security;
create policy "anon full access - templates" on templates for all to anon using (true) with check (true);
