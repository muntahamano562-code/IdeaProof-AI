import { AnalysisSchema } from '../src/schemas/analysis.schema.js'

class AnalysisError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SYSTEM_PROMPT = `You are IdeaProof, a rigorous and skeptical startup-idea analyst.

Your job is to pressure-test an idea and return a structured assessment. You must
output ONLY a single JSON object (no markdown, no code fences, no commentary)
that matches this exact shape:

{
  "summary": string,
  "problemAnalysis": string,
  "targetAudienceAnalysis": string,
  "feasibilityAnalysis": string,
  "competitionAnalysis": string,
  "assumptions": [{ "assumption": string, "rationale": string }],
  "risks": [{ "risk": string, "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "note": string }],
  "categoryScores": [{ "category": string, "score": number, "explanation": string }],
  "overallScore": number,
  "confidence": number,
  "mvpRecommendation": string,
  "experiments": [{ "title": string, "successCriteria": string, "timeline": string }],
  "verdict": "BUILD"|"PIVOT"|"DON'T BUILD"
}

Rules:
- Be honest and evidence-based.
- State uncertainty explicitly when appropriate.
- Every score must include a written explanation.
- Do not invent facts, statistics, market sizes, or competitor names.
- Keep everything grounded in the idea provided.
- Avoid hype.
- Use these categories exactly:
  Problem Clarity, Market, Feasibility, Differentiation, Momentum.`

function buildPrompt(idea) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'

  return `Analyze the following startup idea.

Title: ${idea.title}
Description: ${idea.description}
Target users: ${targetUsers}
Problem being solved: ${problem}

Return the structured analysis now.`
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

  if (title.length > 5000 || description.length > 20000) {
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
        // Continue to validation error below.
      }
    }

    if (!data) {
      throw new AnalysisError(
        502,
        'The analysis result was not valid JSON.',
      )
    }
  }

  const result = AnalysisSchema.safeParse(data)

  if (!result.success) {
    console.error(
      'ANALYSIS SCHEMA ERROR:',
      JSON.stringify(result.error.format(), null, 2),
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

  const entries = (hits.get('global') || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
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

async function callLLM(idea) {
  const apiKey = process.env.LLM_API_KEY

  if (!apiKey) {
    throw new AnalysisError(
      500,
      'The analysis service is not configured. Set LLM_API_KEY on the server.',
    )
  }

  const baseUrl = (
    process.env.LLM_BASE_URL ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '')

  const model =
    process.env.LLM_MODEL ||
    'gpt-4o-mini'

  const controller = new AbortController()

  const timeout = setTimeout(
    () => controller.abort(),
    60000,
  )

  try {
    const res = await fetch(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          model,

          response_format: {
            type: 'json_object',
          },

          temperature: 0.3,

          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: buildPrompt(idea),
            },
          ],
        }),

        signal: controller.signal,
      },
    )

    if (!res.ok) {
      const errorText = await res.text()

      console.error(
        'LLM PROVIDER ERROR:',
        res.status,
        errorText,
      )

      throw new AnalysisError(
        502,
        `The analysis provider returned an error (${res.status}): ${errorText}`,
      )
    }

    const json = await res.json()

    const content =
      json?.choices?.[0]?.message?.content

    if (!content) {
      console.error(
        'LLM EMPTY RESPONSE:',
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

    if (err && err.name === 'AbortError') {
      throw new AnalysisError(
        504,
        'The analysis request timed out.',
      )
    }

    console.error(
      'LLM CONNECTION ERROR:',
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

    const analysis = await callLLM({
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
