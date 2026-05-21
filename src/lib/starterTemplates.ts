// Starter outreach scripts, seeded into the Templates tab (and Load sample).
// All editable in-app. [name], [time], [link], [group] are fill-ins.
export interface TemplateSeed {
  title: string
  body: string
  kind: string
}

export const STARTER_TEMPLATES: TemplateSeed[] = [
  {
    kind: 'hot reply',
    title: 'Hot reply — someone posting about screen time',
    body:
      "Oh I feel this — the “five more minutes” that turns into an hour is brutal. I’m actually researching how parents handle screen-time fights with tweens (not selling anything). Would you be up for a quick 15–20 min chat about what your evenings look like? Happy to share what I’m hearing from other parents too.",
  },
  {
    kind: 'cold',
    title: 'Cold DM — short',
    body:
      "Hi [name] — I’m researching how families handle screen time with kids (not selling anything, just learning). Saw you’re active in [group]. Could I ask you a few questions about your weeknights this week? 15–20 min, super casual.",
  },
  {
    kind: 'cold',
    title: 'Cold DM — longer',
    body:
      "Hi [name], I’m spending a few weeks talking to parents about the daily screen-time battle — the negotiations, the meltdowns, the guilt. I’m not selling anything; I’m trying to really understand it first. You seem thoughtful about this in [group]. Would you be open to a 20-minute call this week? I’d love to hear what a typical weeknight looks like in your house, and I’m happy to trade notes on what’s working for other families.",
  },
  {
    kind: 'follow-up',
    title: 'Follow-up — bump 1 (day 4)',
    body:
      "Hey [name], floating this back up in case it got buried — totally fine if now isn’t a good time. Still researching the screen-time stuff and would value 15 min whenever works for you.",
  },
  {
    kind: 'follow-up',
    title: 'Follow-up — bump 2 (day 10, final)',
    body:
      "Hi [name] — last nudge from me, promise. If a quick chat about screen-time routines sounds useful I’d still love it. Either way, thanks, and good luck with the evening witching hour :)",
  },
  {
    kind: 'scheduling',
    title: 'Interview confirm (cuts no-shows in half)',
    body: "Looking forward to our chat at [time] today! Here’s the link: [link]. No prep needed — just bring your honest weeknight stories.",
  },
  {
    kind: 'the ask',
    title: 'Trial ask — end of the interview',
    body:
      "Honestly, this is the exact moment I’m building something for. Would you want to try it free for two weeks and tell me what’s broken? No strings — your feedback is the whole point. Could we do a quick 20-min setup tomorrow?",
  },
  {
    kind: 'check-in',
    title: 'Trial — Day 3 check-in',
    body: "Hey [name]! Day 3 — has there been a moment where you almost overrode it? Curious what that felt like. Anything confusing so far?",
  },
  {
    kind: 'check-in',
    title: 'Trial — Day 7 check-in',
    body: "Halfway! Quick one: what’s working, and what’s annoying or just not clicking? Be brutal — that’s the helpful part.",
  },
  {
    kind: 'check-in',
    title: 'Trial — Day 14 wrap-up',
    body: "We made it to two weeks! Could we grab 20 min to talk through how it went? I want the honest verdict — keep it, change it, or toss it.",
  },
]
