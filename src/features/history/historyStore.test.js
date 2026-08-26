import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  saveIdeaHistory,
  loadIdeaHistory,
  getIdeaHistory,
  deleteIdeaHistory,
  clearIdeaHistory,
} from './historyStore'
import { historyFixture, ideaFixture, analysisFixture } from '../../test/fixtures/history'

const KEY = 'ideaproof:history'

beforeEach(() => {
  localStorage.clear()
})

describe('historyStore', () => {
  it('returns [] when history is empty', () => {
    expect(loadIdeaHistory()).toEqual([])
  })

  it('saves and loads a valid record', () => {
    expect(saveIdeaHistory(historyFixture)).toBe(true)
    const loaded = loadIdeaHistory()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(historyFixture.id)
  })

  it('getIdeaHistory returns the correct record', () => {
    saveIdeaHistory(historyFixture)
    expect(getIdeaHistory(historyFixture.id)?.id).toBe(historyFixture.id)
  })

  it('getIdeaHistory returns null for an unknown id', () => {
    expect(getIdeaHistory('does-not-exist')).toBeNull()
  })

  it('upserts by id instead of duplicating', () => {
    saveIdeaHistory(historyFixture)
    const updated = {
      ...historyFixture,
      analysis: { ...analysisFixture, overallScore: 91 },
      updatedAt: '2025-02-01T00:00:00.000Z',
    }
    saveIdeaHistory(updated)
    const loaded = loadIdeaHistory()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].analysis.overallScore).toBe(91)
  })

  it('preserves the original createdAt on update', () => {
    saveIdeaHistory(historyFixture)
    const updated = { ...historyFixture, createdAt: '2099-01-01T00:00:00.000Z' }
    saveIdeaHistory(updated)
    expect(getIdeaHistory(historyFixture.id).createdAt).toBe(
      historyFixture.createdAt,
    )
  })

  it('deletes the correct item and leaves others', () => {
    saveIdeaHistory(historyFixture)
    const other = {
      id: 'other-idea',
      idea: { ...ideaFixture, id: 'other-idea' },
      analysis: analysisFixture,
    }
    saveIdeaHistory(other)
    deleteIdeaHistory(historyFixture.id)
    const loaded = loadIdeaHistory()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('other-idea')
  })

  it('clear removes all history', () => {
    saveIdeaHistory(historyFixture)
    clearIdeaHistory()
    expect(loadIdeaHistory()).toEqual([])
  })

  it('rejects invalid records safely', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, items: [{ id: 'bad' }] }),
    )
    expect(loadIdeaHistory()).toEqual([])
  })

  it('does not crash on corrupted JSON', () => {
    localStorage.setItem(KEY, 'this is not json')
    expect(() => loadIdeaHistory()).not.toThrow()
    expect(loadIdeaHistory()).toEqual([])
  })

  it('fails safely on an unsupported version', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 99, items: [] }))
    expect(loadIdeaHistory()).toEqual([])
  })

  it('tolerates a legacy raw array', () => {
    localStorage.setItem(KEY, JSON.stringify([historyFixture]))
    expect(loadIdeaHistory()).toHaveLength(1)
  })

  it('does not crash when localStorage.setItem throws', () => {
    const original = window.localStorage
    const store = {}
    const fake = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: (k) => {
        delete store[k]
      },
      clear: () => {
        for (const k in store) delete store[k]
      },
      key: (i) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length
      },
    }
    Object.defineProperty(window, 'localStorage', { value: fake, configurable: true })
    try {
      expect(() => saveIdeaHistory(historyFixture)).not.toThrow()
      expect(saveIdeaHistory(historyFixture)).toBe(false)
    } finally {
      Object.defineProperty(window, 'localStorage', {
        value: original,
        configurable: true,
      })
    }
  })

  it('uses the ideaproof:history key', () => {
    saveIdeaHistory(historyFixture)
    expect(localStorage.getItem(KEY)).not.toBeNull()
    const parsed = JSON.parse(localStorage.getItem(KEY))
    expect(parsed.version).toBe(1)
    expect(parsed.items[0].id).toBe(historyFixture.id)
  })
})
