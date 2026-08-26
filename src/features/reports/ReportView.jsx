import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Link } from 'react-router-dom'
import { loadExperimentPlan, loadExperimentStatuses } from '../ideas/experimentStore'
import { formatTimestamp } from '../../lib/datetime'
import { buildReportMarkdown } from './reportMarkdown'

const verdictVariant = {
  BUILD: 'success',
  PIVOT: 'warning',
  "DON'T BUILD": 'danger',
}

const STATUS_VARIANT = {
  PLANNED: 'neutral',
  IN_PROGRESS: 'info',
  DONE: 'success',
}

const STATUS_LABEL = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

function buildRefMap(analysis) {
  const map = new Map()
  ;(analysis.assumptions || []).forEach((a, i) =>
    map.set(`assumption-${i + 1}`, { label: a.assumption, type: 'Assumption' }),
  )
  ;(analysis.risks || []).forEach((r, i) =>
    map.set(`risk-${i + 1}`, { label: r.risk, type: 'Risk' }),
  )
  return map
}

function resolveExperiments(analysis, plan, statuses) {
  if (plan && plan.length) {
    return plan.map((e) => ({
      ...e,
      status: statuses[e.id] || 'PLANNED',
      isPhase8: true,
    }))
  }
  if (analysis.experiments && analysis.experiments.length) {
    return analysis.experiments.map((e) => ({
      id: null,
      title: e.title,
      successCriteria: e.successCriteria,
      timeline: e.timeline,
      status: null,
      isPhase8: false,
    }))
  }
  return []
}

