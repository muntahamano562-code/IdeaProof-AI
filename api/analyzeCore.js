
import { AnalysisSchema } from '../src/schemas/analysis.schema.js'

/**
 * Server-only Gemini analysis handler.
 *
 * Runs inside:
 *   - Vercel Serverless Function: api/analyze.js
 *   - Vite dev-server middleware during local development
 *
 * Required server environment variable:
 *   GEMINI_API_KEY
 *
 * Gemini model:
 *   gemini-2.5-flash
 */

class AnalysisError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const GEMINI_MODEL = 'gemini-2.5-flash'

const SYSTEM_PROMPT = `You are IdeaProof, a rigorous and skeptical startup-idea analyst.

Your job is to pressure-test a startup idea and return a structured assessment.

You MUST output ONLY one valid JSON object.
Do NOT use markdown.
Do NOT use code fences.
Do NOT add commentary before or after the JSON.

The JSON must match this exact structure:

{
  "summary": "2-4 sentence plain-language summary of the idea",
  "problemAnalysis": "Analysis of whether the problem is real, painful, and frequent",
  "targetAudienceAnalysis": "Analysis of who actually experiences the problem and how well-defined the target users are",
  "feasibilityAnalysis": "Analysis of whether the idea can realistically be built and what may be difficult",
  "competitionAnalysis": "Analysis of existing alternatives and possible differentiation",
  "assumptions": [
    {
      "assumption": "A key belief that must be true",
      "rationale": "Why this belief matters"
    }
  ],
  "risks": [
    {
      "risk": "A specific risk",
      "severity": "LOW",
      "note": "Why this risk matters"
    }
  ],
  "categoryScores": [
    {
      "category": "Problem Clarity",
      "score": 0,
      "explanation": "Why this score was given"
    },
    {
      "category": "Market",
      "score": 0,
      "explanation": "Why this score was given"
    },
    {
      "category": "Feasibility",
      "score": 0,
      "explanation": "Why this score was given"
    },
    {
      "category": "Differentiation",
      "score": 0,
      "explanation": "Why this score was given"
    },
    {
      "category": "Momentum",
      "score": 0,
      "explanation": "Why this score was given"
    }
  ],
  "overallScore": 0,
  "confidence": 0,
  "mvpRecommendation": "What the first testable version should include",
  "experiments": [
    {
      "title": "Experiment name",
      "successCriteria": "Concrete proposed success criteria",
      "timeline": "Rough timebox"
    }
  ],
  "verdict": "BUILD"
}

Rules:

- Be skeptical, honest, and evidence-based.
- Do not blindly praise the idea.
- State uncertainty when information is missing.
- Do not invent statistics, market sizes, user counts, revenue figures, or research results.
- Do not invent competitor names unless they are obvious from the information provided.
- Keep every analysis grounded in the supplied idea.
- Category scores must be numbers from 0 to 100.
- overallScore must be a number from 0 to 100.
- confidence must be a number from 0 to 100.
- Every category score must have a written explanation.
- severity must be exactly one of: LOW, MEDIUM, HIGH, CRITICAL.
- verdict must be exactly one of: BUILD, PIVOT, DON'T BUILD.
- Produce 3 to 6 assumptions when possible.
- Produce 3 to 6 risks when possible.
- Produce 3 to 5 experiments when possible.
- Experiments must be proposed validation steps, not completed experiments.
- Never claim that an experiment has already been performed.
- Use these exact categories:
  Problem Clarity
  Market
  Feasibility
  Differentiation
  Momentum`

function buildPrompt(idea) {
  const targetUsers =
    typeof idea.targetUsers === 'string' && idea.targetUsers.trim()
      ? idea.targetUsers.trim()
      : 'Not provided'

  const problem =
    typeof idea.problem === 'string' && idea.problem.trim()
      ? idea.problem.trim()
      : 'Not provided'

  return `Analyze the following startup idea.

Title:
${idea.title}

Description:
${idea.description}

Target users:
${targetUsers}

Problem being solved:
${problem}

Return ONLY the required JSON object.`
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

function validateInput(body) {
  const errors = []

  if (!body || typeof body !== 'object') {
    return {
      errors: ['Invalid request body.'],
    }
  }

  const title =
    typeof body.title === 'string'
      ? body.title.trim()
      : ''

  const description =
    typeof body.description === 'string'
      ? body.description.trim()
      : ''

  const targetUsers =
    typeof body.targetUsers === 'string'
      ? body.targetUsers.trim()
      : ''

  const problem =
    typeof body.problem === 'string'
      ? body.problem.trim()
      : ''

  if (title.length < 3) {
    errors.push('Title is too short.')
  }

  if (description.length < 20) {
    errors.push('Description is too short.')
  }

  if (title.length > 5000 || description.length > 20000) {
    errors.push('Input exceeds size limits.')
  }

  if (targetUsers.length > 10000 || problem.length > 10000) {
    errors.push('Input exceeds size limits.')
  }

  return {
    errors,
    title,
    description,
    targetUsers,
    problem,
  }
}

function extractJson(text) {
  if (!text || typeof text !== 'string') {
    throw new AnalysisError(
      502,
      'The analysis provider returned an empty response.',
    )
  }

  const cleaned = text.trim()

  // First try the response directly.
  try {
    return JSON.parse(cleaned)
  } catch {
    // Continue below.
  }

  // Remove markdown code fences if Gemini unexpectedly adds them.
  const fencedMatch = cleaned.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i,
  )

  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1].trim())
    } catch {
      // Continue below.
    }
  }

  // Try extracting the first JSON object.
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const possibleJson = cleaned.slice(
      firstBrace,
      lastBrace + 1,
    )

    try {
      return JSON.parse(possibleJson)
    } catch {
      // Continue below.
    }
  }

  throw new AnalysisError(
    502,
    'The analysis result was not valid JSON.',
  )
}

