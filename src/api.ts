import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DB, FollowupType, JournalEntry, Parent, Status } from './types'
import { todayKey } from './dateUtils'
import { buildSampleData } from './lib/sampleData'

// Supabase replaces the old Express + data.json backend so the app can deploy
// as a static site (GitHub Pages / Vercel) and work from a phone. The URL +
// anon key are injected at build time; the anon key is public by design.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const sb: SupabaseClient | null = supabaseConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  : null

function client(): SupabaseClient {
  if (!sb) {
    throw new Error(
      'Supabase isn’t configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild.',
    )
  }
  return sb
}

const nowISO = () => new Date().toISOString()

type FollowupRow = { id: string; parent_id: string; type: FollowupType; date: string }
type CountRow = { date: string; count: number }

// Read all four tables and assemble the single DB object the UI works with.
async function getState(): Promise<DB> {
  const c = client()
  const [parents, journal, followups, counts] = await Promise.all([
    c.from('parents').select('*'),
    c.from('journal').select('*'),
    c.from('followups').select('*'),
    c.from('message_counts').select('*'),
  ])
  const error = parents.error || journal.error || followups.error || counts.error
  if (error) throw new Error(error.message)

  const messageCounts: Record<string, number> = {}
  for (const r of (counts.data as CountRow[] | null) ?? []) messageCounts[r.date] = r.count

  return {
    parents: (parents.data ?? []) as Parent[],
    journal: (journal.data ?? []) as JournalEntry[],
    followups: ((followups.data as FollowupRow[] | null) ?? []).map((f) => ({
      id: f.id,
      parentId: f.parent_id,
      type: f.type,
      date: f.date,
    })),
    messageCounts,
  }
}

