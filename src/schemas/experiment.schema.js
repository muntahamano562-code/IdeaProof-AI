import { z } from 'zod'
import { AnalysisSchema } from './analysis.schema'

/**
 * Schemas for Phase 8 — Validation Experiments.
 *
 * Phase 5 already produces lightweight `experiments` (title / successCriteria /
 * timeline) inside the analysis. Phase 8 needs a richer, structured plan with a
 * hypothesis, method, effort estimate, timeline, and explicit links to the
 * assumptions/risks it tests. That richer plan is generated server-side by
 * `api/experiments.js` so the LLM key stays server-side.
 *
 * `status` is a client-only concept (Planned / In progress / Done) stored in
 * localStorage; it is not part of the server response.
 */

export const EffortSchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

export const ExperimentStatusSchema = z.enum(['PLANNED', 'IN_PROGRESS', 'DONE'])

export const ExperimentSchema = z.object({
  id: z.string().min(1),
  hypothesis: z.string().min(1),
  method: z.string().min(1),
  successCriteria: z.string().min(1),
  effort: EffortSchema,
  timeline: z.string().min(1),
  assumptionIds: z.array(z.string()).default([]),
  status: ExperimentStatusSchema.default('PLANNED'),
})

// Server response shape: no `status` (that is added client-side).
export const ServerExperimentSchema = z.object({
  id: z.string().min(1),
  hypothesis: z.string().min(1),
  method: z.string().min(1),
  successCriteria: z.string().min(1),
  effort: EffortSchema,
  timeline: z.string().min(1),
  assumptionIds: z.array(z.string()).default([]),
})

export const ExperimentsResponseSchema = z.object({
  experiments: z.array(ServerExperimentSchema).default([]),
})

const IdeaInput = z.object({
  title: z.string().min(3).max(5000),
  description: z.string().min(20).max(20000),
  targetUsers: z.string().max(5000).optional(),
  problem: z.string().max(10000).optional(),
})

export const ExperimentRequestSchema = z.object({
  idea: IdeaInput,
  analysis: AnalysisSchema,
})

export function validateExperimentRequest(data) {
  return ExperimentRequestSchema.safeParse(data)
}

export function validateExperimentsResponse(data) {
  return ExperimentsResponseSchema.safeParse(data)
}
