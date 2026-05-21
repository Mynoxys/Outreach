import { parseKey } from '../dateUtils'

// The sprint's daily routine, encoded as the *real* flow (not just task
// categories). `auto` tasks complete from data the app already tracks (the
// messages counter / conversations), so they can't be double-counted.
export type AutoMetric = 'messages' | 'conversations'

export interface PlaybookTask {
  key: string
  label: string
  detail?: string
  auto?: AutoMetric
}
export interface PlaybookSection {
  name: string
  note?: string
  tasks: PlaybookTask[]
}
export interface DayPlaybook {
  kind: 'weekday' | 'saturday' | 'sunday'
  title: string
  sections: PlaybookSection[]
}

function weekdaySections(dow: number): PlaybookSection[] {
  const morning: PlaybookSection = {
    name: 'Morning block',
    note: '90 min · 12:00–1:30 AM',
    tasks: [
      {
        key: 'open_tracker',
        label: 'Open the tracker (5 min)',
        detail:
          'Check three numbers: conversations scheduled this week, active trials, messages awaiting reply. Note which active families need a check-in today (day 3 / 7 / 14).',
      },
      {
        key: 'find_leads',
        label: 'Find today’s leads (30 min)',
        detail:
          'Reddit (r/Parenting, r/Mommit, r/daddit, r/raisingkids, r/parentingteenagers) sorted by New — search “screen time”, “phone limit”, “five more minutes”, “fighting about phone”. Pull 3 hot leads from the last 24h. Same in your FB groups (1–2 more). Scan your warm list for anyone unmessaged (weeks 1–2 priority). Drop them in the Leads tab.',
      },
      {
        key: 'msg10',
        auto: 'messages',
        label: 'Send 10 messages (40 min)',
        detail:
          '3 hot replies to today’s posts (highest conversion — they’re in pain right now) · 4 cold/warm posts or DMs (weeks 1–2 lean warm, weeks 3–6 lean cold) · 3 follow-ups (bump day 4, day 10, then drop)',
      },
      {
        key: 'confirm_interviews',
        label: 'Confirm today’s interviews (15 min)',
        detail: '“Looking forward to our chat at [time]” — cuts no-shows in half. Re-read their initial message before the call for context.',
      },
    ],
  }
  const midday: PlaybookSection = {
    name: 'Midday block',
    note: '3 hrs · 12:00–3:00 PM',
    tasks: [
      {
        key: 'prep_calls',
        label: 'Prep before each call (5 min)',
        detail: 'Re-read their initial reply. Have the script visible, but don’t read from it.',
      },
      {
        key: 'run_conversations',
        auto: 'conversations',
        label: 'Run the call (30 min)',
        detail:
          '2 min frame (“researching, not selling”) · 15 min listen (“walk me through a typical weeknight” → failure moment → what they felt → what they tried) · 8 min reflect (“here’s what I’m hearing — does that match?”) · 5 min ask (“want to try it for 2 weeks and tell me what’s broken?”)',
      },
      {
        key: 'call_notes',
        label: 'Notes right after each call (10 min)',
        detail: 'Verbatim surprising quotes · the failure moment they described · one phrase to steal for marketing · update their pipeline stage.',
      },
    ],
  }
  const afternoon: PlaybookSection = {
    name: 'Afternoon admin',
    note: '30 min · 3:00–3:30 PM',
    tasks: [
      {
        key: 'afternoon_admin',
        label: 'Afternoon admin (30 min)',
        detail: 'Schedule any “yes” from today into tomorrow’s onboarding slot · reply to anyone who replied to your morning messages · move pipeline stages.',
      },
    ],
  }
  const evening: PlaybookSection = {
    name: 'Evening block',
    note: '45 min · 7:00–7:45 PM',
    tasks: [
      { key: 'onboard', label: 'Onboard new families', detail: 'Any 20-min setup calls scheduled for tonight.' },
      {
        key: 'trial_checkins',
        label: 'Active trial check-ins',
        detail: 'Day 3 and Day 7 messages to anyone hitting that mark · Day 14: schedule the wrap-up interview. (See the follow-up queue on Pipeline.)',
      },
      {
        key: 'eod_review',
        label: 'End-of-day review (10 min)',
        detail: 'Update tracker totals · one sentence: what surprised me today · one sentence: what I’ll do differently tomorrow. (Use End Day.)',
      },
    ],
  }

  const weekly: PlaybookSection = { name: 'Weekly anchor', tasks: [] }
  if (dow === 1)
    weekly.tasks.push({
      key: 'weekly_mining',
      label: 'Monday — channel mining (1 hr)',
      detail: 'Join 5 new Facebook groups · find 3 newsletter writers/podcasters (park for Week 3) · find 2 new subreddits worth posting in.',
    })
  if (dow === 3)
    weekly.tasks.push({
      key: 'weekly_patterns',
      label: 'Wednesday — pattern review (1 hr, with Ashraf if possible)',
      detail: 'Re-read the last 5 days of notes · recurring phrases to steal · which messages got replies vs ignored · which families churned, and why.',
    })
  if (dow === 5)
    weekly.tasks.push({
      key: 'weekly_triage',
      label: 'Friday — triage + numbers (1 hr)',
      detail: 'Week totals: conversations, trials started, trials active · are you on pace? · 3 sentences on what changed in your understanding this week.',
    })

  const sections = [morning, midday, afternoon, evening]
  if (weekly.tasks.length) sections.push(weekly)
  return sections
}

export function playbookForDate(dateKey: string): DayPlaybook {
  const dow = parseKey(dateKey).getDay() // 0 Sun .. 6 Sat
  if (dow === 6) return { kind: 'saturday', title: 'Saturday — off', sections: [] }
  if (dow === 0)
    return {
      kind: 'sunday',
      title: 'Sunday — light',
      sections: [
        {
          name: 'Light',
          note: 'Keep it light',
          tasks: [{ key: 'sunday_plan', label: 'Plan Monday', detail: 'Look at the calendar. That’s it.' }],
        },
      ],
    }
  return { kind: 'weekday', title: 'Daily routine', sections: weekdaySections(dow) }
}
