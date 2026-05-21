import { useState } from 'react'
import type { DB, Template } from '../types'
import { api } from '../api'

function TemplateCard({ t, setDb }: { t: Template; setDb: (db: DB) => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(t.title)
  const [body, setBody] = useState(t.body)
  const [kind, setKind] = useState(t.kind)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(t.body)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1300)
    } catch {
      // clipboard can be blocked (e.g. insecure context) — ignore
    }
  }
  const save = async () => {
    setSaving(true)
    setDb(await api.updateTemplate(t.id, { title: title.trim(), body, kind: kind.trim() }))
    setEditing(false)
    setSaving(false)
  }
  const cancel = () => {
    setTitle(t.title)
    setBody(t.body)
    setKind(t.kind)
    setEditing(false)
  }
  const remove = async () => {
    if (!window.confirm('Delete this template?')) return
    setDb(await api.deleteTemplate(t.id))
  }

  if (editing) {
    return (
      <li className="tpl-card is-editing">
        <input className="tpl-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input className="tpl-input" value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Kind (cold, follow-up, check-in…)" />
        <textarea className="tpl-input" rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message text" />
        <div className="tpl-actions">
          <button className="btn" onClick={cancel}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </li>
    )
  }

  return (
    <li className="tpl-card">
      <div className="tpl-head">
        <span className="tpl-title">{t.title || <span className="muted">Untitled</span>}</span>
        {t.kind && <span className="tag">{t.kind}</span>}
      </div>
      <p className="tpl-body">{t.body}</p>
      <div className="tpl-actions">
        <button className={'btn btn-primary' + (copied ? ' is-copied' : '')} onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
        <button className="btn" onClick={() => setEditing(true)}>Edit</button>
        <button className="icon-btn danger" title="Delete" onClick={remove}>✕</button>
      </div>
    </li>
  )
}

export default function MessagesTab({ db, setDb }: { db: DB; setDb: (db: DB) => void }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState('')

  const add = async () => {
    if (!title.trim() && !body.trim()) return
    setDb(await api.addTemplate({ title: title.trim(), body, kind: kind.trim() }))
    setTitle('')
    setBody('')
    setKind('')
    setAdding(false)
  }
  const loadStarters = async () => setDb(await api.loadStarterTemplates())

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Message templates</h2>
        <span className="count-pill">{db.templates.length}</span>
        <div className="panel-head-actions">
          <button className="btn" onClick={loadStarters}>Load starter messages</button>
          <button className="btn btn-primary" onClick={() => setAdding((v) => !v)}>{adding ? 'Close' : '+ New template'}</button>
        </div>
      </div>
      <p className="tab-sub">
        Your editable scripts — different lengths and moments. Tap Copy, paste into FB/Reddit/DMs, and fill in the
        [name]/[time] bits.
      </p>

      {adding && (
        <div className="tpl-add">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Cold DM — short)" />
          <input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Kind (cold, follow-up, check-in…)" />
          <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message text" />
          <div className="tpl-actions">
            <button className="btn" onClick={() => { setAdding(false); setTitle(''); setBody(''); setKind('') }}>Cancel</button>
            <button className="btn btn-primary" onClick={add} disabled={!title.trim() && !body.trim()}>Add template</button>
          </div>
        </div>
      )}

      {db.templates.length === 0 ? (
        <div className="empty">No templates yet — click “Load starter messages” for a ready-made set, or add your own.</div>
      ) : (
        <ul className="tpl-list">
          {db.templates.map((t) => (
            <TemplateCard key={t.id} t={t} setDb={setDb} />
          ))}
        </ul>
      )}
    </section>
  )
}
