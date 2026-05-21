// Clears data.json back to empty. Run with `npm run reset` when you want a clean slate.
import fs from 'node:fs'
import { DATA_FILE, DEFAULT_DB } from './db.js'

fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2))
console.log('data.json reset to empty.')
