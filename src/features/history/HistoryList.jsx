import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Modal } from '../../components/ui/Modal'
import { loadIdeaHistory, deleteIdeaHistory } from './historyStore'
import { formatTimestamp } from '../../lib/datetime'

const verdictVariant = {
  BUILD: 'success',
  PIVOT: 'warning',
  "DON'T BUILD": 'danger',
}

export function HistoryList() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() => loadIdeaHistory())
  const [pendingDelete, setPendingDelete] = useState(null)

  function confirmDelete() {
    if (!pendingDelete) return
    deleteIdeaHistory(pendingDelete.id)
    setItems((prev) => prev.filter((r) => r.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  if (items.length === 0) {
    return (
      <Card className="mt-8 p-8">
        <Alert variant="info" title="No saved ideas yet" icon>
          Analyzed ideas will appear here automatically. Run an analysis from a new
          idea, and it will be saved to your history on this device.
        </Alert>
        <div className="mt-6">
          <Button onClick={() => navigate('/ideas/new')}>
            Create a new idea
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <p className="mt-2 text-text-secondary">
        Ideas you’ve analyzed are saved on this device. Open one to review its
        assessment, challenge it, or continue your validation plan.
      </p>

      <ul className="mt-8 flex flex-col gap-4">
        {items.map((record) => {
          const { idea, analysis } = record
          const created = formatTimestamp(record.createdAt || idea.createdAt)
          const updated = formatTimestamp(record.updatedAt || idea.updatedAt)
          return (
            <li key={record.id}>
              <Card className="flex flex-col gap-4 p-6 sm:p-8">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={verdictVariant[analysis.verdict] || 'neutral'}>
                      {analysis.verdict}
                    </Badge>
                    <span className="font-mono text-sm text-text-secondary">
                      {analysis.overallScore}/100
                    </span>
                  </div>
                  <h2 className="font-display text-h3 font-semibold tracking-tight text-text-primary">
                    {idea.title}
                  </h2>
                  <p className="line-clamp-2 text-sm text-text-secondary">
                    {idea.description}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-secondary sm:grid-cols-4">
                  <div>
                    <dt className="font-medium text-text-primary">Assumptions</dt>
                    <dd>{analysis.assumptions.length}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-text-primary">Risks</dt>
                    <dd>{analysis.risks.length}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-text-primary">Experiments</dt>
                    <dd>{analysis.experiments.length}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-text-primary">Updated</dt>
                    <dd className="truncate">
                      {updated || created || 'Unknown'}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-3">
                  <Link to={`/ideas/${record.id}`}>
                    <Button>Open</Button>
                  </Link>
                  <Link to={`/ideas/${record.id}/report`}>
                    <Button variant="secondary">Report</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-danger"
                    onClick={() => setPendingDelete(record)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this saved idea?"
        description="This removes the idea and its analysis from your local history. This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="text-danger"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        {pendingDelete && (
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">
              {pendingDelete.idea.title}
            </span>{' '}
            will be removed from history. Your other saved ideas are unaffected.
          </p>
        )}
      </Modal>
    </>
  )
}
