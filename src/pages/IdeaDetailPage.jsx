import { useParams, Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/AuthProvider'
import { loadDraft } from '../features/ideas/ideaDraft'

function formatTimestamp(iso) {
  if (!iso) return null
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString()
  } catch {
    return null
  }
}

export default function IdeaDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const draft = user ? loadDraft(user.id) : null
  const found = Boolean(draft && draft.id === id)

  if (!found) {
    return (
      <>
        <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
          Idea not found
        </h1>
        <p className="mt-2 text-text-secondary">
          We couldn't find a saved idea with this reference.
        </p>
        <Card className="mt-8 p-8">
          <Alert variant="info" title="No local draft" icon>
            This idea hasn't been captured on this device, or it belongs to a
            different account. Drafts are stored locally per signed-in user.
          </Alert>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
            <Link to="/ideas/new">
              <Button>Create a new idea</Button>
            </Link>
          </div>
        </Card>
      </>
    )
  }

  const created = formatTimestamp(draft.createdAt)
  const updated = formatTimestamp(draft.updatedAt)

  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
        {draft.title}
      </h1>
      <p className="mt-2 text-text-secondary">
        Captured idea{' '}
        <span className="font-mono text-text-primary">{draft.id}</span>
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <Alert variant="info" title="Validation not available yet" icon>
          Your idea has been captured. AI validation will be added in a later
          phase.
        </Alert>

        <div className="mt-6 flex flex-col gap-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-text-primary">
              {draft.description}
            </p>
          </section>

          {draft.targetUsers && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Target users
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-text-primary">
                {draft.targetUsers}
              </p>
            </section>
          )}

          {draft.problem && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Problem being solved
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-text-primary">
                {draft.problem}
              </p>
            </section>
          )}

          {(created || updated) && (
            <section className="border-t border-border pt-4 text-sm text-text-secondary">
              {created && <p>Created: {created}</p>}
              {updated && <p>Last updated: {updated}</p>}
            </section>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/dashboard">
            <Button variant="secondary">Back to dashboard</Button>
          </Link>
          <Link to="/ideas/new">
            <Button variant="ghost">Edit / new idea</Button>
          </Link>
        </div>
      </Card>
    </>
  )
}
