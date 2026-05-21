import type { DB, FollowupType, Parent, Status } from './types'
import { todayKey } from './dateUtils'

async function req(url: string, options?: RequestInit): Promise<DB> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`${options?.method || 'GET'} ${url} failed (${res.status})`)
  return res.json()
}

const post = (url: string, body?: unknown) =>
  req(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined })

// Every mutation returns the full updated DB so callers can replace state.
export const api = {
  getState: () => req('/api/state'),

  createParent: (p: Partial<Parent>) => post('/api/parents', p),
  updateParent: (id: string, patch: Partial<Parent>) =>
    req(`/api/parents/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  setStatus: (id: string, status: Status) =>
    post(`/api/parents/${id}/status`, { status }),
  deleteParent: (id: string) => req(`/api/parents/${id}`, { method: 'DELETE' }),

  addMessage: (delta: number) => post('/api/messages', { delta, date: todayKey() }),

  addFollowup: (parentId: string, type: FollowupType) =>
    post('/api/followups', { parentId, type, date: todayKey() }),

  addJournal: (entry: { learned: string; quote: string; changes: string }) =>
    post('/api/journal', { ...entry, date: todayKey() }),

  clearData: () => post('/api/data/clear'),
  loadSample: () => post('/api/data/sample'),
}
