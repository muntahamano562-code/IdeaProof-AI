import { AnalysisSchema } from '../src/schemas/analysis.schema.js'

class AnalysisError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SYSTEM_PROMPT = `You are IdeaProof, a rigorous and skeptical startup-idea analyst.

Your job is to pressure-test an idea and return ONLY one valid JSON object.

The JSON must have exactly this structure:

{
  "summary": "string",
  "problemAnalysis": "string",
  "targetAudienceAnalysis": "string",
  "feasibilityAnalysis": "string",
  "competitionAnalysis": "string",
  "assumptions": [
    {
      "assumption": "string",
      "rationale": "string"
    }
  ],
  "risks": [
    {
      "risk": "string",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "note": "string"
    }
  ],
  "categoryScores": [
    {
      "category": "Problem Clarity",
      "score": 0,
      "explanation": "string"
    },
    {
      "category": "Market",
      "score": 0,
      "explanation": "string"
    },
    {
      "category": "Feasibility",
      "score": 0,
      "explanation": "string"
    },
    {
      "category": "Differentiation",
      "score": 0,
      "explanation": "string"
    },
    {
      "category": "Momentum",
      "score": 0,
      "explanation": "string"
    }
  ],
  "overallScore": 0,
  "confidence": 0,
  "mvpRecommendation": "string",
  "experiments": [
    {
      "title": "string",
      "successCriteria": "string",
      "timeline": "string"
    }
  ],
  "verdict": "BUILD|PIVOT|DON'T BUILD"
}

Rules:
- Be skeptical and honest.
- Do not invent statistics.
- Do not invent market sizes.
- Do not invent competitor names.
- Keep the assessment grounded in the supplied idea.
- Scores must be numbers from 0 to 100.
- Provide exactly the five categories listed above.
- Return JSON only.
- Do not use markdown.
- Do not use code fences.`

function buildPrompt(idea) {
  const targetUsers =
    idea.targetUsers?.trim() || 'Not provided'

  const problem =
    idea.problem?.trim() || 'Not provided'

  return `Analyze this startup idea.

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

    req.on('error', () => resolve({}))
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

  if (title.length < 3) {
    errors.push('Title is too short.')
  }

  if (description.length < 20) {
    errors.push('Description is too short.')
  }

  if (
    title.length > 5000 ||
    description.length > 20000
  ) {
    errors.push('Input exceeds size limits.')
  }

  return {
    errors,
    title,
    description,
    targetUsers: body.targetUsers,
    problem: body.problem,
  }
}

function parseAndValidate(content) {
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
        // Ignore and throw below.
      }
    }

    if (!data) {
      throw new AnalysisError(
        502,
        'The analysis result was not valid JSON.',
      )
    }
  }

  const result =
    AnalysisSchema.safeParse(data)

  if (!result.success) {
    console.error(
      'ANALYSIS SCHEMA ERROR:',
      JSON.stringify(
        result.error.format(),
        null,
        2,
      ),
    )

    throw new AnalysisError(
      502,
      'The analysis result did not match the expected structure.',
    )
  }

  return result.data
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20

const hits = new Map()

function checkRateLimit() {
  const now = Date.now()

  const entries =
    (hits.get('global') || []).filter(
      (time) =>
        now - time < RATE_LIMIT_WINDOW_MS,
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
  const apiKey =
    process.env.LLM_API_KEY

  if (!apiKey) {
    throw new AnalysisError(
      500,
      'The analysis service is not configured. Set LLM_API_KEY on the server.',
    )
  }

  const model =
    process.env.LLM_MODEL ||
    'gemini-2.5-flash'

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () => controller.abort(),
      60000,
    )

  try {
    const res = await fetch(url, {
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

    if (!res.ok) {
      const errorText =
        await res.text()

      console.error(
        'GEMINI PROVIDER ERROR:',
        res.status,
        errorText,
      )

      throw new AnalysisError(
        502,
        `The analysis provider returned an error (${res.status}): ${errorText}`,
      )
    }

    const json =
      await res.json()

    const content =
      json?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')

    if (!content) {
      console.error(
        'GEMINI EMPTY RESPONSE:',
        JSON.stringify(json),
      )

      throw new AnalysisError(
        502,
        'The analysis provider returned an empty response.',
      )
    }

    return parseAndValidate(content)
  } catch (err) {
    if (err instanceof AnalysisError) {
      throw err
    }

    if (
      err &&
      err.name === 'AbortError'
    ) {
      throw new AnalysisError(
        504,
        'The analysis request timed out.',
      )
    }

    console.error(
      'GEMINI CONNECTION ERROR:',
      err,
    )

    throw new AnalysisError(
      502,
      'Failed to reach the analysis provider.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function analyzeHandler(
  req,
  res,
) {
  if (
    req.method &&
    req.method !== 'POST'
  ) {
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

  const body =
    await readBody(req)

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

    const analysis =
      await callGemini({
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
  } catch (err) {
    const status =
      err instanceof AnalysisError
        ? err.status
        : 500

    const message =
      err instanceof AnalysisError
        ? err.message
        : 'Unexpected analysis error.'

    console.error(
      'ANALYSIS HANDLER ERROR:',
      err,
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
