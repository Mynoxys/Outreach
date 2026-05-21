import { useRef, useState } from 'react'
import type { DB, Lead } from '../types'
import { api } from '../api'

export default function LeadsTab({ db, setDb }: { db: DB; setDb: (db: DB) => void }) {
  const [name, setName] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const add = async () => {
    if (!name.trim()) {
      nameRef.current?.focus()
      return
    }
    setDb(await api.addLead({ name: name.trim(), source: source.trim(), note: note.trim() }))
    setName('')
    setSource('')
    setNote('')
    nameRef.current?.focus()
  }
  const promote = async (l: Lead) => setDb(await api.promoteLead(l.id))
  const remove = async (l: Lead) => {
    if (!window.confirm(`Remove ${l.name || 'this lead'} from the list?`)) return
    setDb(await api.deleteLead(l.id))
  }

  const leads = [...db.leads].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Leads to reach out to</h2>
        <span className="count-pill">{db.leads.length}</span>
      </div>
      <p className="tab-sub">
        People and channels you haven’t contacted yet. When you message one, hit “Move to pipeline” and it becomes a
        cold-sent parent.
      </p>

      <div className="lead-add">
        <input
          ref={nameRef}
          placeholder="Name / handle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <input
          placeholder="Where you found them — group, subreddit, link…"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="btn btn-primary" onClick={add}>+ Add lead</button>
      </div>

      {leads.length === 0 ? (
        <div className="empty">No leads yet — jot down anyone you want to reach out to.</div>
      ) : (
        <ul className="lead-list">
          {leads.map((l) => (
            <li key={l.id} className="lead-item">
              <div className="lead-main">
                <span className="lead-name">{l.name || <span className="muted">—</span>}</span>
                {l.source && <span className="lead-source">{l.source}</span>}
                {l.note && <span className="lead-note">{l.note}</span>}
              </div>
              <div className="lead-actions">
                <button className="btn btn-primary" onClick={() => promote(l)} title="Create a cold-sent parent in the pipeline">
                  → Move to pipeline
                </button>
                <button className="icon-btn danger" title="Delete" onClick={() => remove(l)}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
