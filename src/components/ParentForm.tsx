import { useState } from 'react'
import type { DB, Parent, Status } from '../types'
import { ALL_STATUSES, STATUS_LABEL } from '../types'
import { api } from '../api'

type FieldEvent = { target: { value: string } }

export default function ParentForm({
  parent,
  onClose,
  onSaved,
}: {
  parent: Parent
  onClose: () => void
  onSaved: (db: DB) => void
}) {
  const [f, setF] = useState({
    name: parent.name,
    source: parent.source,
    first_contact_date: parent.first_contact_date,
    status: parent.status as Status,
    trial_start_date: parent.trial_start_date ?? '',
    notes: parent.notes,
    key_quote: parent.key_quote,
    failure_moment_tag: parent.failure_moment_tag,
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof f) => (e: FieldEvent) => setF({ ...f, [k]: e.target.value })

  const save = async () => {
    setSaving(true)
    const next = await api.updateParent(parent.id, {
      name: f.name,
      source: f.source,
      first_contact_date: f.first_contact_date,
      status: f.status,
      trial_start_date: f.trial_start_date || null,
      notes: f.notes,
      key_quote: f.key_quote,
      failure_moment_tag: f.failure_moment_tag,
    })
    onSaved(next)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit parent</h3>
        <div className="form-grid">
          <label>Name<input value={f.name} onChange={set('name')} /></label>
          <label>Source<input value={f.source} onChange={set('source')} /></label>
          <label>First contact<input type="date" value={f.first_contact_date} onChange={set('first_contact_date')} /></label>
          <label>
            Status
            <select value={f.status} onChange={set('status')}>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <label>Trial start<input type="date" value={f.trial_start_date} onChange={set('trial_start_date')} /></label>
          <label>Failure-moment tag<input value={f.failure_moment_tag} onChange={set('failure_moment_tag')} placeholder="e.g., bedtime" /></label>
          <label className="span2">Key quote<textarea rows={2} value={f.key_quote} onChange={set('key_quote')} /></label>
          <label className="span2">Notes<textarea rows={5} value={f.notes} onChange={set('notes')} /></label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
