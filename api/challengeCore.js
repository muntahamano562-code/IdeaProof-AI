import {
  validateChallengeRequest,
  validateChallengesResponse,
  validateChallengeEvaluation,
} from '../src/schemas/challenge.schema.js'

class ChallengeError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const CHALLENGE_SYSTEM_PROMPT = `You are IdeaProof's skeptical challenger.

Your job is to pressure-test a startup idea by asking difficult but useful questions about assumptions, risks, target users, differentiation, feasibility, acquisition and monetization.

Return ONLY valid JSON.

For challenges return:

{
  "challenges": [
    {
      "id": "challenge-1",
      "question": "question",
      "target": "what this tests",
      "rationale": "why this matters"
    }
  ]
}

Rules:
- Produce 3 to 5 challenges.
- IDs must be challenge-1, challenge-2, etc.
- Questions must be grounded in the supplied idea and analysis.
- Do not invent statistics or research.
- Be skeptical but respectful.
- Do not use markdown.`

const EVALUATE_SYSTEM_PROMPT = `You are IdeaProof's skeptical challenger.

A founder has answered one challenge question.

Evaluate the answer from a skeptical perspective.

Return ONLY valid JSON:

{
  "challengeId": "challenge id",
  "counterargument": "strongest skeptical rebuttal",
  "addressedConcern": "what the answer addressed",
  "remainingConcern": "what remains unresolved",
  "assessmentChange": {
    "changed": false,
    "explanation": "plain-language explanation"
  },
  "nextAction": "one concrete validation action"
}

Rules:
- This is simulated scrutiny, not verified truth.
- Do not assign numeric scores.
- Do not invent statistics.
- Be grounded in the provided idea and answer.
- Do not use markdown.`

const CHALLENGE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    challenges: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          question: { type: 'STRING' },
          target: { type: 'STRING' },
          rationale: { type: 'STRING' },
        },
        required: [
          'id',
          'question',
          'target',
          'rationale',
        ],
      },
    },
  },
  required: ['challenges'],
}

const EVALUATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    challengeId: { type: 'STRING' },
    counterargument: { type: 'STRING' },
    addressedConcern: { type: 'STRING' },
    remainingConcern: { type: 'STRING' },

    assessmentChange: {
      type: 'OBJECT',
      properties: {
        changed: { type: 'BOOLEAN' },
        explanation: { type: 'STRING' },
      },
      required: ['changed', 'explanation'],
    },

    nextAction: { type: 'STRING' },
  },

  required: [
    'challengeId',
    'counterargument',
    'addressedConcern',
    'remainingConcern',
    'assessmentChange',
    'nextAction',
  ],
}

function buildChallengePrompt(idea, analysis) {
  return `Pressure-test this startup idea.

Title:
${idea.title}

Description:
${idea.description}

Target users:
${idea.targetUsers?.trim() || 'Not provided'}

Problem:
${idea.problem?.trim() || 'Not provided'}

AI assessment summary:
${analysis.summary}

Assumptions:
${
  analysis.assumptions
    ?.map(
      (a) =>
        `- ${a.assumption}: ${a.rationale}`,
    )
    .join('\n') || '- None'
}

Risks:
${
  analysis.risks
    ?.map(
      (r) =>
        `- [${r.severity}] ${r.risk}: ${r.note}`,
    )
    .join('\n') || '- None'
}

Category scores:
${
  analysis.categoryScores
    ?.map(
      (c) =>
        `- ${c.category}: ${c.score}/100 — ${c.explanation}`,
    )
    .join('\n') || '- None'
}

Overall score:
${analysis.overallScore}/100

Confidence:
${analysis.confidence}/100

Verdict:
${analysis.verdict}

Generate the skeptical challenge questions now.`
}

function buildEvaluatePrompt(
  idea,
  analysis,
  challenge,
  response,
) {
  return `Evaluate this founder response skeptically.

Startup idea:
${idea.title}

Description:
${idea.description}

Target users:
${idea.targetUsers?.trim() || 'Not provided'}

Problem:
${idea.problem?.trim() || 'Not provided'}

Original assessment:
${analysis.summary}

Verdict:
${analysis.verdict}

Challenge:
ID: ${challenge.id}
Question: ${challenge.question}
Target: ${challenge.target}
Rationale: ${challenge.rationale}

Founder response:
${response}

Return the skeptical evaluation now.`
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

async function callGemini(prompt, schema) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new ChallengeError(
      500,
      'The challenge service is not configured. Set GEMINI_API_KEY on the server.',
    )
  }

  const model =
    process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'

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
              text:
                schema === CHALLENGE_SCHEMA
                  ? CHALLENGE_SYSTEM_PROMPT
                  : EVALUATE_SYSTEM_PROMPT,
            },
          ],
        },

        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],

        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),

      signal: controller.signal,
    })

    const data = await response.json()

    if (!response.ok) {
      const providerMessage =
        data?.error?.message ||
        'Unknown Gemini API error.'

      throw new ChallengeError(
        response.status === 429 ? 429 : 502,
        `Gemini provider error (${response.status}): ${providerMessage}`,
      )
    }

    const content =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')

    if (!content) {
      throw new ChallengeError(
        502,
        'Gemini returned an empty challenge response.',
      )
    }

    try {
      return JSON.parse(content)
    } catch {
      throw new ChallengeError(
        502,
        'Gemini returned invalid challenge JSON.',
      )
    }
  } catch (error) {
    if (error instanceof ChallengeError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new ChallengeError(
        504,
        'The Gemini challenge request timed out.',
      )
    }

    console.error('Gemini challenge error:', error)

    throw new ChallengeError(
      502,
      'Failed to reach the Gemini challenge provider.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function challengeHandler(req, res) {
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

  const parsed =
    validateChallengeRequest(body)

  if (!parsed.success) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: 'Invalid challenge request.',
      }),
    )
    return
  }

  try {
    const { action } = parsed.data

    if (action === 'challenges') {
      const {
        idea,
        analysis,
      } = parsed.data

      const result = await callGemini(
        buildChallengePrompt(
          idea,
          analysis,
        ),
        CHALLENGE_SCHEMA,
      )

      const validated =
        validateChallengesResponse(result)

      if (!validated.success) {
        throw new ChallengeError(
          502,
          'Gemini returned an invalid challenge structure.',
        )
      }

      res.statusCode = 200
      res.setHeader(
        'Content-Type',
        'application/json',
      )

      res.end(
        JSON.stringify({
          challenges:
            validated.data.challenges,
        }),
      )

      return
    }

    const {
      idea,
      analysis,
      challenge,
      response,
    } = parsed.data

    const result = await callGemini(
      buildEvaluatePrompt(
        idea,
        analysis,
        challenge,
        response,
      ),
      EVALUATION_SCHEMA,
    )

    const validated =
      validateChallengeEvaluation(result)

    if (!validated.success) {
      throw new ChallengeError(
        502,
        'Gemini returned an invalid evaluation structure.',
      )
    }

    res.statusCode = 200
    res.setHeader(
      'Content-Type',
      'application/json',
    )

    res.end(
      JSON.stringify(
        validated.data,
      ),
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
