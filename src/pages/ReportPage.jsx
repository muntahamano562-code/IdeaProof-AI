import { useParams, Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { getIdeaHistory } from '../features/history/historyStore'
import { ReportView } from '../features/reports/ReportView'

export default function ReportPage() {
  const { id } = useParams()

  let record = null
  try {
    record = getIdeaHistory(id)
  } catch {
    record = null
  }

  if (!record) {
    return (
      <Card className="mt-8 p-8">
        <Alert variant="info" title="This saved idea is no longer available" icon>
          We couldn’t find this idea in your local history. It may have been
          deleted or saved on another device.
        </Alert>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/history">
            <Button variant="secondary">Back to History</Button>
          </Link>
          <Link to="/ideas/new">
            <Button>Create a new idea</Button>
          </Link>
        </div>
      </Card>
    )
  }

  return <ReportView record={record} />
}
