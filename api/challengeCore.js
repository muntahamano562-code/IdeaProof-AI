import {
  validateChallengeRequest,
  validateChallengesResponse,
  validateChallengeEvaluation,
} from '../src/schemas/challenge.schema.js'

/**
 * IdeaProof AI — Skeptical Challenge Service
 *
 * Server-side only.
 * Uses Gemini through Google's OpenAI-compatible API endpoint.
 *
 * Required Vercel environment variables:
 *
 * LLM_API_KEY
 * LLM_MODEL
 * LLM_BASE_URL
 */

class ChallengeError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const CHALLENGE_SYSTEM_PROMPT = `
You are IdeaProof's skeptical startup-idea challenger.

Your job is to pressure-test a startup idea by asking hard but useful
questions about its assumptions, risks, uncertainties, target users,
differentiation, feasibility, acquisition, and monetization.

Return ONLY valid JSON.

Required JSON shape:

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
- Use ids challenge-1, challenge-2, challenge-3, etc.
- Questions must be specific to the supplied idea and analysis.
- Do not invent facts, statistics, research, or market data.
- Do not claim that anything has been verified.
- Questions should be answerable by the founder in a short written response.
- Focus on important assumptions and risks.
- Be skeptical but respectful.
- Return JSON only.
`

const EVALUATE_SYSTEM_PROMPT = `
You are IdeaProof's skeptical startup-idea challenger.

A founder has answered one challenge question.

Your job is to provide:
1. The strongest skeptical counterargument.
2. What the founder's answer addressed.
3. What remains unresolved.
4. Whether the concern appears materially reduced.
5. One concrete next validation action.

Return ONLY valid JSON.

Required JSON shape:

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
- This is simulated skeptical scrutiny.
- Never claim that you verified facts.
- Never assign numeric scores.
- Never invent statistics or research.
- If the founder's answer is weak or vague, changed should be false.
- If the founder's answer is specific and convincing, changed may be true.
- Keep the response grounded in the supplied idea and challenge.
- Return JSON only.
`

function buildChallengePrompt(idea, analysis) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'

  const assumptions = Array.isArray(analysis.assumptions)
    ? analysis.assumptions
        .map(
          (a, index) =>
            `- assumption-${index + 1}: ${a.assumption} — ${a.rationale}`,
        )
        .join('\n')
    : '- None listed'

  const risks = Array.isArray(analysis.risks)
    ? analysis.risks
        .map(
          (r, index) =>
            `- risk-${index + 1}: [${r.severity}] ${r.risk} — ${r.note}`,
        )
        .join('\n')
    : '- None listed'

  const categoryScores = Array.isArray(analysis.categoryScores)
    ? analysis.categoryScores
        .map(
          (c) =>
            `- ${c.category}: ${c.score}/100 — ${c.explanation}`,
        )
        .join('\n')
    : '- None listed'

  return `
Startup idea:

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
${assumptions}

Risks:
${risks}

Category scores:
${categoryScores}

Overall score:
${analysis.overallScore}/100

Confidence:
${analysis.confidence}/100

Verdict:
${analysis.verdict}

Create 3 to 5 skeptical challenge questions based only on this information.

Return JSON only.
`
}

function buildEvaluatePrompt(idea, analysis, challenge, response) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'

  return `
Startup idea:

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

Challenge:

ID:
${challenge.id}

Question:
${challenge.question}

Target:
${challenge.target}

Rationale:
${challenge.rationale}

Founder response:
${response}

Evaluate the founder's response from a skeptical perspective.

Return JSON only.
`
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
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/i)

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

async function callLLM(messages) {
  const apiKey = process.env.LLM_API_KEY

  if (!apiKey) {
    throw new ChallengeError(
      500,
      'The challenge service is not configured. Set LLM_API_KEY on the server.',
    )
  }

  const baseUrl = (
    process.env.LLM_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta/openai'
  ).replace(/\/$/, '')

  const model =
    process.env.LLM_MODEL || 'gemini-2.5-flash'

  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, 60000)

  try {
    const response = await fetch(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,

          response_format: {
            type: 'json_object',
          },
        }),

        signal: controller.signal,
      },
    )

    const responseText = await response.text()

    if (!response.ok) {
      let providerMessage =
        'The challenge provider returned an error.'

      try {
        const errorJson = JSON.parse(responseText)

        providerMessage =
          errorJson?.error?.message ||
          errorJson?.message ||
          providerMessage
      } catch {
        if (responseText) {
          providerMessage = responseText
        }
      }

      throw new ChallengeError(
        502,
        `The challenge provider returned an error (${response.status}): ${providerMessage}`,
      )
    }

    let json

    try {
      json = JSON.parse(responseText)
    } catch {
      throw new ChallengeError(
        502,
        'The challenge provider returned invalid JSON.',
      )
    }

    const content =
      json?.choices?.[0]?.message?.content

    if (!content) {
      throw new ChallengeError(
        502,
        'The challenge provider returned an empty response.',
      )
    }

    return content
  } catch (error) {
    if (error instanceof ChallengeError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new ChallengeError(
        504,
        'The challenge request timed out.',
      )
    }

    throw new ChallengeError(
      502,
      'Failed to reach the Gemini challenge provider.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

function sanitizeChallenges(challenges) {
  return challenges.map((challenge, index) => ({
    id: `challenge-${index + 1}`,
    question: challenge.question,
    target: challenge.target,
    rationale: challenge.rationale,
  }))
}

export async function challengeHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.statusCode = 405

    res.setHeader(
      'Content-Type',
      'application/json',
    )

    res.end(
      JSON.stringify({
        error: 'Method not allowed.',
      }),
    )

    return
  }

  const body = await readBody(req)

  const parsed = validateChallengeRequest(body)

  if (!parsed.success) {
    res.statusCode = 400

    res.setHeader(
      'Content-Type',
      'application/json',
    )

    res.end(
      JSON.stringify({
        error: 'Invalid challenge request.',
      }),
    )

    return
  }

  try {
    checkRateLimit()

    const { action } = parsed.data

    if (action === 'challenges') {
      const {
        idea,
        analysis,
      } = parsed.data

      const content = await callLLM([
        {
          role: 'system',
          content: CHALLENGE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildChallengePrompt(
            idea,
            analysis,
          ),
        },
      ])

      const result = parseAndValidate(
        content,
        validateChallengesResponse,
      )

      const challenges = sanitizeChallenges(
        result.challenges,
      )

      res.statusCode = 200

      res.setHeader(
        'Content-Type',
        'application/json',
      )

      res.end(
        JSON.stringify({
          challenges,
        }),
      )

      return
    }

    if (action === 'evaluate') {
      const {
        idea,
        analysis,
        challenge,
        response,
      } = parsed.data

      const content = await callLLM([
        {
          role: 'system',
          content: EVALUATE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildEvaluatePrompt(
            idea,
            analysis,
            challenge,
            response,
          ),
        },
      ])

      const evaluation = parseAndValidate(
        content,
        validateChallengeEvaluation,
      )

      res.statusCode = 200

      res.setHeader(
        'Content-Type',
        'application/json',
      )

      res.end(
        JSON.stringify(evaluation),
      )

      return
    }

    throw new ChallengeError(
      400,
      'Unsupported challenge action.',
    )
  } catch (error) {
    const status =
      error instanceof ChallengeError
        ? error.status
        : 500

    const message =
      error instanceof ChallengeError
        ? error.message
        : 'Unexpected challenge error.'

    res.statusCode = status

    res.setHeader(
      'Content-Type',
      'application/json',
    )

    res.end(
      JSON.stringify({
        error: message,
      }),
    )
  }
        }
