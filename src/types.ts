export type Status =
  | 'cold_sent'
  | 'replied'
  | 'scheduled'
  | 'interviewed'
  | 'trial_started'
  | 'trial_active'
  | 'trial_completed'
  | 'churned'

export interface StatusEvent {
  status: Status
  at: string // ISO timestamp
}

export interface Parent {
  id: string
  name: string
  source: string
  first_contact_date: string // YYYY-MM-DD
  status: Status
  trial_start_date: string | null
  notes: string
  key_quote: string
  failure_moment_tag: string
  created_at: string
  updated_at: string
  status_history: StatusEvent[]
}

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  learned: string
  quote: string
  changes: string
  created_at: string
}

export type FollowupType =
  | 'bump1'
  | 'bump2'
  | 'trial_day3'
  | 'trial_day7'
  | 'trial_day14'

export interface Followup {
  id: string
  parentId: string
  type: FollowupType
  date: string // YYYY-MM-DD the follow-up was done
}

// A ticked routine task: this task_key was completed on this date.
export interface ChecklistMark {
  date: string // YYYY-MM-DD
  taskKey: string
}

// A potential lead you haven't contacted yet (backlog before the pipeline).
export interface Lead {
  id: string
  name: string
  source: string
  note: string
  created_at: string
}

// A reusable outreach message you can edit and copy.
export interface Template {
  id: string
  title: string
  body: string
  kind: string
  created_at: string
}

export interface DB {
  parents: Parent[]
  journal: JournalEntry[]
  messageCounts: Record<string, number>
  followups: Followup[]
  checklist: ChecklistMark[]
  leads: Lead[]
  templates: Template[]
}

// --- Status metadata ---

// Order parents advance through on a single click.
export const HAPPY_PATH: Status[] = [
  'cold_sent',
  'replied',
  'scheduled',
  'interviewed',
  'trial_started',
  'trial_active',
  'trial_completed',
]

export const ALL_STATUSES: Status[] = [...HAPPY_PATH, 'churned']

export const STATUS_LABEL: Record<Status, string> = {
  cold_sent: 'Cold sent',
  replied: 'Replied',
  scheduled: 'Scheduled',
  interviewed: 'Interviewed',
  trial_started: 'Trial started',
  trial_active: 'Trial active',
  trial_completed: 'Trial complete',
  churned: 'Churned',
}

export function nextStatus(s: Status): Status | null {
  const i = HAPPY_PATH.indexOf(s)
  if (i === -1 || i === HAPPY_PATH.length - 1) return null
  return HAPPY_PATH[i + 1]
}

// --- Daily / sprint targets ---
export const TARGETS = {
  messagesPerDay: 10,
  conversationsPerDayMin: 2,
  conversationsPerDayMax: 3,
  conversationsPerWeek: 12,
  trialsGoal: 30,
}

// The locked-in sprint math (working backwards from 30 completed trials).
export const SPRINT = {
  goalDate: '2026-08-22', // 30 completed 14-day trials by here
  preInternDate: '2026-07-07', // solo phase ends; interns join
  trialsGoal: 30,
  trialsStartedGoal: 60, // ~50% of started trials complete
  conversationsGoal: 240, // ~25% of conversations convert to a trial
  messagesPerDay: 10,
  conversationsPerDay: 3,
}
