import { useEffect, useRef, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { Select } from '../../components/ui/Select'
import { fetchExperiments } from '../../services/experiment'
import {
  loadExperimentStatuses,
  saveExperimentStatuses,
  saveExperimentPlan,
} from '../ideas/experimentStore'

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
]

const STATUS_VARIANT = {
  PLANNED: 'neutral',
  IN_PROGRESS: 'info',
  DONE: 'success',
}

const GEN_STAGES = [
  'Reviewing your analysis…',
  'Designing validation experiments…',
  'Linking them to your assumptions…',
]

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

function LinkedAssumptions({ ids, refMap }) {
  if (!ids || ids.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Not directly tied to a listed assumption or risk.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {ids.map((id) => {
        const ref = refMap.get(id)
        if (!ref) return null
        return (
          <li key={id}>
            <Badge variant="neutral">
              <span className="font-medium">{ref.type}:</span> {ref.label}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}

function ProgressSummary({ experiments }) {
  const total = experiments.length
  const done = experiments.filter((e) => e.status === 'DONE').length
  const inProgress = experiments.filter((e) => e.status === 'IN_PROGRESS').length
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary"
      aria-live="polite"
    >
      <span className="font-medium text-text-primary">
        {done} of {total} experiments completed
      </span>
      {inProgress > 0 && <span>· {inProgress} in progress</span>}
    </div>
  )
}

export function ValidationPlan({ idea, analysis }) {
  const [phase, setPhase] = useState('loading') // loading | ready | error | empty
  const [experiments, setExperiments] = useState([])
  const [error, setError] = useState(null)
  const [stageMessage, setStageMessage] = useState('')
  const timers = useRef([])
  const retryRef = useRef(() => loadPlan())
  const ideaId = idea?.id

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  function runStagedMessages(stages) {
    clearTimers()
    stages.forEach((msg, i) => {
      timers.current.push(setTimeout(() => setStageMessage(msg), i * 900))
    })
  }

  async function loadPlan() {
    clearTimers()
    setError(null)
    setPhase('loading')
    setStageMessage(GEN_STAGES[0])
    runStagedMessages(GEN_STAGES)
    try {
      const list = await fetchExperiments(idea, analysis)
      clearTimers()
      const saved = loadExperimentStatuses(ideaId)
      const merged = list.map((exp) => ({
        ...exp,
        status: saved[exp.id] || 'PLANNED',
      }))
      saveExperimentPlan(ideaId, list)
      setExperiments(merged)
      setPhase(merged.length > 0 ? 'ready' : 'empty')
    } catch (err) {
      clearTimers()
      setError(
        err.message || 'The validation plan could not be generated. Please try again.',
      )
      retryRef.current = loadPlan
      setPhase('error')
    }
  }

  useEffect(() => {
    loadPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleStatusChange(id, value) {
    setExperiments((prev) => {
      const next = prev.map((e) =>
        e.id === id ? { ...e, status: value } : e,
      )
      const map = {}
      next.forEach((e) => {
        map[e.id] = e.status
      })
      saveExperimentStatuses(ideaId, map)
      return next
    })
  }

  if (phase === 'loading') {
    return (
      <div
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-text-primary"
        aria-live="polite"
      >
        <Spinner />
        <span>{stageMessage}</span>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="danger" title="We couldn’t build the validation plan" icon>
          {error}
        </Alert>
        <div>
          <Button onClick={() => retryRef.current?.()}>Try again</Button>
        </div>
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <Alert variant="info" title="No validation experiments yet" icon>
        The analysis didn’t surface concrete experiments to run. Try re-running the
        analysis, or review the assumptions and risks above to design your own
        lightweight test.
      </Alert>
    )
  }

  const refMap = buildRefMap(analysis)

  return (
    <div className="flex flex-col gap-8">
      <Alert variant="info" title="Proposed validation plan (not yet run)" icon>
        These are experiments to run in the real world — proposed criteria, not
        results. None of them have been conducted yet. You make the call on what
        to test and how.
      </Alert>

      <ProgressSummary experiments={experiments} />

      <div className="flex flex-col gap-6">
        {experiments.map((exp, i) => (
          <Card key={exp.id} className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-text-secondary">
                  Experiment {i + 1}
                </span>
                <Badge variant={STATUS_VARIANT[exp.status] || 'neutral'}>
                  {STATUS_OPTIONS.find((o) => o.value === exp.status)?.label ||
                    exp.status}
                </Badge>
                <Badge variant="neutral">Effort: {exp.effort}</Badge>
              </div>
              <h3 className="font-display text-h3 font-semibold tracking-tight text-text-primary">
                {exp.hypothesis}
              </h3>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Method</h4>
                <p className="mt-1 text-sm text-text-secondary">{exp.method}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Timeline</h4>
                <p className="mt-1 text-sm text-text-secondary">{exp.timeline}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary">
                Proposed success criteria
              </h4>
              <p className="mt-1 text-sm text-text-secondary">
                {exp.successCriteria}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-primary">
                Tests these assumptions / risks
              </h4>
              <div className="mt-2">
                <LinkedAssumptions ids={exp.assumptionIds} refMap={refMap} />
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <Select
                id={`status-${exp.id}`}
                label={`Status for experiment ${i + 1}`}
                value={exp.status}
                onChange={(e) => handleStatusChange(exp.id, e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
