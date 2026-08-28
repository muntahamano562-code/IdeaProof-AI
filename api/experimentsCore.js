import {
  validateExperimentRequest,
  validateExperimentsResponse,
} from '../src/schemas/experiment.schema.js'

class ExperimentError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const SYSTEM_PROMPT = `You are IdeaProof's validation planner.

Turn a startup idea's assumptions and risks into practical validation experiments.

Return ONLY valid JSON:

{
  "experiments": [
    {
      "id": "experiment-1",
      "hypothesis": "belief being tested",
      "method": "how to run the experiment",
      "successCriteria": "specific measurable proposed criteria",
      "effort": "LOW",
      "timeline": "rough timebox",
      "assumptionIds": ["assumption-1"]
    }
  ]
}

Rules:
- Produce 3 to 6 experiments.
- IDs must be experiment-1, experiment-2, etc.
- Link experiments to provided assumption/risk IDs.
- successCriteria must be measurable.
- These experiments are proposed and have NOT been conducted.
- Never invent results.
- Never invent statistics.
- Do not use markdown.`

const RESPONSE_SCHEMA = {
  type: 'OBJECT',

  properties: {
    experiments: {
      type: 'ARRAY',

      items: {
        type: 'OBJECT',

        properties: {
          id: {
            type: 'STRING',
          },

          hypothesis: {
            type: 'STRING',
          },

          method: {
            type: 'STRING',
          },

          successCriteria: {
            type: 'STRING',
          },

          effort: {
            type: 'STRING',
            enum: ['LOW', 'MEDIUM', 'HIGH'],
          },

          timeline: {
            type: 'STRING',
          },

          assumptionIds: {
            type: 'ARRAY',
            items: {
              type: 'STRING',
            },
          },
        },

        required: [
          'id',
          'hypothesis',
          'method',
          'successCriteria',
          'effort',
          'timeline',
          'assumptionIds',
        ],
      },
    },
  },

  required: ['experiments'],
}

function buildPrompt(idea, analysis) {
  const targetUsers =
    idea.targetUsers?.trim() ||
    'Not provided'

  const problem =
    idea.problem?.trim() ||
    'Not provided'

  const assumptions =
    analysis.assumptions
      ?.map(
        (a, index) =>
          `assumption-${index + 1}: ${a.assumption}`,
      )
      .join('\n') || '(none)'

  const risks =
    analysis.risks
      ?.map(
        (r, index) =>
          `risk-${index + 1}: ${r.risk}`,
      )
      .join('\n') || '(none)'

  const existingExperiments =
    analysis.experiments
      ?.map(
        (e) =>
          `- ${e.title} | success: ${e.successCriteria} | timeline: ${e.timeline}`,
      )
      .join('\n') || '(none)'

  return `Create a practical validation plan.

Startup idea:

Title:
${idea.title}

Description:
${idea.description}

Target users:
${targetUsers}

Problem:
${problem}

AI assessment summary:
${analysis.summary}

Verdict:
${analysis.verdict}

Assumptions:
${assumptions}

Risks:
${risks}

Existing experiment ideas:
${existingExperiments}

Create the validation experiments now.`
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

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new ExperimentError(
      500,
      'The validation service is not configured. Set GEMINI_API_KEY on the server.',
    )
  }

  const model =
    process.env.GEMINI_MODEL ||
    'gemini-2.5-flash-lite'

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`

  const controller = new AbortController()

  const timeout = setTimeout(
    () => controller.abort(),
    60000,
  )

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
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),

      signal: controller.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      const providerMessage =
        data?.error?.message ||
        'Unknown Gemini API error.'

      throw new ExperimentError(
        response.status === 429
          ? 429
          : 502,
        `Gemini provider error (${response.status}): ${providerMessage}`,
      )
    }

    const content =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')

    if (!content) {
      throw new ExperimentError(
        502,
        'Gemini returned an empty validation response.',
      )
    }

    try {
      return JSON.parse(content)
    } catch {
      throw new ExperimentError(
        502,
        'Gemini returned invalid validation JSON.',
      )
    }
  } catch (error) {
    if (error instanceof ExperimentError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new ExperimentError(
        504,
        'The Gemini validation request timed out.',
      )
    }

    console.error(
      'Gemini validation error:',
      error,
    )

    throw new ExperimentError(
      502,
      'Failed to reach the Gemini validation provider.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

function sanitizeLinks(experiments, analysis) {
  const validIds = new Set()

  analysis.assumptions?.forEach(
    (_, index) => {
      validIds.add(
        `assumption-${index + 1}`,
      )
    },
  )

  analysis.risks?.forEach(
    (_, index) => {
      validIds.add(
        `risk-${index + 1}`,
      )
    },
  )

  return experiments.map((experiment) => ({
    ...experiment,

    assumptionIds:
      (experiment.assumptionIds || [])
        .filter((id) =>
          validIds.has(id),
        ),
  }))
}

export async function experimentHandler(
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

  const body = await readBody(req)

  const parsed =
    validateExperimentRequest(body)

  if (!parsed.success) {
    res.statusCode = 400

    res.setHeader(
      'Content-Type',
      'application/json',
    )

    res.end(
      JSON.stringify({
        error:
          'Invalid validation request.',
      }),
    )

    return
  }

  try {
    const {
      idea,
      analysis,
    } = parsed.data

    const result =
      await callGemini(
        buildPrompt(
          idea,
          analysis,
        ),
      )

    const validated =
      validateExperimentsResponse(
        result,
      )

    if (!validated.success) {
      throw new ExperimentError(
        502,
        'Gemini returned an invalid validation-plan structure.',
      )
    }

    const experiments =
      sanitizeLinks(
        validated.data.experiments,
        analysis,
      )

    res.statusCode = 200

    res.setHeader(
      'Content-Type',
      'application/json',
    )

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
