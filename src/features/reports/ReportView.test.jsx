import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ReportView } from './ReportView'
import { historyFixture } from '../../test/fixtures/history'
import { experimentPlanFixture } from '../../test/fixtures/experiments'

beforeEach(() => {
  localStorage.clear()
})

describe('ReportView', () => {
  const record = historyFixture

  it('renders the idea title and verdict from saved data', () => {
    render(
      <MemoryRouter>
        <ReportView record={record} />
      </MemoryRouter>,
    )
    expect(screen.getByText(record.idea.title)).toBeInTheDocument()
    expect(screen.getByText('PIVOT')).toBeInTheDocument()
    expect(screen.getByText('62/100')).toBeInTheDocument()
  })

  it('shows the AI assessment notice', () => {
    render(
      <MemoryRouter>
        <ReportView record={record} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/AI assessment notice/i)).toBeInTheDocument()
  })

  it('renders category scores, assumptions and risks', () => {
    render(
      <MemoryRouter>
        <ReportView record={record} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Problem Clarity')).toBeInTheDocument()
    expect(
      screen.getByText(record.analysis.assumptions[0].assumption),
    ).toBeInTheDocument()
    expect(
      screen.getByText(record.analysis.risks[0].risk),
    ).toBeInTheDocument()
  })

  it('renders saved Phase 8 validation experiments with status', () => {
    localStorage.setItem(
      'ideaproof:experiments-plan:test-idea-1',
      JSON.stringify(experimentPlanFixture),
    )
    localStorage.setItem(
      'ideaproof:experiments:test-idea-1',
      JSON.stringify({ 'experiment-1': 'DONE' }),
    )
    render(
      <MemoryRouter>
        <ReportView record={record} />
      </MemoryRouter>,
    )
    expect(
      screen.getByText(experimentPlanFixture[0].hypothesis),
    ).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('links back to the idea', () => {
    render(
      <MemoryRouter>
        <ReportView record={record} />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('link', { name: /Back to idea/i }),
    ).toHaveAttribute('href', '/ideas/test-idea-1')
  })
})
