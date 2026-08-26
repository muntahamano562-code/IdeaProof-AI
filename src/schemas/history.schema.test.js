import { describe, it, expect } from 'vitest'
import {
  HistoryRecordSchema,
  HistoryStoreSchema,
  IdeaSchema,
} from './history.schema'
import { historyFixture } from '../test/fixtures/history'
import { analysisFixture } from '../test/fixtures/analysis'

describe('HistoryRecordSchema', () => {
  it('accepts a valid history record', () => {
    expect(HistoryRecordSchema.safeParse(historyFixture).success).toBe(true)
  })

  it('rejects a record with a missing id', () => {
    const { id, ...rest } = historyFixture
    expect(HistoryRecordSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a record with an invalid analysis', () => {
    const result = HistoryRecordSchema.safeParse({
      ...historyFixture,
      analysis: { ...analysisFixture, verdict: 'NOPE' },
    })
    expect(result.success).toBe(false)
  })
})

describe('HistoryStoreSchema', () => {
  it('accepts version 1 with items', () => {
    expect(
      HistoryStoreSchema.safeParse({ version: 1, items: [historyFixture] })
        .success,
    ).toBe(true)
  })

  it('rejects an unsupported version', () => {
    expect(
      HistoryStoreSchema.safeParse({ version: 99, items: [] }).success,
    ).toBe(false)
  })
})

describe('IdeaSchema', () => {
  it('accepts a valid idea', () => {
    expect(IdeaSchema.safeParse(historyFixture.idea).success).toBe(true)
  })

  it('rejects an idea missing title', () => {
    const { title, ...rest } = historyFixture.idea
    expect(IdeaSchema.safeParse(rest).success).toBe(false)
  })
})
