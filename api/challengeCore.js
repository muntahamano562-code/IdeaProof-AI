import {
  validateChallengeRequest,
  validateChallengesResponse,
  validateChallengeEvaluation,
} from '../src/schemas/challenge.schema.js'

/**
 * Server-only challenge handler. Runs inside a Vercel Serverless Function
 * (api/challenge.js) and, during local development, inside a Vite dev-server
 * middleware. The LLM prompt and API key live here and never reach the browser.
 *
 * Two actions:
 *  - `challenges`: produce 3–5 structured challenge questions from an idea + analysis
 *  - `evaluate`: take a user's response to one challenge and return a skeptical
 *    counterargument plus an explainable, non-definitive assessment change.
 *
 * IMPORTANT: responses are framed as a *simulation of skeptical scrutiny*, not
 * verified truth. No fake precision is added.
 */

class ChallengeError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const CHALLENGE_SYSTEM_PROMPT = `You are IdeaProof's skeptical challenger. You pressure-test a startup idea by asking hard questions about its assumptions, risks, and uncertainties. You must output ONLY a single JSON object (no markdown, no code fences, no commentary) matching this exact shape:

{
  "challenges": [
    {
      "id": "challenge-1",
      "question": string,   // a pointed, respectful skeptical question for the founder
      "target": string,     // short label of what it targets, e.g. "Problem validity", "Target-user willingness", "Differentiation", "Feasibility", "Acquisition", "Monetization", "Key assumption", "Major risk"
      "rationale": string    // why this matters / what weakness it probes
    }
  ]
}

Rules:
- Produce between 3 and 5 challenges.
- Derive each challenge from the provided idea and analysis (assumptions, risks, weak category scores, low confidence areas). Do NOT invent unrelated concerns.
- Target a mix of these categories where relevant: problem validity, target-user willingness, differentiation, feasibility, acquisition/distribution, monetization, key assumptions, major risks.
- Challenges must be answerable by the founder in a short written response.
- Use ids "challenge-1", "challenge-2", ... in order.
- Be honest and evidence-based. Avoid hype. Do not invent facts or statistics.`

const EVALUATE_SYSTEM_PROMPT = `You are IdeaProof's skeptical challenger. A founder has answered one of your challenge questions. Your job is to argue the skeptical counter-position and explain how (or whether) their answer moves the assessment. You must output ONLY a single JSON object (no markdown, no code fences, no commentary) matching this exact shape:

{
  "challengeId": string,            // the id of the challenge being answered
  "counterargument": string,        // the strongest skeptical rebuttal to the founder's answer
  "addressedConcern": string,       // what the answer convincingly addressed, if anything
  "remainingConcern": string,       // what still worries you / is still unresolved
  "assessmentChange": {
    "changed": boolean,             // did the concern materially shift because of the answer?
    "explanation": string            // plain-language explanation; never a precise metric
  },
  "nextAction": string              // one concrete validation step the founder should take next
}

Rules:
- This is a simulation of skeptical scrutiny, not verified truth. Never imply you verified anything.
- Do NOT assign or change numeric scores. Do NOT claim precise percentages.
- If the answer is weak or off-topic, set changed=false and explain what remains unconvincing.
- If the answer is strong and specific, set changed=true and explain, in plain language, how the concern appears reduced (e.g. "appears somewhat reduced").
- Keep every field grounded in the idea, the analysis, and the specific challenge. Avoid hype.`

function buildChallengePrompt(idea, analysis) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'
  return `Here is the startup idea and its AI assessment. Derive 3–5 challenge questions.

Title: ${idea.title}
Description: ${idea.description}
Target users: ${targetUsers}
Problem being solved: ${problem}

AI assessment (summary):
${analysis.summary}

Key assumptions:
${analysis.assumptions.map((a) => `- ${a.assumption}: ${a.rationale}`).join('\n') || '- None listed'}

Risks:
${analysis.risks.map((r) => `- [${r.severity}] ${r.risk}: ${r.note}`).join('\n') || '- None listed'}

Category scores:
${analysis.categoryScores.map((c) => `- ${c.category}: ${c.score}/100 — ${c.explanation}`).join('\n')}

Overall score: ${analysis.overallScore}/100 (confidence ${analysis.confidence}/100)
Verdict: ${analysis.verdict}

Return the challenge questions now.`
}

function buildEvaluatePrompt(idea, analysis, challenge, response) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'
  return `Startup idea context:

Title: ${idea.title}
Description: ${idea.description}
Target users: ${targetUsers}
Problem being solved: ${problem}

Original AI assessment summary: ${analysis.summary}
Verdict: ${analysis.verdict}

The challenge being answered:
- id: ${challenge.id}
- question: ${challenge.question}
- target: ${challenge.target}
- rationale: ${challenge.rationale}

The founder's response:
"""
${response}
"""

Return the skeptical counterargument and explain the (non-definitive) assessment change now.`
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
      if (!data) return resolve({})
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function parseAndValidate(content, schema) {
  let data
  try {
    data = JSON.parse(content)
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try {
        data = JSON.parse(match[1])
      } catch {
        /* leave data undefined */
      }
    }
    if (!data) {
      throw new ChallengeError(502, 'The challenge result was not valid JSON.')
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

// Lightweight in-process abuse protection. Not a substitute for platform-level
// rate limiting, but it keeps the endpoint from being hammered locally.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const hits = new Map()

function checkRateLimit() {
  const now = Date.now()
  const key = 'global'
  const entries = (hits.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (entries.length >= RATE_LIMIT_MAX) {
    throw new ChallengeError(
      429,
      'Too many requests right now. Please wait a moment and try again.',
    )
  }
  entries.push(now)
  hits.set(key, entries)
}

async function callLLM(messages) {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    throw new ChallengeError(
      500,
      'The challenge service is not configured. Set LLM_API_KEY on the server.',
    )
  }
  const baseUrl = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(
    /\/$/,
    '',
  )
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new ChallengeError(
        502,
        'The challenge provider returned an error. Please try again later.',
      )
    }
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (!content) {
      throw new ChallengeError(502, 'The challenge provider returned an empty response.')
    }
    return content
  } catch (err) {
    if (err instanceof ChallengeError) throw err
    if (err && err.name === 'AbortError') {
      throw new ChallengeError(504, 'The challenge request timed out.')
    }
    throw new ChallengeError(502, 'Failed to reach the challenge provider.')
  } finally {
    clearTimeout(timeout)
  }
}

export async function challengeHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed.' }))
    return
  }

  const body = await readBody(req)
  const parsed = validateChallengeRequest(body)
  if (!parsed.success) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid challenge request.' }))
    return
  }

  try {
    checkRateLimit()
    const { action } = parsed.data

    if (action === 'challenges') {
      const { idea, analysis } = parsed.data
      const content = await callLLM([
        { role: 'system', content: CHALLENGE_SYSTEM_PROMPT },
        { role: 'user', content: buildChallengePrompt(idea, analysis) },
      ])
      const challenges = parseAndValidate(content, validateChallengesResponse)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ challenges: challenges.challenges }))
      return
    }

    // action === 'evaluate'
    const { idea, analysis, challenge, response } = parsed.data
    const content = await callLLM([
      { role: 'system', content: EVALUATE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildEvaluatePrompt(idea, analysis, challenge, response),
      },
    ])
    const evaluation = parseAndValidate(content, validateChallengeEvaluation)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(evaluation))
    return
  } catch (err) {
    const status = err instanceof ChallengeError ? err.status : 500
    const message =
      err instanceof ChallengeError ? err.message : 'Unexpected challenge error.'
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: message }))
  }
}
