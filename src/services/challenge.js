import {
  validateChallengesResponse,
  validateChallengeEvaluation,
} from '../schemas/challenge.schema'

/**
 * Client-side calls to the server-side challenge route. The LLM key never leaves
 * the server; the browser only ever receives validated structured objects.
 */

function postChallenge(payload) {
  return fetch('/api/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

async function readJson(res) {
  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }
  return data
}

export async function fetchChallenges(idea, analysis) {
  const res = await postChallenge({
    action: 'challenges',
    idea: {
      title: idea.title,
      description: idea.description,
      targetUsers: idea.targetUsers,
      problem: idea.problem,
    },
    analysis,
  })

  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(
      data.error || 'Challenge questions could not be generated. Please try again.',
    )
  }

  const parsed = validateChallengesResponse(data)
  if (!parsed.success) {
    throw new Error('The challenge response was not in the expected format.')
  }
  return parsed.data.challenges
}

export async function evaluateChallenge(idea, analysis, challenge, response) {
  const res = await postChallenge({
    action: 'evaluate',
    idea: {
      title: idea.title,
      description: idea.description,
      targetUsers: idea.targetUsers,
      problem: idea.problem,
    },
    analysis,
    challenge,
    response,
  })

  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(
      data.error || 'We couldn’t evaluate this response right now. Please try again.',
    )
  }

  const parsed = validateChallengeEvaluation(data)
  if (!parsed.success) {
    throw new Error('The challenge response was not in the expected format.')
  }
  return parsed.data
}
