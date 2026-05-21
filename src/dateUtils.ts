// Local-date key in YYYY-MM-DD (matches the server's util.js).
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Convert an ISO timestamp to its local date key.
export function isoToKey(iso: string): string {
  return todayKey(new Date(iso))
}

// Parse a YYYY-MM-DD key into a local-midnight Date.
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function isWeekend(d: Date): boolean {
  const g = d.getDay()
  return g === 0 || g === 6
}

// Whole calendar days between two date keys (toKey - fromKey).
export function daysBetween(fromKey: string, toKey: string = todayKey()): number {
  const ms = parseKey(toKey).getTime() - parseKey(fromKey).getTime()
  return Math.round(ms / 86_400_000)
}

// Monday of the week containing `now`, as a date key.
export function weekStartKey(now: Date = new Date()): string {
  const dow = now.getDay() // 0 Sun .. 6 Sat
  const diff = dow === 0 ? -6 : -(dow - 1)
  return todayKey(addDays(now, diff))
}

export function formatDate(key: string, withWeekday = false): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (withWeekday) opts.weekday = 'short'
  return parseKey(key).toLocaleDateString(undefined, opts)
}
