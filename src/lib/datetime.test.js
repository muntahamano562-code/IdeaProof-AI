import { describe, it, expect } from 'vitest'
import { formatTimestamp } from './datetime'

describe('formatTimestamp', () => {
  it('formats a valid ISO date', () => {
    const result = formatTimestamp('2025-01-02T12:00:00.000Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('')
    expect(result).not.toBeNull()
  })

  it('returns null for an invalid date', () => {
    expect(formatTimestamp('not-a-date')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(formatTimestamp('')).toBeNull()
  })

  it('returns null for null', () => {
    expect(formatTimestamp(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(formatTimestamp(undefined)).toBeNull()
  })

  it('never returns the literal "Invalid Date"', () => {
    const result = formatTimestamp('2025-13-45T99:99:99Z')
    expect(result).not.toBe('Invalid Date')
  })
})
