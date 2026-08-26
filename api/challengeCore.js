import {
  validateChallengeRequest,
  validateChallengesResponse,
  validateChallengeEvaluation,
} from '../src/schemas/challenge.schema.js'

class ChallengeError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const CHALLENGE_SYSTEM_PROMPT = `You are IdeaProof's skeptical challenger. You pressure-test a startup idea by asking hard questions about its assumptions, risks, and uncertainties.

You must output ONLY a single JSON object with this exact shape:

{
  "challenges": [
    {
      "id": "challenge-1",
      "question": "string",
      "target": "string",
      "rationale": "string"
    }
  ]
}

Rules:
- Produce between 3 and 5 challenges.
- Derive challenges from the provided idea and analysis.
- Do not invent unrelated concerns.
- Use relevant targets such as Problem validity, Target-user willingness, Differentiation, Feasibility, Acquisition, Monetization, Key assumption, Major risk.
- Questions must be answerable by the founder in a short written response.
- Use ids challenge-1, challenge-2, challenge-3 in order.
- Be skeptical, honest, respectful, and evidence-based.
- Do not invent facts, statistics, or research results.`

const EVALUATE_SYSTEM_PROMPT = `You are IdeaProof's skeptical challenger.

A founder has answered one challenge question. Your job is to argue the skeptical counter-position and explain whether their answer reduces the concern.

Output ONLY one JSON object with this exact shape:

{
  "challengeId": "string",
  "counterargument": "string",
  "addressedConcern": "string",
  "remainingConcern": "string",
  "assessmentChange": {
    "changed": true,
    "explanation": "string"
  },
  "nextAction": "string"
}

Rules:
- This is a simulation of skeptical scrutiny, not verified truth.
- Never claim that you verified anything.
- Do not assign or change numeric scores.
- If the answer is weak or off-topic, changed must be false.
- If the answer is strong and specific, changed may be true.
- Keep everything grounded in the idea and challenge.
- Do not invent facts or statistics.`

function buildChallengePrompt(idea, analysis) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'

  return `Here is the startup idea and its AI assessment.

Title:
${idea.title}

Description:
${idea.description}

Target users:
${targetUsers}

Problem being solved:
${problem}

AI assessment summary:
${analysis.summary}

Key assumptions:
${
  analysis.assumptions
    .map((a) => `- ${a.assumption}: ${a.rationale}`)
    .join('\n') || '- None listed'
}

Risks:
${
  analysis.risks
    .map((r) => `- [${r.severity}] ${r.risk}: ${r.note}`)
    .join('\n') || '- None listed'
}

Category scores:
${
  analysis.categoryScores
    .map(
      (c) =>
        `- ${c.category}: ${c.score}/100 — ${c.explanation}`,
    )
    .join('\n') || '- None listed'
}

Overall score:
${analysis.overallScore}/100

Confidence:
${analysis.confidence}/100

Verdict:
${analysis.verdict}

Return 3–5 skeptical challenge questions now.`
}

function buildEvaluatePrompt(idea, analysis, challenge, response) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'

  return `Startup idea context:

Title:
${idea.title}

Description:
${idea.description}

Target users:
${targetUsers}

Problem being solved:
${problem}

Original AI assessment:
${analysis.summary}

Original verdict:
${analysis.verdict}

Challenge being answered:
ID: ${challenge.id}
Question: ${challenge.question}
Target: ${challenge.target}
Rationale: ${challenge.rationale}

Founder's response:
"""
${response}
"""

Return the skeptical counterargument and assessment change now.`
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch {
        return {}
      }
    }

    return req.body
  }

  return await new Promise((resolve) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', () => {
      if (!data) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(data))
      } catch {
        resolve({})
      }
    })

    req.on('error', () => {
      resolve({})
    })
  })
}

function parseAndValidate(content, schema) {
  let data

  try {
    data = JSON.parse(content)
  } catch {
    const match = content.match(
      /```(?:json)?\s*([\s\S]*?)```/,
    )

    if (match) {
      try {
        data = JSON.parse(match[1])
      } catch {
        data = undefined
      }
    }

    if (!data) {
      throw new ChallengeError(
        502,
        'The challenge result was not valid JSON.',
      )
    }
  }

  const result = schema.safeParse(data)

  if (!result.success) {
    throw new ChallengeError(
      502,
      'The challenge result did not match the expected structure.',
    )
  }

  return result.data
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const hits = new Map()

function checkRateLimit() {
  const now = Date.now()

  const entries = (hits.get('global') || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  )

  if (entries.length >= RATE_LIMIT_MAX) {
    throw new ChallengeError(
      429,
      'Too many requests right now. Please wait a moment and try again.',
    )
  }

  entries.push(now)
  hits.set('global', entries)
}

/*
 * Gemini API
 *
 * Uses Google's Gemini Developer API.
 * The API key stays server-side.
 */
async function callLLM(messages) {
  const apiKey = process.env.LLM_API_KEY

  if (!apiKey) {
    throw new ChallengeError(
      500,
      'The challenge service is not configured. Set LLM_API_KEY on the server.',
    )
  }

  const model =
    process.env.LLM_MODEL || 'gemini-2.5-flash-lite'

  const baseUrl = (
    process.env.LLM_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta'
  ).replace(/\/$/, '')

  const controller = new AbortController()

  const timeout = set
