import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import ReportPage from './ReportPage'
import { analyzeIdea } from '../services/analysis'

vi.mock('../services/analysis', () => ({
  analyzeIdea: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
})

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/ideas/:id/report" element={<ReportPage />} />
        <Route path="/history" element={<Link to="/history">history</Link>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReportPage', () => {
  it('renders the saved report without calling the AI service', async () => {
    localStorage.setItem(
      'ideaproof:history',
      JSON.stringify({ version: 1, items: [reportRecord()] }),
    )
    renderAt('/ideas/test-idea-1/report')
    expect(await screen.findByText('Study planner for overwhelmed students')).toBeInTheDocument()
    expect(screen.getByText('PIVOT')).toBeInTheDocument()
    expect(analyzeIdea).not.toHaveBeenCalled()
  })

  it('shows a friendly message when the idea is missing', () => {
    renderAt('/ideas/missing/report')
    expect(
      screen.getByText(/no longer available/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Back to History/i }),
    ).toHaveAttribute('href', '/history')
  })
})

function reportRecord() {
  return {
    id: 'test-idea-1',
    idea: {
      id: 'test-idea-1',
      title: 'Study planner for overwhelmed students',
      description: 'desc',
      targetUsers: 'students',
      problem: 'deadlines',
      createdAt: '2025-01-01T10:00:00.000Z',
      updatedAt: '2025-01-02T12:00:00.000Z',
    },
    analysis: {
      summary: 's',
      problemAnalysis: 'p',
      targetAudienceAnalysis: 't',
      feasibilityAnalysis: 'f',
      competitionAnalysis: 'c',
      assumptions: [],
      risks: [],
      categoryScores: [{ category: 'Feasibility', score: 62, explanation: 'e' }],
      overallScore: 62,
      confidence: 58,
      mvpRecommendation: 'm',
      experiments: [],
      verdict: 'PIVOT',
    },
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-02T12:00:00.000Z',
  }
}
