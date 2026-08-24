const DRAFT_PREFIX = 'ideaproof-ai:idea-draft'

function getDraftKey(userId) {
  return userId ? `${DRAFT_PREFIX}:${userId}` : DRAFT_PREFIX
}

export function generateIdeaId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `idea-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function safeParse(raw) {
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    if (data && typeof data === 'object' && typeof data.id === 'string') {
      return data
    }
    return null
  } catch {
    return null
  }
}

export function loadDraft(userId) {
  try {
    return safeParse(localStorage.getItem(getDraftKey(userId)))
  } catch {
    return null
  }
}

export function saveDraft(userId, draft) {
  try {
    localStorage.setItem(getDraftKey(userId), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function clearDraft(userId) {
  try {
    localStorage.removeItem(getDraftKey(userId))
    return true
  } catch {
    return false
  }
}

export function emptyIdeaValues() {
  return { title: '', description: '', targetUsers: '', problem: '' }
}