function parseAndValidate(content) {
  const data = extractJson(content)

  const result = AnalysisSchema.safeParse(data)

  if (!result.success) {
    console.error(
      'Analysis schema validation failed:',
      result.error?.issues || result.error,
    )

    throw new AnalysisError(
      502,
      'The analysis result did not match the expected structure.',
    )
  }

  return result.data
}

// Lightweight in-process rate limiting.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20

const hits = new Map()

function checkRateLimit() {
  const now = Date.now()

  const entries = (hits.get('global') || []).filter(
    (timestamp) =>
      now - timestamp < RATE_LIMIT_WINDOW_MS,
  )

  if (entries.length >= RATE_LIMIT_MAX) {
    throw new AnalysisError(
      429,
      'Too many requests right now. Please wait a moment and try again.',
    )
  }

  entries.push(now)

  hits.set('global', entries)
}

async function callGemini(idea) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new AnalysisError(
      500,
      'The analysis service is not configured. Set GEMINI_API_KEY on the server.',
    )
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`

  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, 60000)

  try {
    const response = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },

        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildPrompt(idea),
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),

      signal: controller.signal,
    })

    const responseText = await response.text()

    let json

    try {
      json = JSON.parse(responseText)
    } catch {
      console.error(
        'Gemini returned non-JSON HTTP response:',
        responseText,
      )

      throw new AnalysisError(
        502,
        'The analysis provider returned an invalid response.',
      )
    }

    if (!response.ok) {
      console.error(
        'Gemini API error:',
        JSON.stringify(json),
      )

      const providerMessage =
        json?.error?.message ||
        'The Gemini provider returned an error.'

      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 403
      ) {
        throw new AnalysisError(
          502,
          `Gemini API error: ${providerMessage}`,
        )
      }

      if (response.status === 429) {
        throw new AnalysisError(
          502,
          `Gemini quota/rate-limit error: ${providerMessage}`,
        )
      }

      throw new AnalysisError(
        502,
        `The Gemini provider returned an error: ${providerMessage}`,
      )
    }

    const content =
      json?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || '')
        .join('')

    if (!content) {
      console.error(
        'Gemini response did not contain text:',
        JSON.stringify(json),
      )

      throw new AnalysisError(
        502,
        'The Gemini provider returned an empty response.',
      )
    }

    return parseAndValidate(content)
  } catch (error) {
    if (error instanceof AnalysisError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new AnalysisError(
        504,
        'The analysis request timed out.',
      )
    }

    console.error(
      'Gemini request failed:',
      error,
    )

    throw new AnalysisError(
      502,
      'Failed to reach the Gemini analysis provider.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function analyzeHandler(req, res) {
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

  const {
    title,
    description,
    targetUsers,
    problem,
    errors,
  } = validateInput(body)

  if (errors.length > 0) {
    res.statusCode = 400

    res.setHeader(
      'Content-Type',
      'application/json',
    )

    res.end(
      JSON.stringify({
        error: errors[0],
      }),
    )

    return
  }

  try {
    checkRateLimit()

    const analysis = await callGemini({
      title,
      description,
      targetUsers,
      problem,
    })

    res.statusCode = 200

    res.setHeader(
      'Content-Type',
      'application/json',
    )

    res.end(
      JSON.stringify(analysis),
    )
  } catch (error) {
    const status =
      error instanceof AnalysisError
        ? error.status
        : 500

    const message =
      error instanceof AnalysisError
        ? error.message
        : 'Unexpected analysis error.'

    console.error(
      'Analysis handler error:',
      error,
    )

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

