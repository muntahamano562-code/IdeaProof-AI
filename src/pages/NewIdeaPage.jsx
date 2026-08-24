import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'

export default function NewIdeaPage() {
  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
        New idea
      </h1>
      <p className="mt-2 text-text-secondary">
        Capture and validate an idea.
      </p>

      <Card className="mt-8 p-8">
        <Alert variant="info" title="Coming in the next phase" icon={false}>
          Idea creation — the form, validation, and draft handling — is part of
          Phase 4. This route is in place so the protected flow is ready.
        </Alert>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="text-sm text-primary hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </Card>
    </>
  )
}
