import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { analyzeIdea } from './analysis'
import { analysisFixture } from '../test/fixtures/analysis'

function mockFetch(body, ok = true, status = 200) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status,
    json: async () => body,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('analyzeIdea (AI client)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the idea to the server route and returns the validated analysis', async () => {
    const fetchMock = mockFetch(analysisFixture)
    const idea = {
      title: 'Study planner',
      description: 'A planner that adapts to each student course load.',
      targetUsers: 'University students',
      problem: 'Students lose track of deadlines.',
    }

    const result = await analyzeIdea(idea)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/analyze',
      expect.objectContaining({ method: 'POST' }),
    )
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent).toEqual(idea)
    expect(result.verdict).toBe(analysisFixture.verdict)
  })

  it('throws when the server responds with an error', async () => {
    mockFetch({ error: 'Server exploded' }, false, 500)
    await expect(
      analyzeIdea({ title: 'x', description: 'y'.repeat(20) }),
    ).rejects.toThrow('Server exploded')
  })

  it('throws when the returned JSON does not match the schema', async () => {
    mockFetch({ summary: 'partial' }, true, 200)
    await expect(
      analyzeIdea({ title: 'x', description: 'y'.repeat(20) }),
    ).rejects.toThrow('expected format')
  })
})
