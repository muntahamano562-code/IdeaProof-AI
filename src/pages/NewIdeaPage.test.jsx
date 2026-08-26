import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NewIdeaPage from './NewIdeaPage'

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

beforeEach(() => {
  localStorage.clear()
  mockNavigate.mockClear()
})

describe('NewIdeaPage', () => {
  it('requires the title and description before continuing', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <NewIdeaPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByText('Description is required.')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('saves a draft and navigates to the idea on valid submit', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <NewIdeaPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/Idea title/i), 'Study planner')
    await user.type(
      screen.getByLabelText(/Idea description/i),
      'A planner that adapts to each student course load and surfaces urgent work.',
    )
    await user.type(
      screen.getByLabelText(/Target users/i),
      'University students',
    )
    await user.type(
      screen.getByLabelText(/Problem being solved/i),
      'Students lose track of deadlines.',
    )

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/^\/ideas\//),
      ),
    )
    expect(
      localStorage.getItem('ideaproof-ai:idea-draft:test-user'),
    ).not.toBeNull()
  })

  it('saves a draft via the Save draft button', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <NewIdeaPage />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText(/Idea title/i), 'Study planner')
    await user.type(
      screen.getByLabelText(/Idea description/i),
      'A planner that adapts to each student course load and surfaces urgent work.',
    )
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(await screen.findByText('Draft saved just now.')).toBeInTheDocument()
  })
})
