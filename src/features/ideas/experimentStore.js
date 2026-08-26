const PREFIX = 'ideaproof:experiments:'

/**
 * Local-only persistence for experiment statuses (Phase 8).
 *
 * This deliberately uses localStorage (not Supabase) — database persistence is a
 * Phase 9 concern. Statuses are keyed per idea id. Corrupted or invalid data
 * fails safely to an empty map so the UI falls back to PLANNED.
 */

export function loadExperimentStatuses(ideaId) {
  if (!ideaId) return {}
  try {
    const raw = localStorage.getItem(PREFIX + ideaId)
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (data && typeof data === 'object' && !Array.isArray(data)) return data
    return {}
  } catch {
    return {}
  }
}

export function saveExperimentStatuses(ideaId, statuses) {
  if (!ideaId) return
  try {
    localStorage.setItem(PREFIX + ideaId, JSON.stringify(statuses))
  } catch {
    /* ignore quota / disabled storage */
  }
}

const PLAN_PREFIX = 'ideaproof:experiments-plan:'

/**
 * Persist the Phase 8 experiment *definitions* (hypothesis, method, effort,
 * timeline, linked assumption ids). Statuses live separately in the
 * `ideaproof:experiments:<ideaId>` map. Persisting the plan locally lets the
 * report compose Phase 8 experiments without re-running the LLM. No history or
 * Supabase involvement.
 */
export function saveExperimentPlan(ideaId, experiments) {
  if (!ideaId || !Array.isArray(experiments)) return
  try {
    localStorage.setItem(PLAN_PREFIX + ideaId, JSON.stringify(experiments))
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function loadExperimentPlan(ideaId) {
  if (!ideaId) return []
  try {
    const raw = localStorage.getItem(PLAN_PREFIX + ideaId)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (
      Array.isArray(data) &&
      data.every(
        (e) =>
          e &&
          typeof e === 'object' &&
          typeof e.id === 'string' &&
          typeof e.hypothesis === 'string',
      )
    ) {
      return data
    }
    return []
  } catch {
    return []
  }
}
