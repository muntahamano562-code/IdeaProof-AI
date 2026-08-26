import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import IdeaDetailPage from './IdeaDetailPage'
import { analyzeIdea } from '../services/analysis'
import { historyStoreFixture } from '../test/fixtures/history'

vi.mock('../features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

vi.mock('../services/analysis', () => ({
  analyzeIdea: vi.fn(),
}))

vi.mock('../components/analysis/RiskRadar', () => ({
  RiskRadar: () => null,
}))

beforeEach(() => {
  localStorage.clear()
})

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/ideas/:id" element={<IdeaDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('IdeaDetailPage saved-analysis restoration', () => {
  it('restores saved analysis without calling the AI service', async () => {
    localStorage.setItem(
      'ideaproof:history',
      JSON.stringify(historyStoreFixture),
    )

    renderAt('/ideas/test-idea-1')

    expect(await screen.findByText('Study planner for overwhelmed students')).toBeInTheDocument()
    expect(screen.getByText('AI analysis')).toBeInTheDocument()
    expect(screen.getByText('PIVOT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start challenge mode' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View full report' })).toHaveAttribute(
      'href',
      '/ideas/test-idea-1/report',
    )

    expect(screen.queryByRole('button', { name: 'Run analysis' })).not.toBeInTheDocument()
    expect(analyzeIdea).not.toHaveBeenCalled()
  })
})
