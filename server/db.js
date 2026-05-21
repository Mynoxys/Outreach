import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_FILE = path.join(__dirname, 'data.json')

export const DEFAULT_DB = {
  parents: [],
  journal: [],
  messageCounts: {},
  followups: [],
}

let db = loadInitial()

function loadInitial() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    // Merge over defaults so older/partial files still get new keys.
    return { ...structuredClone(DEFAULT_DB), ...parsed }
  } catch {
    return structuredClone(DEFAULT_DB)
  }
}

export function getDB() {
  return db
}

// Run a mutation against the in-memory db, then persist the whole file.
export function mutate(fn) {
  fn(db)
  persist()
  return db
}

// Swap the entire db (clear / load sample / import) and persist.
export function replaceDB(next) {
  db = next
  persist()
  return db
}

function persist() {
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DATA_FILE)
}
