import { describe, it, expect } from 'vitest'
import { buildReportMarkdown } from './reportMarkdown'
import { historyFixture, analysisFixture, ideaFixture } from '../../test/fixtures/history'
import { experimentPlanFixture } from '../../test/fixtures/experiments'

describe('buildReportMarkdown', () => {
  const record = {
    id: historyFixture.id,
    idea: ideaFixture,
    analysis: analysisFixture,
  }

  it('includes the idea title', () => {
    expect(buildReportMarkdown(record)).toContain(ideaFixture.title)
  })

  it('includes the verdict', () => {
    expect(buildReportMarkdown(record)).toContain('PIVOT')
  })

  it('includes the overall score', () => {
    expect(buildReportMarkdown(record)).toContain('62')
  })

  it('includes category scores', () => {
    const md = buildReportMarkdown(record)
    expect(md).toContain('Problem Clarity')
    expect(md).toContain('78')
  })

  it('includes assumptions and risks', () => {
    const md = buildReportMarkdown(record)
    expect(md).toContain(analysisFixture.assumptions[0].assumption)
    expect(md).toContain(analysisFixture.risks[0].risk)
  })

  it('includes saved validation experiments when provided', () => {
    const resolved = experimentPlanFixture.map((e) => ({
      ...e,
      status: 'PLANNED',
      isPhase8: true,
    }))
    const md = buildReportMarkdown({
      idea: record.idea,
      analysis: record.analysis,
      experiments: resolved,
    })
    expect(md).toContain(experimentPlanFixture[0].hypothesis)
    expect(md).toContain('Validation Experiments')
  })

  it('omits the Validation Experiments section when no plan', () => {
    expect(buildReportMarkdown(record)).not.toContain(
      '## Validation Experiments',
    )
  })

  it('omits Challenge Mode (not persisted)', () => {
    expect(buildReportMarkdown(record)).not.toContain('Challenge Mode')
  })

  it('returns a non-empty string', () => {
    expect(typeof buildReportMarkdown(record)).toBe('string')
    expect(buildReportMarkdown(record).length).toBeGreaterThan(50)
  })
})
