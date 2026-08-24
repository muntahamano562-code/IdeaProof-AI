import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/AuthProvider'
import { loadDraft } from '../features/ideas/ideaDraft'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const draft = user ? loadDraft(user.id) : null

  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
        Dashboard
      </h1>
      <p className="mt-2 text-text-secondary">
        Your validation workspace.
      </p>

      {draft ? (
        <Card className="mt-8 p-8">
          <h2 className="font-display text-h3 font-semibold text-text-primary">
            Continue your draft
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            You have an unfinished idea saved on this device.
          </p>
          <p className="mt-4 font-medium text-text-primary">{draft.title}</p>
          <div className="mt-6">
            <Button onClick={() => navigate('/ideas/new')}>
              Open draft
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-8 p-8">
          <h2 className="font-display text-h3 font-semibold text-text-primary">
            Create your first idea
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Capture an idea and the problem it solves. Validation comes next.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/ideas/new')}>
              Create your first idea
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}
