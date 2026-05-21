import { useEffect, useRef, useState } from 'react'
import type { DB } from '../types'
import { api } from '../api'
import { followupQueue, type QueueItem } from '../stats'

function tagClass(type: string): string {
  if (type.startsWith('trial')) return 'is-trial'
  if (type === 'bump2') return 'is-bump2'
  return 'is-bump1'
}

export default function FollowUpQueue({ db, setDb }: { db: DB; setDb: (db: DB) => void }) {
  const items = followupQueue(db)
  const [doneKey, setDoneKey] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  // Don't fire the pending callback if we unmount (e.g. tab switch) mid-animation.
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const markDone = (it: QueueItem) => {
    setDoneKey(it.key)
    // Let the satisfying check play before persisting + re-rendering the list.
    timer.current = window.setTimeout(async () => {
      const next = await api.addFollowup(it.parentId, it.type)
      setDb(next)
      setDoneKey(null)
    }, 450)
  }

  return (
    <section className="panel queue">
      <div className="panel-head">
        <h2>Today’s follow-ups</h2>
        <span className="count-pill">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="empty">All caught up — nothing to chase today.</div>
      ) : (
        <ul className="queue-list">
          {items.map((it) => (
            <li key={it.key} className={'queue-item ' + tagClass(it.type) + (doneKey === it.key ? ' completing' : '')}>
              <div className="queue-main">
                <span className="queue-name">{it.parentName}</span>
                <span className={'queue-label ' + tagClass(it.type)}>{it.label}</span>
                <span className="queue-detail">{it.detail}</span>
              </div>
              <button className="btn btn-done" onClick={() => markDone(it)} disabled={doneKey === it.key}>
                {doneKey === it.key ? <span className="check">✓</span> : 'Done'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
