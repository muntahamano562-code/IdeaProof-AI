import { AnalysisSchema } from '../src/schemas/analysis.schema.js'

/**
 * Server-only analysis handler. Runs inside a Vercel Serverless Function
 * (api/analyze.js) and, during local development, inside a Vite dev-server
 * middleware. It never ships to the browser and only reads server-side env vars.
 *
 * IMPORTANT: The LLM prompt and the API key live here. Neither is ever sent to
 * the client. The handler returns ONLY the Zod-validated structured object.
 */

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
  "summary": string,                                   // 2-4 sentence plain-language summary of the idea
  "problemAnalysis": string,                           // is the problem real, painful, and frequent?
  "targetAudienceAnalysis": string,                    // who actually feels this, and how well-defined are they?
  "feasibilityAnalysis": string,                       // can this realistically be built? what is hard?
  "competitionAnalysis": string,                       // existing alternatives and differentiation
  "assumptions": [{ "assumption": string, "rationale": string }],   // key beliefs that must be true
  "risks": [{ "risk": string, "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "note": string }],
  "categoryScores": [{ "category": string, "score": number /*0-100*/, "explanation": string }],
  "overallScore": number,                              // 0-100 overall strength
  "confidence": number,                                // 0-100 in your assessment
  "mvpRecommendation": string,                         // what a first testable version should include
  "experiments": [{ "title": string, "successCriteria": string, "timeline": string }],
  "verdict": "BUILD"|"PIVOT"|"DON'T BUILD"             // current recommendation
}

Rules:
- Be honest and evidence-based. State uncertainty explicitly when you have none.
- Every score (overall and per-category) MUST include a written explanation.
- Do not invent facts, statistics, market sizes, or competitor names you cannot infer.
- Keep all content grounded in the idea provided. Avoid hype.
- Use the categories: Problem Clarity, Market, Feasibility, Differentiation, Momentum.`

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

function validateInput(body) {
  const errors = []
  if (!body || typeof body !== 'object') {
    return { errors: ['Invalid request body.'] }
  }
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description =
    typeof body.description === 'string' ? body.description.trim() : ''
  if (title.length < 3) errors.push('Title is too short.')
  if (description.length < 20) errors.push('Description is too short.')
  if (title.length > 5000 || description.length > 20000)
    errors.push('Input exceeds size limits.')
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
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try {
        data = JSON.parse(match[1])
      } catch {
        /* leave data undefined */
      }
    }
    if (!data) {
      throw new AnalysisError(502, 'The analysis result was not valid JSON.')
    }
  }
  const result = AnalysisSchema.safeParse(data)
  if (!result.success) {
    throw new AnalysisError(
      502,
      'The analysis result did not match the expected structure.',
    )
  }
  return result.data
}

async function callLLM(idea) {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    throw new AnalysisError(
      500,
      'The analysis service is not configured. Set LLM_API_KEY on the server.',
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
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(idea) },
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new AnalysisError(
        502,
        'The analysis provider returned an error. Please try again later.',
      )
    }
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (!content) {
      throw new AnalysisError(502, 'The analysis provider returned an empty response.')
    }
    return parseAndValidate(content)
  } catch (err) {
    if (err instanceof AnalysisError) throw err
    if (err && err.name === 'AbortError') {
      throw new AnalysisError(504, 'The analysis request timed out.')
    }
    throw new AnalysisError(502, 'Failed to reach the analysis provider.')
  } finally {
    clearTimeout(timeout)
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
  const { title, description, targetUsers, problem, errors } = validateInput(body)
  if (errors.length > 0) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: errors[0] }))
    return
  }

  try {
    const analysis = await callLLM({ title, description, targetUsers, problem })
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(analysis))
  } catch (err) {
    const status = err instanceof AnalysisError ? err.status : 500
    const message =
      err instanceof AnalysisError ? err.message : 'Unexpected analysis error.'
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: message }))
  }
}
