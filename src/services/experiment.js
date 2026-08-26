import { validateExperimentsResponse } from '../schemas/experiment.schema'

/**
 * Client-side call to the server-side validation-plan route. The LLM key never
 * leaves the server; the browser only receives the validated structured plan.
 */
export async function fetchExperiments(idea, analysis) {
  let data = {}
  try {
    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: {
          title: idea.title,
          description: idea.description,
          targetUsers: idea.targetUsers,
          problem: idea.problem,
        },
        analysis,
      }),
    })
    try {
      data = await res.json()
    } catch {
      data = {}
    }
    if (!res.ok) {
      throw new Error(
        data.error || 'The validation plan could not be generated. Please try again.',
      )
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error('The validation plan could not be generated. Please try again.')
  }

  const parsed = validateExperimentsResponse(data)
  if (!parsed.success) {
    throw new Error('The validation plan was not in the expected format.')
  }
  return parsed.data.experiments
}
