import { useEffect, useRef, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { fetchChallenges, evaluateChallenge } from '../../services/challenge'

const MIN_ANSWER = 15

const GEN_STAGES = [
  'Reading your analysis…',
  'Spotting the weakest assumptions…',
  'Forming challenge questions…',
]

const EVAL_STAGES = [
  'Reviewing your response…',
  'Stress-testing the assumption…',
  'Looking for remaining weaknesses…',
  'Updating the assessment…',
]

function AssessmentChangeBlock({ evaluation }) {
  const { assessmentChange, remainingConcern } = evaluation
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-elevated/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            What changed
          </span>
          <Badge variant={assessmentChange.changed ? 'info' : 'warning'}>
            {assessmentChange.changed ? 'Concern shifted' : 'Unchanged'}
          </Badge>
        </div>
        <p className="text-sm text-text-secondary">
          {assessmentChange.changed
            ? assessmentChange.explanation
            : 'The underlying concern did not materially change based on your response.'}
        </p>
      </div>
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-elevated/40 p-4">
        <span className="text-sm font-semibold text-text-primary">
          What didn’t change
        </span>
        <p className="text-sm text-text-secondary">{remainingConcern}</p>
      </div>
    </div>
  )
}

function ChallengeResult({ evaluation, onNext, isLast, resultRef }) {
  return (
    <div
      ref={resultRef}
      tabIndex={-1}
      className="flex flex-col gap-6 outline-none"
      aria-live="polite"
    >
      <Card className="flex flex-col gap-5 border-primary/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">AI counterargument</Badge>
          <span className="text-xs text-text-secondary">
            Simulation of skeptical scrutiny — not verified fact.
          </span>
        </div>
        <p className="whitespace-pre-wrap text-text-primary">
          {evaluation.counterargument}
        </p>
      </Card>

      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <div>
          <h4 className="font-semibold text-text-primary">What this addressed</h4>
          <p className="mt-1 text-sm text-text-secondary">
            {evaluation.addressedConcern}
          </p>
        </div>
        <AssessmentChangeBlock evaluation={evaluation} />
        <div>
          <h4 className="font-semibold text-text-primary">Suggested next action</h4>
          <p className="mt-1 text-sm text-text-secondary">{evaluation.nextAction}</p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onNext}>
          {isLast ? 'See challenge summary' : 'Continue to next challenge'}
        </Button>
      </div>
    </div>
  )
}

