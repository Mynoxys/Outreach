import { parseKey } from '../dateUtils'

// The sprint's daily routine, encoded. `auto` tasks are completed automatically
// from data the app already tracks (messages counter / conversations), so they
// can't be double-counted. Everything else is a manual check.
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
    name: 'Morning',
    note: '90 min · ~9:00–10:30',
    tasks: [
      {
        key: 'msg10',
        auto: 'messages',
        label: 'Send 10 messages',
        detail:
          '3 hot replies (today’s screen-time posts — search “screen time”, “phone limit”, “five more minutes”, sort by newest) · 4 cold posts/DMs · 3 follow-ups (bump day 4, then day 10, then drop)',
      },
      {
        key: 'confirm_interviews',
        label: 'Confirm today’s interviews',
        detail: '“Looking forward to our 2pm chat” — cuts no-shows in half',
      },
    ],
  }
  const midday: PlaybookSection = {
    name: 'Midday',
    note: '2–3 hrs · your scheduled calls',
    tasks: [
      {
        key: 'run_conversations',
        auto: 'conversations',
        label: 'Run your parent conversations',
        detail:
          '30 min each — 2 min frame (“researching, not selling”) · 15 min listen (“walk me through a typical weeknight”) · 8 min reflect · 5 min ask for the 2-week trial',
      },
      {
        key: 'call_notes',
        label: 'Write 10 min of notes after each call',
        detail: 'Verbatim quotes that surprised you · the failure moment they described · one phrase to steal for marketing',
      },
    ],
  }
  const evening: PlaybookSection = {
    name: 'Evening',
    note: '45 min · ~7:00–7:45',
    tasks: [
      { key: 'onboard', label: 'Onboard anyone who said yes today', detail: '20-min setup call' },
      {
        key: 'trial_checkins',
        label: 'Check in with active trial families',
        detail:
          'Day 3: “any moment you almost overrode?” · Day 7: “what’s working, what isn’t?” · Day 14: schedule the wrap-up (see the follow-up queue on Pipeline)',
      },
      {
        key: 'update_tracker',
        label: 'Update the tracker + End Day',
        detail: 'Conversations had, trials started/active, what you learned today',
      },
    ],
  }

  const weekly: PlaybookSection = { name: 'Weekly anchor', tasks: [] }
  if (dow === 1)
    weekly.tasks.push({
      key: 'weekly_mining',
      label: 'Monday — channel mining (1 hr)',
      detail: 'Join 5 new Facebook groups · find 3 newsletter writers/podcasters (park for Week 3) · find 2 new subreddits worth posting in',
    })
  if (dow === 3)
    weekly.tasks.push({
      key: 'weekly_patterns',
      label: 'Wednesday — pattern review (1 hr, with Ashraf if possible)',
      detail: 'Re-read the last 5 days of notes · recurring phrases to steal · which messages got replies vs ignored · which families churned, and why',
    })
  if (dow === 5)
    weekly.tasks.push({
      key: 'weekly_triage',
      label: 'Friday — triage + numbers (1 hr)',
      detail: 'Week totals: conversations, trials started, trials active · are you on pace? · write 3 sentences on what changed in your understanding this week',
    })

  const sections = [morning, midday, evening]
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
