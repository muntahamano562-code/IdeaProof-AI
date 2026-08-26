import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalysisDashboard } from './AnalysisDashboard'
import { analysisFixture } from '../../test/fixtures/analysis'

vi.mock('../../components/analysis/RiskRadar', () => ({
  RiskRadar: () => null,
}))

describe('AnalysisDashboard', () => {
  it('renders the summary and verdict', () => {
    render(<AnalysisDashboard analysis={analysisFixture} />)
    expect(screen.getByText(analysisFixture.summary)).toBeInTheDocument()
    expect(screen.getByText('PIVOT')).toBeInTheDocument()
  })

  it('renders the overall score', () => {
    render(<AnalysisDashboard analysis={analysisFixture} />)
    expect(screen.getByText('62')).toBeInTheDocument()
  })

  it('renders category scores', () => {
    render(<AnalysisDashboard analysis={analysisFixture} />)
    expect(screen.getByText('Problem Clarity')).toBeInTheDocument()
    expect(screen.getByText('78/100')).toBeInTheDocument()
  })

  it('renders assumptions and risks', () => {
    render(<AnalysisDashboard analysis={analysisFixture} />)
    expect(
      screen.getByText(analysisFixture.assumptions[0].assumption),
    ).toBeInTheDocument()
    expect(
      screen.getByText(analysisFixture.risks[0].risk),
    ).toBeInTheDocument()
  })

  it('renders experiments', () => {
    render(<AnalysisDashboard analysis={analysisFixture} />)
    expect(
      screen.getByText(analysisFixture.experiments[0].title),
    ).toBeInTheDocument()
  })

  it('does not crash when optional sections are empty', () => {
    const minimal = {
      summary: 'ok',
      problemAnalysis: 'p',
      targetAudienceAnalysis: 't',
      feasibilityAnalysis: 'f',
      competitionAnalysis: 'c',
      assumptions: [],
      risks: [],
      categoryScores: [
        { category: 'Feasibility', score: 50, explanation: 'e' },
      ],
      overallScore: 50,
      confidence: 50,
      mvpRecommendation: 'm',
      experiments: [],
      verdict: 'BUILD',
    }
    expect(() => render(<AnalysisDashboard analysis={minimal} />)).not.toThrow()
  })
})