function sanitizeFilename(title) {
  return (
    (title || 'idea')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'idea'
  )
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function ReportView({ record }) {
  const { idea, analysis } = record
  const ideaId = idea.id
  const created = formatTimestamp(record.createdAt || idea.createdAt)
  const updated = formatTimestamp(record.updatedAt || idea.updatedAt)

  const plan = loadExperimentPlan(ideaId)
  const statuses = loadExperimentStatuses(ideaId)
  const experiments = resolveExperiments(analysis, plan, statuses)
  const refMap = buildRefMap(analysis)

  function handlePrint() {
    window.print()
  }

  function handleExport() {
    const md = buildReportMarkdown({
      idea,
      analysis,
      experiments,
      createdAt: created,
      updatedAt: updated,
    })
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ideaproof-${sanitizeFilename(idea.title)}-report.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="no-print flex flex-wrap gap-3">
        <Button onClick={handlePrint}>Print report</Button>
        <Button variant="secondary" onClick={handleExport}>
          Export Markdown
        </Button>
        <Link to={`/ideas/${ideaId}`}>
          <Button variant="ghost">Back to idea</Button>
        </Link>
      </div>

      <Alert variant="info" title="AI assessment notice" icon>
        This report is generated from your saved analysis. The assessment is
        AI-generated and based only on the information you provided — it is not
        verified market research or a guarantee of success.
      </Alert>

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-h1 font-semibold tracking-tight text-text-primary">
          {idea.title}
        </h1>
        <p className="text-sm text-text-secondary">
          Validation report
          {created && ` · created ${created}`}
          {updated && ` · updated ${updated}`}
        </p>
      </header>

      <Section title="Idea overview">
        <Card className="flex flex-col gap-3 p-6 sm:p-8">
          {idea.description && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Description
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-text-secondary">
                {idea.description}
              </p>
            </div>
          )}
          {idea.problem && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Problem being solved
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-text-secondary">
                {idea.problem}
              </p>
            </div>
          )}
          {idea.targetUsers && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Target users
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-text-secondary">
                {idea.targetUsers}
              </p>
            </div>
          )}
        </Card>
      </Section>

      <Section title="Executive summary">
        <Card className="p-6 sm:p-8">
          <p className="whitespace-pre-wrap text-text-primary">
            {analysis.summary}
          </p>
        </Card>
      </Section>

      <Section title="Verdict">
        <Card className="flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-text-secondary">
              Current recommendation
            </span>
            <Badge variant={verdictVariant[analysis.verdict] || 'neutral'}>
              {analysis.verdict}
            </Badge>
            <span className="font-mono text-sm text-text-secondary">
              {analysis.overallScore}/100
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            AI confidence: {analysis.confidence}/100. The score is the stored
            assessment and is not recalculated here.
          </p>
        </Card>
      </Section>

      {analysis.categoryScores?.length > 0 && (
        <Section title="Category analysis">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.categoryScores.map((c, i) => (
              <Card key={`${c.category}-${i}`} className="flex flex-col gap-2 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-text-primary">{c.category}</h3>
                  <span className="font-mono text-sm text-text-secondary">
                    {c.score}/100
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{c.explanation}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {analysis.assumptions?.length > 0 && (
        <Section title="Assumptions">
          <div className="grid gap-4 sm:grid-cols-2">
            {analysis.assumptions.map((a, i) => (
              <Card key={`${a.assumption}-${i}`} className="flex flex-col gap-2 p-5">
                <h3 className="font-semibold text-text-primary">
                  {a.assumption}
                </h3>
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Why it matters:{' '}
                  </span>
                  {a.rationale}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {analysis.risks?.length > 0 && (
        <Section title="Risks">
          <Card className="flex flex-col gap-4 p-5">
            <ul className="flex flex-col gap-4">
              {analysis.risks.map((r, i) => (
                <li
                  key={`${r.risk}-${i}`}
                  className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        r.severity === 'LOW'
                          ? 'low'
                          : r.severity === 'MEDIUM'
                            ? 'medium'
                            : r.severity === 'HIGH'
                              ? 'high'
                              : 'critical'
                      }
                    >
                      {r.severity}
                    </Badge>
                    <span className="font-medium text-text-primary">{r.risk}</span>
                  </div>
                  {r.note && (
                    <p className="text-sm text-text-secondary">{r.note}</p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      <Section title="Validation experiments">
        <Alert variant="warning" title="Proposed, not completed" icon>
          These are experiments to run. None have been conducted by the AI. A
          “Done” status means you marked the experiment as done — it does not mean
          the AI verified a result.
        </Alert>
        <div className="mt-4 flex flex-col gap-6">
          {experiments.length === 0 && (
            <p className="text-sm text-text-secondary">
              No validation experiments were available for this idea.
            </p>
          )}
          {experiments.map((e, i) => (
            <Card key={e.id || i} className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-text-secondary">
                  Experiment {i + 1}
                </span>
                {e.status && (
                  <Badge variant={STATUS_VARIANT[e.status] || 'neutral'}>
                    {STATUS_LABEL[e.status]}
                  </Badge>
                )}
                {e.isPhase8 && e.effort && (
                  <Badge variant="neutral">Effort: {e.effort}</Badge>
                )}
              </div>
              <h3 className="font-display text-h3 font-semibold tracking-tight text-text-primary">
                {e.isPhase8 ? e.hypothesis : e.title}
              </h3>
              {e.isPhase8 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Method</h4>
                  <p className="mt-1 text-sm text-text-secondary">{e.method}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Proposed success criteria
                </h4>
                <p className="mt-1 text-sm text-text-secondary">
                  {e.successCriteria}
                </p>
              </div>
              {e.timeline && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    Timeline
                  </h4>
                  <p className="mt-1 text-sm text-text-secondary">{e.timeline}</p>
                </div>
              )}
              {e.isPhase8 && e.assumptionIds?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">
                    Tests these assumptions / risks
                  </h4>
                  <ul className="mt-2 flex flex-col gap-2">
                    {e.assumptionIds.map((id) => {
                      const ref = refMap.get(id)
                      if (!ref) return null
                      return (
                        <li key={id}>
                          <Badge variant="neutral">
                            <span className="font-medium">{ref.type}:</span>{' '}
                            {ref.label}
                          </Badge>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>
    </div>
  )
}
