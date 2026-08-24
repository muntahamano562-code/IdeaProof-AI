import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
        Dashboard
      </h1>
      <p className="mt-2 text-text-secondary">
        Your validation workspace.
      </p>

      <Card className="mt-8 p-8">
        <h2 className="font-display text-h3 font-semibold text-text-primary">
          Create your first idea
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Idea creation and analysis are part of the next phase. For now, this
          is your authenticated home base.
        </p>
        <div className="mt-6">
          <Button onClick={() => navigate('/ideas/new')}>
            Create your first idea
          </Button>
        </div>
      </Card>
    </>
  )
}
