import { useEffect, useState } from 'react'
import type { DB } from './types'
import { api } from './api'
import Dashboard from './components/Dashboard'
import FollowUpQueue from './components/FollowUpQueue'
import ParentsTable from './components/ParentsTable'
import PatternsTab from './components/PatternsTab'
import JournalTab from './components/JournalTab'
import EndDayModal from './components/EndDayModal'

type Tab = 'pipeline' | 'patterns' | 'journal'

function downloadExport() {
  const a = document.createElement('a')
  a.href = '/api/export'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function App() {
  const [db, setDb] = useState<DB | null>(null)
  const [tab, setTab] = useState<Tab>('pipeline')
  const [endDayOpen, setEndDayOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getState().then(setDb).catch((e) => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="loading">
        <p>Couldn’t load your data.</p>
        <p className="muted">
          This app stores data in Supabase. Check that it was built with your <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, and that you ran the setup SQL (<code>db/schema.sql</code>) in your
          Supabase project. Then reload.
        </p>
        <code>{error}</code>
      </div>
    )
  }
  if (!db) return <div className="loading">Loading…</div>

  const hasData =
    db.parents.length > 0 ||
    db.journal.length > 0 ||
    db.followups.length > 0 ||
    Object.keys(db.messageCounts).length > 0

  const loadSample = async () => {
    if (hasData && !window.confirm('Replace your current data with sample data? This can’t be undone.')) return
    setDb(await api.loadSample())
  }

  const clearAll = async () => {
    if (!window.confirm('Delete ALL data and start empty? This can’t be undone — export a backup first if you want one.')) return
    setDb(await api.clearData())
  }

  return (
    <div className="app">
      <div className="sticky-top">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">Rulely</span>
            <span className="brand-sub">Tracker</span>
            <span className="goal">30 trials by Aug 22</span>
          </div>
          <div className="topbar-actions">
            <button className="btn" onClick={loadSample}>Load sample</button>
            <button className="btn" onClick={downloadExport}>Export backup</button>
            <button className="btn btn-danger" onClick={clearAll} disabled={!hasData}>Clear all</button>
            <button className="btn btn-primary" onClick={() => setEndDayOpen(true)}>End day</button>
          </div>
        </header>

        <Dashboard db={db} setDb={setDb} />

        <nav className="tabs">
          <button className={'tab' + (tab === 'pipeline' ? ' active' : '')} onClick={() => setTab('pipeline')}>Pipeline</button>
          <button className={'tab' + (tab === 'patterns' ? ' active' : '')} onClick={() => setTab('patterns')}>Patterns</button>
          <button className={'tab' + (tab === 'journal' ? ' active' : '')} onClick={() => setTab('journal')}>Journal</button>
        </nav>
      </div>

      <main className="content">
        {tab === 'pipeline' && (
          <>
            <FollowUpQueue db={db} setDb={setDb} />
            <ParentsTable db={db} setDb={setDb} />
          </>
        )}
        {tab === 'patterns' && <PatternsTab db={db} />}
        {tab === 'journal' && <JournalTab db={db} />}
      </main>

      {endDayOpen && <EndDayModal setDb={setDb} onClose={() => setEndDayOpen(false)} />}
    </div>
  )
}