// Every mutation performs the write, then re-reads the full DB so callers can
// keep doing `setDb(await api.foo(...))` exactly as before.
export const api = {
  getState,

  createParent: async (p: Partial<Parent>): Promise<DB> => {
    const status = (p.status as Status) || 'cold_sent'
    const trialStart =
      status === 'trial_started' ? p.trial_start_date || todayKey() : p.trial_start_date ?? null
    const row = {
      id: crypto.randomUUID(),
      name: p.name ?? '',
      source: p.source ?? '',
      first_contact_date: p.first_contact_date || todayKey(),
      status,
      trial_start_date: trialStart,
      notes: p.notes ?? '',
      key_quote: p.key_quote ?? '',
      failure_moment_tag: p.failure_moment_tag ?? '',
      created_at: nowISO(),
      updated_at: nowISO(),
      status_history: [{ status, at: nowISO() }],
    }
    const { error } = await client().from('parents').insert(row)
    if (error) throw new Error(error.message)
    return getState()
  },

  updateParent: async (id: string, patch: Partial<Parent>): Promise<DB> => {
    const c = client()
    const { data: cur, error: e1 } = await c.from('parents').select('*').eq('id', id).single()
    if (e1) throw new Error(e1.message)

    const editable: (keyof Parent)[] = [
      'name', 'source', 'first_contact_date', 'trial_start_date', 'notes', 'key_quote', 'failure_moment_tag',
    ]
    const update: Record<string, unknown> = {}
    for (const f of editable) if (f in patch) update[f] = (patch as Record<string, unknown>)[f]

    if ('status' in patch && patch.status && patch.status !== cur.status) {
      update.status = patch.status
      update.status_history = [...(cur.status_history ?? []), { status: patch.status, at: nowISO() }]
      const resultingTrialStart =
        'trial_start_date' in update ? update.trial_start_date : cur.trial_start_date
      if (patch.status === 'trial_started' && !resultingTrialStart) update.trial_start_date = todayKey()
    }
    update.updated_at = nowISO()

    const { error } = await c.from('parents').update(update).eq('id', id)
    if (error) throw new Error(error.message)
    return getState()
  },

  setStatus: async (id: string, status: Status): Promise<DB> => {
    const c = client()
    const { data: cur, error: e1 } = await c
      .from('parents')
      .select('status, status_history, trial_start_date')
      .eq('id', id)
      .single()
    if (e1) throw new Error(e1.message)
    if (cur.status === status) return getState() // no-op: don't spam the timeline

    const update: Record<string, unknown> = {
      status,
      status_history: [...(cur.status_history ?? []), { status, at: nowISO() }],
      updated_at: nowISO(),
    }
    if (status === 'trial_started' && !cur.trial_start_date) update.trial_start_date = todayKey()

    const { error } = await c.from('parents').update(update).eq('id', id)
    if (error) throw new Error(error.message)
    return getState()
  },

  deleteParent: async (id: string): Promise<DB> => {
    const c = client()
    const f = await c.from('followups').delete().eq('parent_id', id)
    if (f.error) throw new Error(f.error.message)
    const p = await c.from('parents').delete().eq('id', id)
    if (p.error) throw new Error(p.error.message)
    return getState()
  },

  addMessage: async (delta: number): Promise<DB> => {
    const c = client()
    const day = todayKey()
    const { data: cur, error: e1 } = await c
      .from('message_counts')
      .select('count')
      .eq('date', day)
      .maybeSingle()
    if (e1) throw new Error(e1.message)
    const next = Math.max(0, (cur?.count ?? 0) + delta)
    if (next === 0) {
      const { error } = await c.from('message_counts').delete().eq('date', day)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await c.from('message_counts').upsert({ date: day, count: next })
      if (error) throw new Error(error.message)
    }
    return getState()
  },

  addFollowup: async (parentId: string, type: FollowupType): Promise<DB> => {
    const { error } = await client()
      .from('followups')
      .insert({ id: crypto.randomUUID(), parent_id: parentId, type, date: todayKey() })
    if (error) throw new Error(error.message)
    return getState()
  },

  addJournal: async (entry: { learned: string; quote: string; changes: string }): Promise<DB> => {
    const { error } = await client().from('journal').insert({
      id: crypto.randomUUID(),
      date: todayKey(),
      learned: entry.learned ?? '',
      quote: entry.quote ?? '',
      changes: entry.changes ?? '',
      created_at: nowISO(),
    })
    if (error) throw new Error(error.message)
    return getState()
  },

  clearData: async (): Promise<DB> => {
    const c = client()
    // delete-all requires a filter; id/date is never null, so this matches every row.
    const r1 = await c.from('followups').delete().not('id', 'is', null)
    if (r1.error) throw new Error(r1.error.message)
    const r2 = await c.from('journal').delete().not('id', 'is', null)
    if (r2.error) throw new Error(r2.error.message)
    const r3 = await c.from('message_counts').delete().not('date', 'is', null)
    if (r3.error) throw new Error(r3.error.message)
    const r4 = await c.from('parents').delete().not('id', 'is', null)
    if (r4.error) throw new Error(r4.error.message)
    return getState()
  },

  loadSample: async (): Promise<DB> => {
    await api.clearData()
    const c = client()
    const sample = buildSampleData()
    if (sample.parents.length) {
      const { error } = await c.from('parents').insert(sample.parents)
      if (error) throw new Error(error.message)
    }
    if (sample.journal.length) {
      const { error } = await c.from('journal').insert(sample.journal)
      if (error) throw new Error(error.message)
    }
    if (sample.followups.length) {
      const { error } = await c
        .from('followups')
        .insert(sample.followups.map((f) => ({ id: f.id, parent_id: f.parentId, type: f.type, date: f.date })))
      if (error) throw new Error(error.message)
    }
    const countRows = Object.entries(sample.messageCounts).map(([date, count]) => ({ date, count }))
    if (countRows.length) {
      const { error } = await c.from('message_counts').insert(countRows)
      if (error) throw new Error(error.message)
    }
    return getState()
  },
}
