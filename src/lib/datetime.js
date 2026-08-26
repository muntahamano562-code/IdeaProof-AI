/**
 * Small, dependency-free date formatting helpers.
 * Invalid timestamps fail safely (return null) so callers can omit the value
 * rather than showing "Invalid Date".
 */
export function formatTimestamp(iso) {
  if (!iso || typeof iso !== 'string') return null
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString()
  } catch {
    return null
  }
}
