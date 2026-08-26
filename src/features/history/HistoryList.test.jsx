import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HistoryList } from './HistoryList'
import { historyStoreFixture } from '../../test/fixtures/history'

beforeEach(() => {
  localStorage.clear()
})

function seed() {
  localStorage.setItem('ideaproof:history', JSON.stringify(historyStoreFixture))
}

describe('HistoryList', () => {
  it('shows an empty state when there is no history', () => {
    render(
      <MemoryRouter>
        <HistoryList />
      </MemoryRouter>,
    )
    expect(screen.getByText('No saved ideas yet')).toBeInTheDocument()
  })

  it('renders a saved record with verdict, score and counts', () => {
    seed()
    render(
      <MemoryRouter>
        <HistoryList />
      </MemoryRouter>,
    )
    expect(
      screen.getByText('Study planner for overwhelmed students'),
    ).toBeInTheDocument()
    expect(screen.getByText('PIVOT')).toBeInTheDocument()
    expect(screen.getByText('62/100')).toBeInTheDocument()
    expect(screen.getAllByText('2')).toHaveLength(2) // assumptions + risks counts
    expect(screen.getByText('1')).toBeInTheDocument() // experiments count
  })

  it('links to the idea and report', () => {
    seed()
    render(
      <MemoryRouter>
        <HistoryList />
      </MemoryRouter>,
    )
    const open = screen.getByRole('link', { name: 'Open' })
    const report = screen.getByRole('link', { name: 'Report' })
    expect(open).toHaveAttribute('href', '/ideas/test-idea-1')
    expect(report).toHaveAttribute('href', '/ideas/test-idea-1/report')
  })

  it('deletes a record after confirmation', async () => {
    const user = userEvent.setup()
    seed()
    render(
      <MemoryRouter>
        <HistoryList />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Delete this saved idea?')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByText('Study planner for overwhelmed students'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete',
      }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('No saved ideas yet')).toBeInTheDocument()
  })
})
