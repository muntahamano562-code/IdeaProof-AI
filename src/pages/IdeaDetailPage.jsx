import { useParams, Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'

export default function IdeaDetailPage() {
  const { id } = useParams()

  return (
    <>
      <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
        Idea details
      </h1>
      <p className="mt-2 text-text-secondary">
        Analysis for idea{' '}
        <span className="font-mono text-text-primary">{id}</span>.
      </p>

      <Card className="mt-8 p-8">
        <Alert variant="info" title="Analysis coming later" icon={false}>
          Detailed idea analysis, scores, and experiments will be available in
          later phases. This placeholder confirms the protected route works.
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
