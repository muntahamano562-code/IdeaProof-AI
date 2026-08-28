import { AnalysisSchema } from '../src/schemas/analysis.schema.js'

class AnalysisError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SYSTEM_PROMPT = `You are IdeaProof, a rigorous and skeptical startup-idea analyst.

Your job is to pressure-test a startup idea and return ONLY valid JSON.

Analyze:
- problem clarity
- target audience
- market potential
- feasibility
- differentiation
- momentum

Be honest and skeptical. Do not invent facts, statistics, market sizes, or competitor names.

Return exactly this structure:

{
  "summary": "2-4 sentence summary",
  "problemAnalysis": "analysis of whether the problem is real, painful and frequent",
  "targetAudienceAnalysis": "analysis of target users",
  "feasibilityAnalysis": "analysis of whether the idea can realistically be built",
  "competitionAnalysis": "analysis of alternatives and differentiation",
  "assumptions": [
    {
      "assumption": "key belief",
      "rationale": "why this belief matters"
    }
  ],
  "risks": [
    {
      "risk": "risk description",
      "severity": "LOW",
      "note": "why this is a risk"
    }
  ],
  "categoryScores": [
    {
      "category": "Problem Clarity",
      "score": 0,
      "explanation": "reason for score"
    },
    {
      "category": "Market",
      "score": 0,
      "explanation": "reason for score"
    },
    {
      "category": "Feasibility",
      "score": 0,
      "explanation": "reason for score"
    },
    {
      "category": "Differentiation",
      "score": 0,
      "explanation": "reason for score"
    },
    {
      "category": "Momentum",
      "score": 0,
      "explanation": "reason for score"
    }
  ],
  "overallScore": 0,
  "confidence": 0,
  "mvpRecommendation": "recommended first testable version",
  "experiments": [
    {
      "title": "experiment",
      "successCriteria": "measurable proposed success criteria",
      "timeline": "rough timeline"
    }
  ],
  "verdict": "BUILD"
}

Rules:
- Scores must be integers from 0 to 100.
- verdict must be exactly BUILD, PIVOT, or DON'T BUILD.
- risk severity must be LOW, MEDIUM, HIGH, or CRITICAL.
- Create 3 to 5 assumptions when appropriate.
- Create 3 to 5 risks when appropriate.
- Create 3 to 5 experiments when appropriate.
- Experiments are proposed validation steps. Never claim they have already happened.
- Do not invent research results.
- Do not use markdown.
- Return JSON only.`

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    problemAnalysis: { type: 'STRING' },
    targetAudienceAnalysis: { type: 'STRING' },
    feasibilityAnalysis: { type: 'STRING' },
    competitionAnalysis: { type: 'STRING' },

    assumptions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          assumption: { type: 'STRING' },
          rationale: { type: 'STRING' },
        },
        required: ['assumption', 'rationale'],
      },
    },

    risks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          risk: { type: 'STRING' },
          severity: {
            type: 'STRING',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          },
          note: { type: 'STRING' },
        },
        required: ['risk', 'severity', 'note'],
      },
    },

    categoryScores: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          category: { type: 'STRING' },
          score: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
        },
        required: ['category', 'score', 'explanation'],
      },
    },

    overallScore: { type: 'INTEGER' },
    confidence: { type: 'INTEGER' },
    mvpRecommendation: { type: 'STRING' },

    experiments: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          successCriteria: { type: 'STRING' },
          timeline: { type: 'STRING' },
        },
        required: ['title', 'successCriteria', 'timeline'],
      },
    },

    verdict: {
      type: 'STRING',
      enum: ['BUILD', 'PIVOT', "DON'T BUILD"],
    },
  },

  required: [
    'summary',
    'problemAnalysis',
    'targetAudienceAnalysis',
    'feasibilityAnalysis',
    'competitionAnalysis',
    'assumptions',
    'risks',
    'categoryScores',
    'overallScore',
    'confidence',
    'mvpRecommendation',
    'experiments',
    'verdict',
  ],
}

function buildPrompt(idea) {
  return `Analyze this startup idea.

Title:
${idea.title}

Description:
${idea.description}

Target users:
${idea.targetUsers?.trim() || 'Not provided'}

Problem being solved:
${idea.problem?.trim() || 'Not provided'}

Pressure-test the idea now.`
}

async function callGemini(idea) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new AnalysisError(
      500,
      'The analysis service is not configured. Set GEMINI_API_KEY on the server.',
    )
  }

  const model =
    process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },

        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(idea) }],
          },
        ],

        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),

      signal: controller.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      const providerMessage =
        data?.error?.message || 'Unknown Gemini API error.'

      throw new AnalysisError(
        response.status === 429 ? 429 : 502,
        `Gemini provider error (${response.status}): ${providerMessage}`,
      )
    }

    const content =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')

    if (!content) {
      throw new AnalysisError(
        502,
        'Gemini returned an empty analysis response.',
      )
    }

    let parsed

    try {
      parsed = JSON.parse(content)
    } catch {
      throw new AnalysisError(
        502,
        'Gemini returned invalid JSON.',
      )
    }

    const result = AnalysisSchema.safeParse(parsed)

    if (!result.success) {
      console.error('Analysis schema error:', result.error)

      throw new AnalysisError(
        502,
        'Gemini returned an analysis with an unexpected structure.',
      )
    }

    return result.data
  } catch (error) {
    if (error instanceof AnalysisError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new AnalysisError(
        504,
        'The Gemini analysis request timed out.',
      )
    }

    console.error('Gemini analysis error:', error)

    throw new AnalysisError(
      502,
      'Failed to reach the Gemini analysis provider.',
    )
  } finally {
    clearTimeout(timeout)
  }
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
    return {
      errors: ['Title is too short.'],
    }
  }

  if (description.length < 20) {
    return {
      errors: ['Description is too short.'],
    }
  }

  if (title.length > 5000 || description.length > 20000) {
    return {
      errors: ['Input exceeds size limits.'],
    }
  }

  return {
    errors: [],
    title,
    description,
    targetUsers: body.targetUsers,
    problem: body.problem,
  }
}

export async function analyzeHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed.' }))
    return
  }

  const body = await readBody(req)

  const validation = validateInput(body)

  if (validation.errors.length > 0) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: validation.errors[0],
      }),
    )
    return
  }

  try {
    const analysis = await callGemini({
      title: validation.title,
      description: validation.description,
      targetUsers: validation.targetUsers,
      problem: validation.problem,
    })

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(analysis))
  } catch (error) {
    const status =
      error instanceof AnalysisError
        ? error.status
        : 500

    const message =
      error instanceof AnalysisError
        ? error.message
        : 'Unexpected analysis error.'

    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: message }))
  }
}
