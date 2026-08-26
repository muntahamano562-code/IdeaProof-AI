import { describe, it, expect } from 'vitest'
import { AnalysisSchema } from './analysis.schema'
import { analysisFixture } from '../test/fixtures/analysis'

describe('AnalysisSchema', () => {
  it('accepts a valid analysis fixture', () => {
    const result = AnalysisSchema.safeParse(analysisFixture)
    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const { summary, ...rest } = analysisFixture
    const result = AnalysisSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects an invalid verdict', () => {
    const result = AnalysisSchema.safeParse({
      ...analysisFixture,
      verdict: 'MAYBE',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an out-of-range score', () => {
    const result = AnalysisSchema.safeParse({
      ...analysisFixture,
      overallScore: 250,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid severity', () => {
    const result = AnalysisSchema.safeParse({
      ...analysisFixture,
      risks: [{ risk: 'x', severity: 'SEVERE', note: '' }],
    })
    expect(result.success).toBe(false)
  })
})
