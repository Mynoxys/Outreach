import { useRef, useState } from 'react'
import type { DB, Parent, Status } from '../types'
import { ALL_STATUSES, STATUS_LABEL, nextStatus } from '../types'
import { api } from '../api'
import { trialDay } from '../stats'
import { formatDate, todayKey } from '../dateUtils'
import ParentForm from './ParentForm'

function countByStatus(db: DB): Record<string, number> {
  const m: Record<string, number> = {}
  for (const p of db.parents) m[p.status] = (m[p.status] || 0) + 1
  return m
}

export default function ParentsTable({ db, setDb }: { db: DB; setDb: (db: DB) => void }) {
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [editing, setEditing] = useState<Parent | null>(null)

  const [qName, setQName] = useState('')
  const [qSource, setQSource] = useState('')
  const [qDate, setQDate] = useState(todayKey())
  const nameRef = useRef<HTMLInputElement>(null)

  const quickAdd = async () => {
    if (!qName.trim()) {
      nameRef.current?.focus() // empty name: nudge instead of looking dead
      return
    }
    const next = await api.createParent({
      name: qName.trim(),
      source: qSource.trim(),
      first_contact_date: qDate,
      status: 'cold_sent',
    })
    setDb(next)
    setQName('')
    setQSource('')
    setQDate(todayKey())
  }

  const advance = async (p: Parent) => {
    const n = nextStatus(p.status)
    if (n) setDb(await api.setStatus(p.id, n))
  }

  const remove = async (p: Parent) => {
    if (!window.confirm(`Delete ${p.name || 'this parent'}? This can’t be undone.`)) return
    setDb(await api.deleteParent(p.id))
  }

  const counts = countByStatus(db)
  const rows = db.parents
    .filter((p) => filter === 'all' || p.status === filter)
    .sort((a, b) => (a.first_contact_date < b.first_contact_date ? 1 : -1))

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Pipeline</h2>
        <span className="count-pill">{db.parents.length}</span>
      </div>

      <div className="filters">
        <button className={'chip' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>
          All <b>{db.parents.length}</b>
        </button>
        {ALL_STATUSES.map((s) => (
          <button key={s} className={'chip' + (filter === s ? ' active' : '')} onClick={() => setFilter(s)}>
            {STATUS_LABEL[s]} <b>{counts[s] || 0}</b>
          </button>
        ))}
      </div>

      <div className="add-parent">
        <div className="add-parent-head">
          <span className="add-parent-title">Add a parent</span>
          <span className="add-parent-hint">Type a name, then press Enter or click Add.</span>
        </div>
        <div className="quick-add">
          <input
            ref={nameRef}
            placeholder="Name (required)"
            value={qName}
            onChange={(e) => setQName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
          />
          <input
            placeholder="Where you found them — FB group, Reddit, referral…"
            value={qSource}
            onChange={(e) => setQSource(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
          />
          <input type="date" value={qDate} onChange={(e) => setQDate(e.target.value)} title="First contact date" />
          <button className="btn btn-primary" onClick={quickAdd}>+ Add parent</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="parents">
          <thead>
            <tr>
              <th>Name</th>
              <th>Source</th>
              <th>First contact</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Key quote</th>
              <th>Failure moment</th>
              <th aria-label="actions"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  {filter !== 'all'
                    ? 'No parents in this status.'
                    : 'No parents yet — add your first one with the “Add a parent” form above.'}
                </td>
              </tr>
            )}
            {rows.map((p) => {
              const next = nextStatus(p.status)
              const td = trialDay(p)
              const inTrial = p.status === 'trial_started' || p.status === 'trial_active'
              return (
                <tr key={p.id}>
                  <td className="cell-name">{p.name || <span className="muted">—</span>}</td>
                  <td>{p.source || <span className="muted">—</span>}</td>
                  <td className="nowrap">{formatDate(p.first_contact_date)}</td>
                  <td>
                    <button
                      className={'status-badge s-' + p.status}
                      title={next ? `Click to advance → ${STATUS_LABEL[next]}` : 'Final stage'}
                      onClick={() => advance(p)}
                      disabled={!next}
                    >
                      {STATUS_LABEL[p.status]}
                      {inTrial && td !== null ? ` · d${td}` : ''}
                    </button>
                  </td>
                  <td className="cell-long" title={p.notes}>{p.notes || <span className="muted">—</span>}</td>
                  <td className="cell-long" title={p.key_quote}>
                    {p.key_quote ? `“${p.key_quote}”` : <span className="muted">—</span>}
                  </td>
                  <td>{p.failure_moment_tag ? <span className="tag">{p.failure_moment_tag}</span> : <span className="muted">—</span>}</td>
                  <td className="cell-actions">
                    <button className="icon-btn" title="Edit" onClick={() => setEditing(p)}>✎</button>
                    <button className="icon-btn danger" title="Delete" onClick={() => remove(p)}>✕</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <ParentForm
          parent={editing}
          onClose={() => setEditing(null)}
          onSaved={(next) => {
            setDb(next)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}
