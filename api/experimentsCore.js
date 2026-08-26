import {
  validateExperimentRequest,
  validateExperimentsResponse,
} from '../src/schemas/experiment.schema.js'

/**
 * Server-only validation-plan handler. Runs inside a Vercel Serverless Function
 * (api/experiments.js) and, during local development, inside a Vite dev-server
 * middleware. The LLM prompt and key live here and never reach the browser.
 *
 * Input: an idea + its Phase 5 analysis. Output: a richer validation plan where
 * each experiment links to the assumptions/risks (assigned stable ids) it tests.
 *
 * This reuses the analysis — it does NOT re-run the full analysis engine.
 */

class ExperimentError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SYSTEM_PROMPT = `You are IdeaProof's validation planner. You turn a startup idea's assumptions and risks into concrete, real-world validation experiments. You must output ONLY a single JSON object (no markdown, no code fences, no commentary) matching this exact shape:

{
  "experiments": [
    {
      "id": "experiment-1",
      "hypothesis": string,        // the belief this experiment will test
      "method": string,            // how the founder will run it (interviews, landing page, prototype, etc.)
      "successCriteria": string,   // concrete, measurable proposed criteria (e.g. "At least 5 of 8 interviewed users name this as a current priority")
      "effort": "LOW"|"MEDIUM"|"HIGH",
      "timeline": string,          // rough timebox, e.g. "1–2 weeks"
      "assumptionIds": string[]    // ids of the assumptions/risks this tests (from the list provided)
    }
  ]
}

Rules:
- Produce 3–6 experiments.
- Each experiment MUST link to one or more provided assumption/risk ids via assumptionIds. If an experiment tests something not in the list, use an empty array.
- successCriteria must be specific and measurable, not vague ("users like it"). These are PROPOSED criteria for an experiment that has NOT been run yet — never imply the experiment has already been conducted or that results exist.
- Use ids "experiment-1", "experiment-2", ... in order.
- Be honest and grounded in the idea. Avoid hype. Do not invent facts, statistics, or research results.`

function buildPrompt(idea, analysis) {
  const targetUsers = idea.targetUsers?.trim() || 'Not provided'
  const problem = idea.problem?.trim() || 'Not provided'

  const assumptionRefs = analysis.assumptions.map(
    (a, i) => `assumption-${i + 1}: ${a.assumption}`,
  )
  const riskRefs = analysis.risks.map((r, i) => `risk-${i + 1}: ${r.risk}`)

  return `Startup idea:

Title: ${idea.title}
Description: ${idea.description}
Target users: ${targetUsers}
Problem being solved: ${problem}

AI assessment summary: ${analysis.summary}
Verdict: ${analysis.verdict}

Assumptions (use these ids in assumptionIds):
${assumptionRefs.join('\n') || '(none listed)'}

Risks (use these ids in assumptionIds):
${riskRefs.join('\n') || '(none listed)'}

Existing experiment hints from the analysis:
${analysis.experiments.map((e) => `- ${e.title} (success: ${e.successCriteria}; timeline: ${e.timeline})`).join('\n') || '(none)'}

Generate the validation experiments now.`
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
      throw new ExperimentError(502, 'The validation plan was not valid JSON.')
    }
  }
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ExperimentError(
      502,
      'The validation plan did not match the expected structure.',
    )
  }
  return result.data
}

// Lightweight in-process abuse protection (not a substitute for platform limits).
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const hits = new Map()

function checkRateLimit() {
  const now = Date.now()
  const entries = (hits.get('global') || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
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

async function callLLM(messages) {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    throw new ExperimentError(
      500,
      'The validation service is not configured. Set LLM_API_KEY on the server.',
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
      throw new ExperimentError(
        502,
        'The validation provider returned an error. Please try again later.',
      )
    }
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (!content) {
      throw new ExperimentError(502, 'The validation provider returned an empty response.')
    }
    return content
  } catch (err) {
    if (err instanceof ExperimentError) throw err
    if (err && err.name === 'AbortError') {
      throw new ExperimentError(504, 'The validation request timed out.')
    }
    throw new ExperimentError(502, 'Failed to reach the validation provider.')
  } finally {
    clearTimeout(timeout)
  }
}

// Keep only assumptionIds that reference real assumptions/risks, so a malformed
// or hallucinated id never reaches the UI.
function sanitizeLinks(experiments, analysis) {
  const validIds = new Set()
  analysis.assumptions.forEach((_, i) => validIds.add(`assumption-${i + 1}`))
  analysis.risks.forEach((_, i) => validIds.add(`risk-${i + 1}`))
  return experiments.map((exp) => ({
    ...exp,
    assumptionIds: (exp.assumptionIds || []).filter((id) => validIds.has(id)),
  }))
}

export async function experimentHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed.' }))
    return
  }

  const body = await readBody(req)
  const parsed = validateExperimentRequest(body)
  if (!parsed.success) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid validation request.' }))
    return
  }

  try {
    checkRateLimit()
    const { idea, analysis } = parsed.data
    const content = await callLLM([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(idea, analysis) },
    ])
    const result = parseAndValidate(content, validateExperimentsResponse)
    const experiments = sanitizeLinks(result.experiments, analysis)
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ experiments }))
  } catch (err) {
    const status = err instanceof ExperimentError ? err.status : 500
    const message =
      err instanceof ExperimentError ? err.message : 'Unexpected validation error.'
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: message }))
  }
}
