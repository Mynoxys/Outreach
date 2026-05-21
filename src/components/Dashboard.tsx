import type { DB } from '../types'
import { TARGETS } from '../types'
import { api } from '../api'
import { dashboardStats } from '../stats'

function streakHint(n: number): string {
  if (n <= 0) return 'Show up today to start the streak.'
  if (n < 3) return 'Keep it going.'
  if (n < 7) return 'Don’t break the chain.'
  return 'On fire — protect it.'
}

export default function Dashboard({ db, setDb }: { db: DB; setDb: (db: DB) => void }) {
  const s = dashboardStats(db)
  const addMsg = async (delta: number) => setDb(await api.addMessage(delta))
  const trialPct = Math.min(100, Math.round((s.trialsCompleted / TARGETS.trialsGoal) * 100))
  const convTarget = `${TARGETS.conversationsPerDayMin}–${TARGETS.conversationsPerDayMax}`

  return (
    <section className="dashboard">
      <div className="card streak">
        <div className="streak-flame">🔥</div>
        <div className="streak-num">{s.streak}</div>
        <div className="streak-label">day streak</div>
        <div className="streak-hint">{streakHint(s.streak)}</div>
      </div>

      <div className="card metric">
        <div className="metric-label">Messages today</div>
        <div className="metric-value">
          <span className={s.messagesToday >= TARGETS.messagesPerDay ? 'hit' : ''}>{s.messagesToday}</span>
          <span className="metric-target">/ {TARGETS.messagesPerDay}</span>
        </div>
        <div className="metric-controls">
          <button className="round" onClick={() => addMsg(-1)} disabled={s.messagesToday <= 0} aria-label="Remove a message">−</button>
          <button className="round round-add" onClick={() => addMsg(1)} aria-label="Add a message">+</button>
        </div>
      </div>

      <div className="card metric">
        <div className="metric-label">Conversations today</div>
        <div className="metric-value">
          <span className={s.conversationsToday >= TARGETS.conversationsPerDayMin ? 'hit' : ''}>{s.conversationsToday}</span>
          <span className="metric-target">/ {convTarget}</span>
        </div>
        <div className="metric-sub">Move a parent to “Interviewed” to count one.</div>
      </div>

      <div className="card metric">
        <div className="metric-label">Conversations this week</div>
        <div className="metric-value">
          <span className={s.conversationsThisWeek >= TARGETS.conversationsPerWeek ? 'hit' : ''}>{s.conversationsThisWeek}</span>
          <span className="metric-target">/ {TARGETS.conversationsPerWeek}</span>
        </div>
        <div className="metric-sub">Mon–Sun</div>
      </div>

      <div className="card metric trials">
        <div className="metric-label">Trials completed</div>
        <div className="metric-value">
          <span className="hit-strong">{s.trialsCompleted}</span>
          <span className="metric-target">/ {TARGETS.trialsGoal}</span>
        </div>
        <div className="progress"><div className="progress-fill" style={{ width: trialPct + '%' }} /></div>
      </div>
    </section>
  )
}
