import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../features/auth/AuthProvider'
import { loadDraft } from '../features/ideas/ideaDraft'
import { getIdeaHistory, saveIdeaHistory } from '../features/history/historyStore'
import { formatTimestamp } from '../lib/datetime'
import { analyzeIdea } from '../services/analysis'
import { AnalysisDashboard } from '../features/analysis/AnalysisDashboard'
import { ChallengeMode } from '../features/challenge/ChallengeMode'
import { ValidationPlan } from '../features/validation/ValidationPlan'

const STAGE_MESSAGES = {
  preparing: 'Preparing your idea…',
  analyzing: 'Analyzing your idea with AI…',
  structuring: 'Structuring the results…',
}

export default function IdeaDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  // History is the canonical multi-idea store; fall back to the single draft.
  const record = useMemo(() => {
    try {
      return getIdeaHistory(id)
    } catch {
      return null
    }
  }, [id])
  const draft = record ? record.idea : user ? loadDraft(user.id) : null
  const found = Boolean(draft && draft.id === id)

  const [analysis, setAnalysis] = useState(() =>
    record && record.analysis ? record.analysis : null,
  )
  const [stage, setStage] = useState(() =>
    record && record.analysis ? 'done' : 'idle',
  )
  const [error, setError] = useState(null)
  const [showChallenge, setShowChallenge] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  async function runAnalysis() {
    if (!draft) return
    clearTimers()
    setError(null)
    setAnalysis(null)
    setStage('preparing')
    timers.current.push(setTimeout(() => setStage('analyzing'), 700))
    timers.current.push(setTimeout(() => setStage('structuring'), 1800))
    try {
      const result = await analyzeIdea(draft)
      setAnalysis(result)
      setStage('done')
      const now = new Date().toISOString()
      saveIdeaHistory({
        id: draft.id,
        idea: draft,
        analysis: result,
        createdAt: (record && record.createdAt) || draft.createdAt || now,
        updatedAt: now,
      })
    } catch (err) {
      setError(err.message || 'Analysis could not be completed.')
      setStage('error')
    } finally {
      clearTimers()
    }
  }

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
            <Link to="/history">
              <Button variant="secondary">View saved ideas</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost">Back to dashboard</Button>
            </Link>
            <Link to="/ideas/new">
              <Button>Create a new idea</Button>
            </Link>
          </div>
        </Card>
      </>
    )
  }

  const created = formatTimestamp(record?.createdAt || draft.createdAt)
  const updated = formatTimestamp(record?.updatedAt || draft.updatedAt)
  const inProgress = stage === 'preparing' || stage === 'analyzing' || stage === 'structuring'

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

      <section className="mt-10" aria-labelledby="analysis-heading">
        <h2 id="analysis-heading" className="font-display text-h2 font-semibold tracking-tight text-text-primary">
          AI analysis
        </h2>
        <p className="mt-2 text-text-secondary">
          Pressure-test this idea with an AI assessor.
        </p>

        <div className="mt-6">
          {stage === 'idle' && !analysis && (
            <Button onClick={runAnalysis}>Run analysis</Button>
          )}

          {inProgress && (
            <div
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-text-primary"
              aria-live="polite"
            >
              <Spinner />
              <span>{STAGE_MESSAGES[stage]}</span>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col gap-4">
              <Alert variant="danger" title="Analysis failed" icon>
                {error}
              </Alert>
              <div>
                <Button onClick={runAnalysis}>Try again</Button>
              </div>
            </div>
          )}

          {stage === 'done' && analysis && (
            <div className="flex flex-col gap-10">
              <AnalysisDashboard
                analysis={analysis}
                onOpenPlan={() => setShowPlan(true)}
              />

              <section aria-labelledby="challenge-heading">
                <h2
                  id="challenge-heading"
                  className="font-display text-h2 font-semibold tracking-tight text-text-primary"
                >
                  Challenge your idea
                </h2>
                <p className="mt-2 text-text-secondary">
                  Stress-test your assumptions before you decide what to build.
                </p>
                <Alert variant="info" title="AI simulation of skeptical scrutiny" icon>
                  This is a simulation of a skeptical reviewer, not an objective
                  validator. The counterarguments are one perspective to sharpen
                  your thinking — not verified facts.
                </Alert>

                <div className="mt-6">
                  {!showChallenge ? (
                    <Button onClick={() => setShowChallenge(true)}>
                      Start challenge mode
                    </Button>
                  ) : (
                    <ChallengeMode idea={draft} analysis={analysis} />
                  )}
                </div>
              </section>

              <section aria-labelledby="plan-heading">
                <h2
                  id="plan-heading"
                  className="font-display text-h2 font-semibold tracking-tight text-text-primary"
                >
                  Validation plan
                </h2>
                <p className="mt-2 text-text-secondary">
                  Turn the analysis into real-world tests for your key assumptions.
                </p>

                <div className="mt-6">
                  {!showPlan ? (
                    <Button onClick={() => setShowPlan(true)}>
                      Build validation plan
                    </Button>
                  ) : (
                    <ValidationPlan idea={draft} analysis={analysis} />
                  )}
                </div>
              </section>

              <div className="flex flex-wrap gap-3">
                <Link to={`/ideas/${draft.id}/report`}>
                  <Button variant="secondary">View full report</Button>
                </Link>
                <Button variant="ghost" onClick={runAnalysis}>
                  Run analysis again
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
