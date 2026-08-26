import {
  validateHistoryRecord,
  validateHistoryStore,
} from '../../schemas/history.schema'

/**
 * Local-only idea history (Phase 9).
 *
 * Persists analyzed ideas to localStorage under a single versioned key. No
 * Supabase, no auth, no server. The structure is:
 *
 *   { "version": 1, "items": [ HistoryRecord, ... ] }
 *
 * Robustness rules:
 * - localStorage unavailable / quota errors never throw out of these functions.
 * - Malformed JSON, wrong version, or invalid records are dropped (and the store
 *   is rewritten clean) rather than crashing the UI.
 * - Saving an idea with an existing id updates that record (preserving the
 *   original createdAt); it never creates duplicate entries.
 */

const KEY = 'ideaproof:history'

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { version: 1, items: [] }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null // corrupted JSON
    }
    // Tolerate a legacy raw array (no version wrapper).
    if (Array.isArray(parsed)) return { version: 1, items: parsed }
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.version === 1 &&
      Array.isArray(parsed.items)
    ) {
      return parsed
    }
    return null // unsupported version / shape
  } catch {
    return null
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
    return true
  } catch {
    return false // quota / disabled storage
  }
}

function toStoreRecord(record) {
  const result = validateHistoryRecord(record)
  return result.success ? result.data : null
}

export function loadIdeaHistory() {
  const store = readRaw()
  if (!store) return []
  const cleaned = []
  for (const item of store.items) {
    const valid = toStoreRecord(item)
    if (valid) cleaned.push(valid)
  }
  // If we dropped anything, persist the cleaned version to avoid repeated churn.
  if (cleaned.length !== store.items.length) {
    writeStore({ version: 1, items: cleaned })
  }
  return cleaned
}

export function getIdeaHistory(id) {
  if (!id) return null
  const items = loadIdeaHistory()
  return items.find((r) => r.id === id) || null
}

export function saveIdeaHistory(record) {
  if (!record || !record.id) return false
  const valid = toStoreRecord(record)
  if (!valid) return false

  const store = readRaw() || { version: 1, items: [] }
  const items = store.items || []
  const idx = items.findIndex((r) => r.id === valid.id)

  let nextItems
  if (idx >= 0) {
    const existing = items[idx]
    nextItems = items.slice()
    nextItems[idx] = {
      ...valid,
      createdAt: existing.createdAt || valid.createdAt,
    }
  } else {
    nextItems = [...items, valid]
  }
  return writeStore({ version: 1, items: nextItems })
}

export function deleteIdeaHistory(id) {
  if (!id) return false
  const store = readRaw()
  if (!store) return false
  const nextItems = (store.items || []).filter((r) => r.id !== id)
  return writeStore({ version: 1, items: nextItems })
}

export function clearIdeaHistory() {
  try {
    localStorage.removeItem(KEY)
    return true
  } catch {
    return false
  }
}
