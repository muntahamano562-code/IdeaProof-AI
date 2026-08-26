import { z } from 'zod'
import { AnalysisSchema } from './analysis.schema'

/**
 * Schemas for Phase 7 — AI Challenge Mode.
 *
 * Two server actions share `api/challenge.js`:
 *  - `challenges`: derive 3–5 challenge questions from an idea + analysis
 *  - `evaluate`: submit a user response to one challenge and get a counterargument
 *
 * All shapes are validated on the server before any LLM call and again on the
 * client before the UI consumes them.
 */

export const ChallengeSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  target: z.string().min(1),
  rationale: z.string().min(1),
})

export const ChallengesResponseSchema = z.object({
  challenges: z.array(ChallengeSchema).min(3).max(5),
})

export const AssessmentChangeSchema = z.object({
  changed: z.boolean(),
  explanation: z.string().min(1),
})

export const ChallengeEvaluationSchema = z.object({
  challengeId: z.string().min(1),
  counterargument: z.string().min(1),
  addressedConcern: z.string().min(1),
  remainingConcern: z.string().min(1),
  assessmentChange: AssessmentChangeSchema,
  nextAction: z.string().min(1),
})

const IdeaInput = z.object({
  title: z.string().min(3).max(5000),
  description: z.string().min(20).max(20000),
  targetUsers: z.string().max(5000).optional(),
  problem: z.string().max(10000).optional(),
})

const ChallengesRequest = z.object({
  action: z.literal('challenges'),
  idea: IdeaInput,
  analysis: AnalysisSchema,
})

const EvaluateRequest = z.object({
  action: z.literal('evaluate'),
  idea: IdeaInput,
  analysis: AnalysisSchema,
  challenge: z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    target: z.string().min(1),
    rationale: z.string().min(1),
  }),
  response: z.string().min(10).max(20000),
})

export const ChallengeRequestSchema = z.discriminatedUnion('action', [
  ChallengesRequest,
  EvaluateRequest,
])

export function validateChallengeRequest(data) {
  return ChallengeRequestSchema.safeParse(data)
}

export function validateChallengesResponse(data) {
  return ChallengesResponseSchema.safeParse(data)
}

export function validateChallengeEvaluation(data) {
  return ChallengeEvaluationSchema.safeParse(data)
}
