import type { DB, FollowupType, Parent } from './types'
import {
  addDays,
  daysBetween,
  isWeekend,
  isoToKey,
  todayKey,
  weekStartKey,
} from './dateUtils'

// --- Dashboard ---

export interface DashboardStats {
  messagesToday: number
  conversationsToday: number
  conversationsThisWeek: number
  trialsCompleted: number
  streak: number
}

export function dashboardStats(db: DB, now: Date = new Date()): DashboardStats {
  const today = todayKey(now)
  return {
    messagesToday: db.messageCounts[today] || 0,
    conversationsToday: conversationsBetween(db, today, today),
    conversationsThisWeek: conversationsBetween(db, weekStartKey(now), today),
    trialsCompleted: db.parents.filter((p) => p.status === 'trial_completed').length,
    streak: computeStreak(activeDateSet(db), now),
  }
}

// A "conversation" = a parent entering the interviewed status. Count distinct
// parents whose interview happened within [fromKey, toKey].
function conversationsBetween(db: DB, fromKey: string, toKey: string): number {
  let n = 0
  for (const p of db.parents) {
    const had = p.status_history.some((e) => {
      if (e.status !== 'interviewed') return false
      const k = isoToKey(e.at)
      return k >= fromKey && k <= toKey
    })
    if (had) n++
  }
  return n
}

// Days that count as "showing up" toward the streak: any real activity.
export function activeDateSet(db: DB): Set<string> {
  const s = new Set<string>()
  for (const [k, v] of Object.entries(db.messageCounts)) if (v > 0) s.add(k)
  for (const j of db.journal) s.add(j.date)
  for (const f of db.followups) s.add(f.date)
  for (const p of db.parents) for (const e of p.status_history) s.add(isoToKey(e.at))
  return s
}

// Consecutive active weekdays ending today. Weekends never break or count.
// Today is given grace: an inactive in-progress weekday doesn't reset the streak.
export function computeStreak(active: Set<string>, now: Date = new Date()): number {
  let streak = 0
  let cursor = new Date(now)
  cursor.setHours(12, 0, 0, 0)
  const todayIsWeekday = !isWeekend(now)
  const todayK = todayKey(now)

  for (let guard = 0; guard < 1000; guard++) {
    if (isWeekend(cursor)) {
      cursor = addDays(cursor, -1)
      continue
    }
    const key = todayKey(cursor)
    if (active.has(key)) {
      streak++
    } else if (key === todayK && todayIsWeekday) {
      // In-progress day not yet active — don't break the streak.
    } else {
      break
    }
    cursor = addDays(cursor, -1)
  }
  return streak
}

// --- Follow-up queue ---

export interface QueueItem {
  key: string
  parentId: string
  parentName: string
  type: FollowupType
  label: string
  detail: string
  urgency: number
}

const TRIAL_MILESTONES = [3, 7, 14] as const

export function followupQueue(db: DB, now: Date = new Date()): QueueItem[] {
  const today = todayKey(now)
  const done = new Set(db.followups.map((f) => `${f.parentId}:${f.type}`))
  const items: QueueItem[] = []

  for (const p of db.parents) {
    // Trial check-ins at day 3 / 7 / 14 — surface once reached, until marked done.
    if (p.trial_start_date && (p.status === 'trial_started' || p.status === 'trial_active')) {
      const d = daysBetween(p.trial_start_date, today)
      for (const m of TRIAL_MILESTONES) {
        const type = `trial_day${m}` as FollowupType
        if (d >= m && !done.has(`${p.id}:${type}`)) {
          const overdue = d - m
          items.push({
            key: `${p.id}:${type}`,
            parentId: p.id,
            parentName: p.name,
            type,
            label: `Day ${m} trial check-in`,
            detail:
              overdue === 0
                ? `Due today · trial day ${d}`
                : `${overdue} day${overdue > 1 ? 's' : ''} overdue · trial day ${d}`,
            urgency: 100 + overdue,
          })
        }
      }
    }

    // Cold contacts with no reply → bump-1 (4d), then bump-2 (10d, final).
    if (p.status === 'cold_sent') {
      const d = daysBetween(p.first_contact_date, today)
      const bump1Done = done.has(`${p.id}:bump1`)
      const bump2Done = done.has(`${p.id}:bump2`)
      if (!bump1Done && d >= 4) {
        items.push({
          key: `${p.id}:bump1`,
          parentId: p.id,
          parentName: p.name,
          type: 'bump1',
          label: 'Bump 1 — no reply',
          detail: `${d} days since first contact`,
          urgency: 50 + (d - 4),
        })
      } else if (bump1Done && !bump2Done && d >= 10) {
        items.push({
          key: `${p.id}:bump2`,
          parentId: p.id,
          parentName: p.name,
          type: 'bump2',
          label: 'Bump 2 — final nudge',
          detail: `${d} days since first contact`,
          urgency: 60 + (d - 10),
        })
      }
    }
  }

  items.sort((a, b) => b.urgency - a.urgency)
  return items
}

// --- Patterns ---

export function failureTagCounts(db: DB): { tag: string; count: number }[] {
  const m = new Map<string, number>()
  for (const p of db.parents) {
    const t = p.failure_moment_tag.trim()
    if (t) m.set(t, (m.get(t) || 0) + 1)
  }
  return [...m.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

export function quoteBank(db: DB): { quote: string; name: string; tag: string }[] {
  return db.parents
    .filter((p) => p.key_quote.trim())
    .map((p) => ({ quote: p.key_quote, name: p.name, tag: p.failure_moment_tag }))
}

export interface ChannelStat {
  source: string
  leads: number
  trials: number
  rate: number
}

export function channelPerformance(db: DB): ChannelStat[] {
  const m = new Map<string, { leads: number; trials: number }>()
  for (const p of db.parents) {
    const s = p.source.trim() || '(unknown)'
    const e = m.get(s) || { leads: 0, trials: 0 }
    e.leads++
    if (reachedTrial(p)) e.trials++
    m.set(s, e)
  }
  return [...m.entries()]
    .map(([source, { leads, trials }]) => ({
      source,
      leads,
      trials,
      rate: leads ? trials / leads : 0,
    }))
    .sort((a, b) => b.trials - a.trials || b.rate - a.rate)
}

function reachedTrial(p: Parent): boolean {
  return (
    !!p.trial_start_date ||
    p.status === 'trial_started' ||
    p.status === 'trial_active' ||
    p.status === 'trial_completed'
  )
}

// Trial day number for a parent currently (or recently) in trial.
export function trialDay(p: Parent, now: Date = new Date()): number | null {
  if (!p.trial_start_date) return null
  return daysBetween(p.trial_start_date, todayKey(now))
}
