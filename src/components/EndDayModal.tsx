import { useState } from 'react'
import type { DB } from '../types'
import { api } from '../api'

export default function EndDayModal({
  setDb,
  onClose,
}: {
  setDb: (db: DB) => void
  onClose: () => void
}) {
  const [learned, setLearned] = useState('')
  const [quote, setQuote] = useState('')
  const [changes, setChanges] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    setDb(await api.addJournal({ learned, quote, changes }))
    onClose()
  }

  const empty = !learned.trim() && !quote.trim() && !changes.trim()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>End of day</h3>
        <p className="modal-sub">Three quick reflections. Wednesday’s review is just re-reading these.</p>
        <label className="block">
          What did you learn today?
          <textarea rows={2} value={learned} onChange={(e) => setLearned(e.target.value)} autoFocus placeholder="One sentence." />
        </label>
        <label className="block">
          Which interview quote stuck with you?
          <textarea rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="The line you can’t stop thinking about." />
        </label>
        <label className="block">
          Anything to change in your messaging?
          <textarea rows={2} value={changes} onChange={(e) => setChanges(e.target.value)} placeholder="A tweak to try tomorrow." />
        </label>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || empty}>
            {saving ? 'Saving…' : 'Save & end day'}
          </button>
        </div>
      </div>
    </div>
  )
}
