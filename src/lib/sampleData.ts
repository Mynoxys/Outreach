import type { DB, Parent } from '../types'
import { todayKey } from '../dateUtils'

// Realistic demo data so "Load sample" shows every feature populated.
// Dates are relative to now, so the streak and follow-up queue are always fresh.
export function buildSampleData(): DB {
  const today = new Date()
  const dayKey = (off: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + off)
    return todayKey(d)
  }
  const at = (off: number, h = 12, min = 0) => {
    const d = new Date(today)
    d.setDate(d.getDate() + off)
    d.setHours(h, min, 0, 0)
    return d.toISOString()
  }

  const parents: Parent[] = [
    {
      id: crypto.randomUUID(),
      name: 'Maya Thompson',
      source: 'FB group: Gentle Parenting',
      first_contact_date: dayKey(-1),
      status: 'replied',
      trial_start_date: null,
      notes: 'Mom of 4yo + 18mo. Replied within an hour, very warm. Free evenings after 8pm.',
      key_quote: "I'm just so tired of the bedtime battles every single night.",
      failure_moment_tag: 'bedtime',
      created_at: at(-1, 9),
      updated_at: at(-1, 10),
      status_history: [
        { status: 'cold_sent', at: at(-1, 9) },
        { status: 'replied', at: at(-1, 10) },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Jordan Lee',
      source: 'Reddit r/Parenting',
      first_contact_date: dayKey(-8),
      status: 'cold_sent',
      trial_start_date: null,
      notes: 'Dad, 6yo. No reply yet.',
      key_quote: '',
      failure_moment_tag: '',
      created_at: at(-8, 11),
      updated_at: at(-8, 11),
      status_history: [{ status: 'cold_sent', at: at(-8, 11) }],
    },
    {
      id: crypto.randomUUID(),
      name: 'Priya Patel',
      source: 'referral',
      first_contact_date: dayKey(-14),
      status: 'cold_sent',
      trial_start_date: null,
      notes: 'Referred by Maya. Already sent bump-1, still nothing.',
      key_quote: '',
      failure_moment_tag: '',
      created_at: at(-14, 13),
      updated_at: at(-9, 13),
      status_history: [{ status: 'cold_sent', at: at(-14, 13) }],
    },
    {
      id: crypto.randomUUID(),
      name: 'Sam Rivera',
      source: 'FB group: Gentle Parenting',
      first_contact_date: dayKey(-20),
      status: 'trial_active',
      trial_start_date: dayKey(-7),
      notes: 'In trial. Day-3 check-in went great. Kids took to the morning routine cards.',
      key_quote: 'The morning meltdowns basically disappeared in three days.',
      failure_moment_tag: 'morning routine',
      created_at: at(-20, 10),
      updated_at: at(-6, 10),
      status_history: [
        { status: 'cold_sent', at: at(-20, 10) },
        { status: 'replied', at: at(-18, 14) },
        { status: 'scheduled', at: at(-16, 9) },
        { status: 'interviewed', at: at(-14, 15) },
        { status: 'trial_started', at: at(-7, 10) },
        { status: 'trial_active', at: at(-6, 10) },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Alex Chen',
      source: 'Reddit r/Parenting',
      first_contact_date: dayKey(-30),
      status: 'trial_completed',
      trial_start_date: dayKey(-19),
      notes: 'Completed the full 14-day trial. Wants to convert to paid. Huge win.',
      key_quote: 'This actually gave us dinner back as a family.',
      failure_moment_tag: 'mealtime',
      created_at: at(-30, 10),
      updated_at: at(-3, 10),
      status_history: [
        { status: 'cold_sent', at: at(-30, 10) },
        { status: 'replied', at: at(-28, 12) },
        { status: 'scheduled', at: at(-26, 9) },
        { status: 'interviewed', at: at(-24, 16) },
        { status: 'trial_started', at: at(-19, 10) },
        { status: 'trial_active', at: at(-17, 10) },
        { status: 'trial_completed', at: at(-3, 10) },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Dana Kim',
      source: 'referral',
      first_contact_date: dayKey(-5),
      status: 'interviewed',
      trial_start_date: null,
      notes: 'Just finished the call. Strong fit. Bedtime is her #1 pain. Proposing trial start Monday.',
      key_quote: "Bedtime is a two-hour negotiation every night and I'm losing.",
      failure_moment_tag: 'bedtime',
      created_at: at(-5, 9),
      updated_at: at(0, 15),
      status_history: [
        { status: 'cold_sent', at: at(-5, 9) },
        { status: 'replied', at: at(-4, 11) },
        { status: 'scheduled', at: at(-2, 9) },
        { status: 'interviewed', at: at(0, 15) },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: 'Chris Park',
      source: 'Reddit r/Parenting',
      first_contact_date: dayKey(-25),
      status: 'churned',
      trial_start_date: null,
      notes: 'Ghosted after scheduling. Marked churned.',
      key_quote: '',
      failure_moment_tag: '',
      created_at: at(-25, 10),
      updated_at: at(-15, 10),
      status_history: [
        { status: 'cold_sent', at: at(-25, 10) },
        { status: 'replied', at: at(-23, 12) },
        { status: 'scheduled', at: at(-21, 9) },
        { status: 'churned', at: at(-15, 10) },
      ],
    },
  ]

  const priya = parents.find((p) => p.name === 'Priya Patel')!
  const sam = parents.find((p) => p.name === 'Sam Rivera')!

  const followups = [
    { id: crypto.randomUUID(), parentId: priya.id, type: 'bump1' as const, date: dayKey(-9) },
    { id: crypto.randomUUID(), parentId: sam.id, type: 'trial_day3' as const, date: dayKey(-4) },
  ]

  const messageCounts: Record<string, number> = {}
  ;[6, 10, 11, 9, 8, 10, 12, 7, 9].forEach((c, i) => {
    messageCounts[dayKey(-i)] = c
  })

  const journal = [
    {
      id: crypto.randomUUID(),
      date: dayKey(-1),
      learned: 'Parents respond far more to "bedtime battles" than to "routine support". The pain word matters.',
      quote: "I'm just so tired of the bedtime battles.",
      changes: 'Lead the opener with the specific failure moment, not the product.',
      created_at: at(-1, 20),
    },
    {
      id: crypto.randomUUID(),
      date: dayKey(-2),
      learned: 'Referrals reply ~3x faster than cold Reddit DMs.',
      quote: 'This actually gave us dinner back.',
      changes: 'Ask every happy parent for one referral at the day-7 check-in.',
      created_at: at(-2, 20),
    },
  ]

  return { parents, journal, messageCounts, followups }
}
