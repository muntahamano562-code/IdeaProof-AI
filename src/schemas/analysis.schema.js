import { z } from 'zod'

export const SeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const VerdictSchema = z.enum(['BUILD', 'PIVOT', "DON'T BUILD"])

export const AssumptionSchema = z.object({
  assumption: z.string().min(1),
  rationale: z.string().min(1),
})

export const RiskSchema = z.object({
  risk: z.string().min(1),
  severity: SeveritySchema,
  note: z.string().default(''),
})

export const CategoryScoreSchema = z.object({
  category: z.string().min(1),
  score: z.number().min(0).max(100),
  explanation: z.string().min(1),
})

export const ExperimentSchema = z.object({
  title: z.string().min(1),
  successCriteria: z.string().min(1),
  timeline: z.string().min(1),
})

export const AnalysisSchema = z.object({
  summary: z.string().min(1),
  problemAnalysis: z.string().min(1),
  targetAudienceAnalysis: z.string().min(1),
  feasibilityAnalysis: z.string().min(1),
  competitionAnalysis: z.string().min(1),
  assumptions: z.array(AssumptionSchema).default([]),
  risks: z.array(RiskSchema).default([]),
  categoryScores: z.array(CategoryScoreSchema).min(1),
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  mvpRecommendation: z.string().min(1),
  experiments: z.array(ExperimentSchema).default([]),
  verdict: VerdictSchema,
})

export function validateAnalysis(data) {
  return AnalysisSchema.safeParse(data)
}
