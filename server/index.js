import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { getDB, mutate, replaceDB, DEFAULT_DB } from './db.js'
import { buildSampleData } from './sampleData.js'
import { todayKey } from './util.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

const app = express()
// 5mb so a full exported backup can be re-imported (default is 100kb).
app.use(express.json({ limit: '5mb' }))

const nowISO = () => new Date().toISOString()

// Minimal shape check for an imported backup. Doesn't deep-validate fields —
// just enough that the app's iterators won't crash on a malformed file.
function isValidDB(x) {
  return (
    !!x && typeof x === 'object' && !Array.isArray(x) &&
    Array.isArray(x.parents) &&
    Array.isArray(x.journal) &&
    Array.isArray(x.followups) &&
    !!x.messageCounts && typeof x.messageCounts === 'object' && !Array.isArray(x.messageCounts)
  )
}

// Advance/set a parent's status and record it in the timeline.
function setStatus(p, status) {
  if (p.status === status) return // no-op: don't spam the timeline
  p.status = status
  p.status_history.push({ status, at: nowISO() })
  if (status === 'trial_started' && !p.trial_start_date) {
    p.trial_start_date = todayKey()
  }
  p.updated_at = nowISO()
}

// --- Read everything ---
app.get('/api/state', (_req, res) => res.json(getDB()))

// --- Parents ---
app.post('/api/parents', (req, res) => {
  const b = req.body || {}
  const status = b.status || 'cold_sent'
  const parent = {
    id: randomUUID(),
    name: b.name || '',
    source: b.source || '',
    first_contact_date: b.first_contact_date || todayKey(),
    status,
    trial_start_date: b.trial_start_date || null,
    notes: b.notes || '',
    key_quote: b.key_quote || '',
    failure_moment_tag: b.failure_moment_tag || '',
    created_at: nowISO(),
    updated_at: nowISO(),
    status_history: [{ status, at: nowISO() }],
  }
  if (status === 'trial_started' && !parent.trial_start_date) {
    parent.trial_start_date = todayKey()
  }
  mutate((db) => db.parents.push(parent))
  res.json(getDB())
})

app.patch('/api/parents/:id', (req, res) => {
  const editable = [
    'name', 'source', 'first_contact_date', 'trial_start_date',
    'notes', 'key_quote', 'failure_moment_tag',
  ]
  mutate((db) => {
    const p = db.parents.find((x) => x.id === req.params.id)
    if (!p) return
    for (const f of editable) if (f in req.body) p[f] = req.body[f]
    if ('status' in req.body && req.body.status !== p.status) {
      setStatus(p, req.body.status)
    }
    p.updated_at = nowISO()
  })
  res.json(getDB())
})

app.post('/api/parents/:id/status', (req, res) => {
  const { status } = req.body || {}
  mutate((db) => {
    const p = db.parents.find((x) => x.id === req.params.id)
    if (p && status) setStatus(p, status)
  })
  res.json(getDB())
})

app.delete('/api/parents/:id', (req, res) => {
  mutate((db) => {
    db.parents = db.parents.filter((p) => p.id !== req.params.id)
    db.followups = db.followups.filter((f) => f.parentId !== req.params.id)
  })
  res.json(getDB())
})

// --- Messages (manual daily counter) ---
app.post('/api/messages', (req, res) => {
  const delta = Number(req.body?.delta ?? 1)
  const day = req.body?.date || todayKey()
  mutate((db) => {
    const next = Math.max(0, (db.messageCounts[day] || 0) + delta)
    if (next === 0) delete db.messageCounts[day]
    else db.messageCounts[day] = next
  })
  res.json(getDB())
})

// --- Follow-ups (mark a queue item done) ---
app.post('/api/followups', (req, res) => {
  const { parentId, type, date } = req.body || {}
  const entry = { id: randomUUID(), parentId, type, date: date || todayKey() }
  mutate((db) => db.followups.push(entry))
  res.json(getDB())
})

// --- Journal (end-of-day) ---
app.post('/api/journal', (req, res) => {
  const { date, learned, quote, changes } = req.body || {}
  const entry = {
    id: randomUUID(),
    date: date || todayKey(),
    learned: learned || '',
    quote: quote || '',
    changes: changes || '',
    created_at: nowISO(),
  }
  mutate((db) => db.journal.push(entry))
  res.json(getDB())
})

// --- Export (download the whole DB as JSON) ---
app.get('/api/export', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="rulely-backup-${todayKey()}.json"`,
  )
  res.send(JSON.stringify(getDB(), null, 2))
})

// --- Whole-DB operations (clear / load sample / import a backup) ---
app.post('/api/data/clear', (_req, res) => {
  res.json(replaceDB(structuredClone(DEFAULT_DB)))
})

app.post('/api/data/sample', (_req, res) => {
  res.json(replaceDB(buildSampleData()))
})

app.post('/api/import', (req, res) => {
  const body = req.body
  // Validate the uploaded file itself (not a merged result) so a wrong/corrupt
  // file is rejected rather than silently collapsing into an empty DB.
  if (!isValidDB(body)) {
    return res.status(400).json({
      error: 'Invalid backup: expected a Rulely export with parents, journal, messageCounts, followups.',
    })
  }
  // Copy only known keys so stray fields aren't persisted.
  const next = {
    parents: body.parents,
    journal: body.journal,
    messageCounts: body.messageCounts,
    followups: body.followups,
  }
  res.json(replaceDB(next))
})

// --- Serve built frontend in production (npm run preview) ---
const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Rulely Tracker API on http://localhost:${PORT}`)
})
