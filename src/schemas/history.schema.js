import { z } from 'zod'
import { AnalysisSchema } from './analysis.schema'

/**
 * Schemas for Phase 9 — local idea history persistence.
 *
 * A history record bundles the captured idea, its AI analysis, and timestamps.
 * The analysis is validated with the existing `AnalysisSchema` so we never load a
 * malformed record into the UI.
 *
 * There is no existing Zod schema for the captured idea (Phase 4 validated it
 * inline), so a minimal `IdeaSchema` is defined here rather than duplicating the
 * analysis structure.
 */

export const IdeaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  targetUsers: z.string().optional(),
  problem: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const HistoryRecordSchema = z.object({
  id: z.string().min(1),
  idea: IdeaSchema,
  analysis: AnalysisSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const HistoryStoreSchema = z.object({
  version: z.literal(1),
  items: z.array(HistoryRecordSchema),
})

export function validateHistoryStore(data) {
  return HistoryStoreSchema.safeParse(data)
}

export function validateHistoryRecord(data) {
  return HistoryRecordSchema.safeParse(data)
}
