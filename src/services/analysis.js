import { validateAnalysis } from '../schemas/analysis.schema'

/**
 * Client-side call to the server-side analysis route. The LLM key never leaves
 * the server; the browser only ever receives the validated structured object.
 */
export async function analyzeIdea(idea) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: idea.title,
      description: idea.description,
      targetUsers: idea.targetUsers,
      problem: idea.problem,
    }),
  })

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    throw new Error(
      data.error || 'Analysis could not be completed. Please try again.',
    )
  }

  const parsed = validateAnalysis(data)
  if (!parsed.success) {
    throw new Error('The analysis response was not in the expected format.')
  }

  return parsed.data
}
