import { useState } from 'react'
import type { DB } from '../types'
import { SPRINT } from '../types'
import { api } from '../api'
import { resolveDay, sprintStats, type ResolvedTask } from '../stats'
import { formatDate, parseKey, todayKey } from '../dateUtils'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

type Mark = 'rest' | 'complete' | 'partial' | 'none' | 'future'

function dayMark(db: DB, key: string, todayK: string): Mark {
  if (key > todayK) return 'future'
  const r = resolveDay(db, key)
  if (r.kind === 'saturday') return 'rest'
  if (r.complete) return 'complete'
  if (r.done > 0) return 'partial'
  return 'none'
}

function Funnel({ label, value, goal }: { label: string; value: number; goal: number | null }) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0
  return (
    <div className="fn">
      <div className="fn-top">
        <span className="fn-val">{value}</span>
        {goal != null && <span className="fn-goal">/{goal}</span>}
      </div>
      <div className="fn-label">{label}</div>
      {goal != null && <div className="fn-bar"><div className="fn-fill" style={{ width: pct + '%' }} /></div>}
    </div>
  )
}

function firstOfMonth(key: string): Date {
  const d = parseKey(key)
  d.setDate(1)
  return d
}

export default function PlanTab({ db, setDb }: { db: DB; setDb: (db: DB) => void }) {
  const today = todayKey()
  const [selected, setSelected] = useState(today)
  const [month, setMonth] = useState(() => firstOfMonth(today))

  const s = sprintStats(db)
  const day = resolveDay(db, selected)

  const toggle = async (t: ResolvedTask) => {
    if (t.auto) return // number-tied tasks complete themselves
    setDb(await api.toggleTask(selected, t.key, !t.done))
  }

  const changeMonth = (delta: number) => {
    const m = new Date(month)
    m.setMonth(m.getMonth() + delta)
    m.setDate(1)
    setMonth(m)
  }
  const jumpToday = () => {
    setSelected(today)
    setMonth(firstOfMonth(today))
  }

  const startPad = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(todayKey(new Date(month.getFullYear(), month.getMonth(), d)))

  return (
    <div className="plan">
      <section className="panel scoreboard">
        <div className="sb-goal">
          <div className="sb-goal-num">{s.trialsCompleted}<span className="sb-goal-den">/{SPRINT.trialsGoal}</span></div>
          <div className="sb-goal-label">completed 14-day trials by Aug 22</div>
          <div className="sb-left">{s.weekdaysLeft} weekdays left</div>
        </div>
        <div className="sb-funnel">
          <Funnel label="Conversations" value={s.conversations} goal={SPRINT.conversationsGoal} />
          <Funnel label="Trials started" value={s.trialsStarted} goal={SPRINT.trialsStartedGoal} />
          <Funnel label="Active now" value={s.trialsActive} goal={null} />
          <Funnel label="Completed" value={s.trialsCompleted} goal={SPRINT.trialsGoal} />
        </div>
      </section>

      <div className="plan-grid">
        <section className="panel calendar">
          <div className="cal-head">
            <button className="round" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <h2>{MONTHS[month.getMonth()]} {month.getFullYear()}</h2>
            <button className="round" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          </div>
          <div className="cal-grid">
            {DOW.map((d, i) => <div key={'h' + i} className="cal-dow">{d}</div>)}
            {cells.map((key, i) =>
              key === null ? (
                <div key={'p' + i} className="cal-cell is-empty" />
              ) : (
                <button
                  key={key}
                  className={['cal-cell', 'mark-' + dayMark(db, key, today), key === selected ? 'is-selected' : '', key === today ? 'is-today' : ''].join(' ')}
                  onClick={() => setSelected(key)}
                >
                  <span className="cal-num">{parseKey(key).getDate()}</span>
                  <span className="cal-dot" />
                </button>
              ),
            )}
          </div>
          {selected !== today && <button className="btn cal-today" onClick={jumpToday}>Jump to today</button>}
        </section>

        <section className="panel day">
          <div className="day-head">
            <div>
              <h2>{formatDate(selected, true)}</h2>
              <div className="day-sub">{day.title}</div>
            </div>
            {day.kind !== 'saturday' && (
              <div className={'day-progress' + (day.complete ? ' is-done' : '')}>
                {day.complete ? '✓ Day complete' : `${day.done} / ${day.total}`}
              </div>
            )}
          </div>

          {day.kind === 'saturday' ? (
            <div className="rest">Saturday is off. Rest is part of the plan — it kills bad days, not the plan.</div>
          ) : (
            day.sections.map((sec) => (
              <div key={sec.name} className="day-section">
                <div className="day-section-head">
                  <span className="day-section-name">{sec.name}</span>
                  {sec.note && <span className="day-section-note">{sec.note}</span>}
                </div>
                <ul className="checklist">
                  {sec.tasks.map((t) => (
                    <li
                      key={t.key}
                      className={'check-item' + (t.done ? ' is-done' : '') + (t.auto ? ' is-auto' : '')}
                      onClick={() => toggle(t)}
                    >
                      <span className="check-box">{t.done ? '✓' : ''}</span>
                      <div className="check-body">
                        <div className="check-label">
                          <span>{t.label}</span>
                          {t.progress && <span className={'check-prog' + (t.done ? ' hit' : '')}>{t.progress}</span>}
                          {t.auto && <span className="check-auto">auto-tracked</span>}
                        </div>
                        {t.detail && <div className="check-detail">{t.detail}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
