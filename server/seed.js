// Populates data.json with realistic sample data so every feature is visible.
// Run with `npm run seed`. Clear it any time with `npm run reset`.
// (The same data is loadable in-app via the "Load sample" button.)
import fs from 'node:fs'
import { DATA_FILE } from './db.js'
import { buildSampleData } from './sampleData.js'

const data = buildSampleData()
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
console.log(
  `Seeded ${data.parents.length} parents, ${data.followups.length} follow-ups, ${data.journal.length} journal entries.`,
)
