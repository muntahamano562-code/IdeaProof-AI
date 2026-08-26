import {
  validateExperimentRequest,
  validateExperimentsResponse,
} from '../src/schemas/experiment.schema.js'

/**
 * IdeaProof AI — Validation Experiments API
 *
 * Uses Google Gemini API through its OpenAI-compatible endpoint.
 * The API key stays server-side in Vercel environment variables.
 */

class ExperimentError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SYSTEM_PROMPT = `You are IdeaProof's validation planner.

Your job is to turn a startup idea's assumptions and risks into concrete,
real-world validation experiments.

Return ONLY one valid JSON object.

Required shape:

{
  "experiments": [
    {
      "id": "experiment-1",
      "hypothesis": "string",
      "method": "string",
      "successCriteria": "string",
      "effort": "LOW" | "MEDIUM" | "HIGH",
      "timeline": "string",
      "assumptionIds": ["assumption-1"]
    }
  ]
}

Rules:

- Produce 3 to 6 experiments.
- Every experiment must test one or more provided assumptions or risks.
- Use only assumption IDs and risk IDs that were provided.
- successCriteria must be concrete and measurable.
- Do not pretend that an experiment has already been performed.
- Do not invent research, statistics, users, competitors, or results.
- Keep experiments practical for an early-stage founder.
- Prefer interviews, surveys, prototypes, landing pages, manual tests,
  pre-orders, usability tests, and small validation experiments.
- Use IDs experiment-1, experiment-2, experiment-3, etc.
- Be skeptical and honest.
- Return JSON only.`

function buildPrompt(idea, analysis) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'

  const assumptionRefs = Array.isArray(analysis.assumptions)
    ? analysis.assumptions.map(
        (a, i) => `assumption-${i + 1}: ${a.assumption}`,
      )
    : []

  const riskRefs = Array.isArray(analysis.risks)
    ? analysis.risks.map((r, i) => `risk-${i + 1}: ${r.risk}`)
    : []

  const existingExperiments = Array.isArray(analysis.experiments)
    ? analysis.experiments
        .map(
          (e) =>
            `- ${e.title} (success: ${e.successCriteria}; timeline: ${e.timeline})`,
        )
        .join('\n')
    : '(none)'

  return `Create a validation plan for this startup idea.

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

Verdict:
${analysis.verdict}

Assumptions:
${assumptionRefs.join('\n') || '(none listed)'}

Risks:
${riskRefs.join('\n') || '(none listed)'}

Existing experiment hints:
${existingExperiments}

Generate 3–6 practical validation experiments.

Remember:
- Use the provided assumption/risk IDs.
- Do not claim validation has already happened.
- Return JSON only.`
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

    req.on('error', () => resolve({}))
  })
}

function parseAndValidate(content) {
  let data

  try {
    data = JSON.parse(content)
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)

    if (match) {
      try {
        data = JSON.parse(match[1])
      } catch {
        data = undefined
      }
    }

    if (!data) {
      throw new ExperimentError(
        502,
        'The validation plan was not valid JSON.',
      )
    }
  }

  const result = validateExperimentsResponse(data)

  if (!result.success) {
    throw new ExperimentError(
      502,
      'The validation plan did not match the expected structure.',
    )
  }

  return result.data
}

/*
 * Lightweight rate limiting.
 */
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const hits = new Map()

function checkRateLimit() {
  const now = Date.now()

  const entries = (hits.get('global') || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  )

  if (entries.length >= RATE_LIMIT_MAX) {
    throw new ExperimentError(
      429,
      'Too many requests right now. Please wait a moment and try again.',
    )
  }

  entries.push(now)
  hits.set('global', entries)
}

/*
 * Gemini API through Google's OpenAI-compatible endpoint.
 */
async function callLLM(messages) {
  const apiKey = process.env.LLM_API_KEY

  if (!apiKey) {
    throw new ExperimentError(
      500,
      'The validation service is not configured. Set LLM_API_KEY on Vercel.',
    )
  }

  const baseUrl = (
    process.env.LLM_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta/openai'
  ).replace(/\/$/, '')

  const model = process.env.LLM_MODEL || 'gemini-3.7-flash'

  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, 60000)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
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
    })

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = 'The validation provider returned an error.'

      try {
        const errorJson = JSON.parse(responseText)

        errorMessage =
          errorJson?.error?.message ||
          errorJson?.message ||
          errorMessage
      } catch {
        if (responseText) {
          errorMessage = responseText
        }
      }

      throw new ExperimentError(
        502,
        `The validation provider returned an error (${response.status}): ${errorMessage}`,
      )
    }

    let json

    try {
      json = JSON.parse(responseText)
    } catch {
      throw new ExperimentError(
        502,
        'The validation provider returned invalid JSON.',
      )
    }

    const content = json?.choices?.[0]?.message?.content

    if (!content) {
      throw new ExperimentError(
        502,
        'The validation provider returned an empty response.',
      )
    }

    return content
  } catch (error) {
    if (error instanceof ExperimentError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new ExperimentError(
        504,
        'The validation request timed out.',
      )
    }

    throw new ExperimentError(
      502,
      'Failed to reach the Gemini validation provider.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

/*
 * Remove hallucinated assumption/risk IDs.
 */
function sanitizeLinks(experiments, analysis) {
  const validIds = new Set()

  if (Array.isArray(analysis.assumptions)) {
    analysis.assumptions.forEach((_, index) => {
      validIds.add(`assumption-${index + 1}`)
    })
  }

  if (Array.isArray(analysis.risks)) {
    analysis.risks.forEach((_, index) => {
      validIds.add(`risk-${index + 1}`)
    })
  }

  return experiments.map((experiment) => ({
    ...experiment,

    assumptionIds: Array.isArray(experiment.assumptionIds)
      ? experiment.assumptionIds.filter((id) => validIds.has(id))
      : [],
  }))
}

export async function experimentHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')

    res.end(
      JSON.stringify({
        error: 'Method not allowed.',
      }),
    )

    return
  }

  const body = await readBody(req)

  const parsed = validateExperimentRequest(body)

  if (!parsed.success) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')

    res.end(
      JSON.stringify({
        error: 'Invalid validation request.',
      }),
    )

    return
  }

  try {
    checkRateLimit()

    const { idea, analysis } = parsed.data

    const content = await callLLM([
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },

      {
        role: 'user',
        content: buildPrompt(idea, analysis),
      },
    ])

    const result = parseAndValidate(content)

    const experiments = sanitizeLinks(
      result.experiments,
      analysis,
    )

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')

    res.end(
      JSON.stringify({
        experiments,
      }),
    )
  } catch (error) {
    const status =
      error instanceof ExperimentError
        ? error.status
        : 500

    const message =
      error instanceof ExperimentError
        ? error.message
        : 'Unexpected validation error.'

    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')

    res.end(
      JSON.stringify({
        error: message,
      }),
    )
  }
    }