function HistoryPanel({ history }) {
  if (history.length === 0) return null
  return (
    <section aria-labelledby="challenge-history-heading" className="flex flex-col gap-4">
      <h3
        id="challenge-history-heading"
        className="font-display text-h3 font-semibold tracking-tight text-text-primary"
      >
        Challenge history
      </h3>
      <div className="flex flex-col gap-4">
        {history.map((entry, i) => (
          <details
            key={`${entry.challenge.id}-history-${i}`}
            className="group rounded-xl border border-border bg-surface"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
              <span className="font-medium text-text-primary">
                {entry.challenge.question}
              </span>
              <Badge variant={entry.evaluation.assessmentChange.changed ? 'info' : 'warning'}>
                {entry.evaluation.assessmentChange.changed ? 'Shifted' : 'Unchanged'}
              </Badge>
            </summary>
            <div className="flex flex-col gap-4 border-t border-border p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Your response
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                  {entry.response}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  AI counterargument
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">
                  {entry.evaluation.counterargument}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Remaining concern
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {entry.evaluation.remainingConcern}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

function ChallengeSummary({ history, onRestart }) {
  const weaknesses = []
  const stronger = []
  const nextActions = []
  history.forEach((entry) => {
    weaknesses.push(entry.evaluation.remainingConcern)
    if (entry.evaluation.assessmentChange.changed) {
      stronger.push(entry.evaluation.addressedConcern)
    }
    nextActions.push(entry.evaluation.nextAction)
  })
  const uniqueWeaknesses = [...new Set(weaknesses)].filter(Boolean)
  const uniqueStronger = [...new Set(stronger)].filter(Boolean)
  const uniqueNext = [...new Set(nextActions)].filter(Boolean)

  return (
    <div className="flex flex-col gap-6" aria-live="polite">
      <Alert variant="info" title="AI simulation — not a verdict" icon>
        This summary reflects one skeptic’s view of your answers. It is a thinking
        aid, not a verified assessment. You make the final call.
      </Alert>

      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <h3 className="font-display text-h3 font-semibold tracking-tight text-text-primary">
          {history.length} of {history.length} challenges completed
        </h3>

        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-text-primary">Key weaknesses discovered</h4>
          {uniqueWeaknesses.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {uniqueWeaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">None surfaced.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-text-primary">What became stronger</h4>
          {uniqueStronger.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {uniqueStronger.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">
              No assumption was convincingly strengthened by the responses given.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-text-primary">What still needs validation</h4>
          {uniqueWeaknesses.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {uniqueWeaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">Nothing outstanding.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-text-primary">Recommended next actions</h4>
          {uniqueNext.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
              {uniqueNext.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No actions suggested.</p>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 border-border p-6 sm:p-8">
        <h4 className="font-semibold text-text-primary">Next phase</h4>
        <p className="text-sm text-text-secondary">
          Validation Experiments (Phase 8) will turn these challenges into concrete
          tests. That step isn’t available yet.
        </p>
        <div>
          <Button variant="secondary" disabled>
            Continue to Validation Experiments
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={onRestart}>
          Restart challenge mode
        </Button>
      </div>
    </div>
  )
}

function ProgressBar({ current, total }) {
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <p className="text-sm font-medium text-text-primary">
        Challenge {current} of {total}
      </p>
      <div
        className="h-2 w-full rounded-full bg-border"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Challenge ${current} of ${total}`}
      >
        <div
          className="h-2 rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

export function ChallengeMode({ idea, analysis }) {
  const [phase, setPhase] = useState('loading') // loading | answering | evaluating | result | summary
  const [challenges, setChallenges] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answerError, setAnswerError] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState(null)
  const [stageMessage, setStageMessage] = useState('')
  const retryRef = useRef(() => loadChallenges())
  const timers = useRef([])
  const answerRef = useRef(null)
  const resultRef = useRef(null)

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

  async function loadChallenges() {
    clearTimers()
    setError(null)
    setPhase('loading')
    setStageMessage(GEN_STAGES[0])
    runStagedMessages(GEN_STAGES)
    // staged messages are UI-only; start the real request immediately
    try {
      const list = await fetchChallenges(idea, analysis)
      clearTimers()
      setChallenges(list)
      setCurrentIndex(0)
      setAnswer('')
      setAnswerError('')
      setEvaluation(null)
      setPhase('answering')
      setTimeout(() => answerRef.current?.focus(), 50)
    } catch (err) {
      clearTimers()
      setError(
        err.message || 'Challenge questions could not be generated. Please try again.',
      )
      retryRef.current = loadChallenges
      setPhase('error')
    }
  }

  useEffect(() => {
    loadChallenges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAnswerChange(e) {
    setAnswer(e.target.value)
    if (answerError) setAnswerError('')
  }

  async function handleSubmit() {
    const trimmed = answer.trim()
    if (trimmed.length < MIN_ANSWER) {
      setAnswerError(
        `Please write a bit more — at least ${MIN_ANSWER} characters so the challenge can be meaningful.`,
      )
      answerRef.current?.focus()
      return
    }

    setAnswerError('')
    setError(null)
    setEvaluation(null)
    setPhase('evaluating')
    setStageMessage(EVAL_STAGES[0])
    runStagedMessages(EVAL_STAGES)

    const challenge = challenges[currentIndex]
    try {
      const result = await evaluateChallenge(idea, analysis, challenge, trimmed)
      clearTimers()
      setEvaluation(result)
      setHistory((h) => [
        ...h,
        {
          challenge,
          response: trimmed,
          evaluation: result,
          timestamp: new Date().toISOString(),
        },
      ])
      setPhase('result')
      setTimeout(() => resultRef.current?.focus(), 50)
    } catch (err) {
      clearTimers()
      setError(
        err.message || 'We couldn’t evaluate this response right now. Please try again.',
      )
      retryRef.current = handleSubmit
      setPhase('error')
    }
  }

  function handleNext() {
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex((i) => i + 1)
      setAnswer('')
      setAnswerError('')
      setEvaluation(null)
      setPhase('answering')
      setTimeout(() => answerRef.current?.focus(), 50)
    } else {
      setPhase('summary')
    }
  }

  function handleRestart() {
    setHistory([])
    loadChallenges()
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
        <Alert variant="danger" title="We couldn’t run this challenge" icon>
          {error}
        </Alert>
        <div>
          <Button onClick={() => retryRef.current?.()}>Try again</Button>
        </div>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <div className="flex flex-col gap-10">
        <ChallengeSummary history={history} onRestart={handleRestart} />
        <HistoryPanel history={history} />
      </div>
    )
  }

  const challenge = challenges[currentIndex]

  if (phase === 'evaluating') {
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

  if (phase === 'result' && evaluation) {
    return (
      <div className="flex flex-col gap-10">
        <ProgressBar current={currentIndex + 1} total={challenges.length} />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Challenge {currentIndex + 1}
          </p>
          <h3 className="mt-1 font-display text-h3 font-semibold tracking-tight text-text-primary">
            {challenge.question}
          </h3>
        </div>
        <ChallengeResult
          evaluation={evaluation}
          onNext={handleNext}
          isLast={currentIndex === challenges.length - 1}
          resultRef={resultRef}
        />
        <HistoryPanel history={history} />
      </div>
    )
  }

  // phase === 'answering'
  return (
    <div className="flex flex-col gap-10">
      <ProgressBar current={currentIndex + 1} total={challenges.length} />

      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{challenge.target}</Badge>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Challenge {currentIndex + 1}
          </p>
          <h3 className="mt-1 font-display text-h3 font-semibold tracking-tight text-text-primary">
            {challenge.question}
          </h3>
        </div>
        <div className="rounded-lg border border-border bg-elevated/40 p-4">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Why this matters: </span>
            {challenge.rationale}
          </p>
        </div>

        <Textarea
          ref={answerRef}
          label="Your response"
          required
          id="challenge-answer"
          rows={5}
          value={answer}
          error={answerError}
          onChange={handleAnswerChange}
          description="Answer like you’re defending the idea to a skeptical investor. There are no wrong answers — this is a simulation."
          placeholder="Explain your thinking, evidence, or plan for this challenge…"
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSubmit}>Submit response</Button>
          {history.length > 0 && (
            <Button variant="ghost" onClick={() => setPhase('summary')}>
              Skip to summary
            </Button>
          )}
        </div>
      </Card>

      {history.length > 0 && <HistoryPanel history={history} />}
    </div>
  )
}
