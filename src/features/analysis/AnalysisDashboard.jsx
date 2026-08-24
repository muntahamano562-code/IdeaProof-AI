import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { ScoreRing } from '../../components/analysis/ScoreRing'
import { RiskRadar } from '../../components/analysis/RiskRadar'

const severityVariant = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

const verdictVariant = {
  BUILD: 'success',
  PIVOT: 'warning',
  "DON'T BUILD": 'danger',
}

function confidenceLabel(c) {
  if (c < 40) return 'Low'
  if (c < 70) return 'Moderate'
  return 'High'
}

function scoreColor(value) {
  if (value >= 70) return 'rgb(var(--color-success))'
  if (value >= 40) return 'rgb(var(--color-warning))'
  return 'rgb(var(--color-danger))'
}

function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-h3 font-semibold tracking-tight text-text-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function Paragraph({ children }) {
  return <p className="whitespace-pre-wrap text-text-primary">{children}</p>
}

export function AnalysisDashboard({ analysis }) {
  if (!analysis) return null

  const {
    summary,
    problemAnalysis,
    targetAudienceAnalysis,
    feasibilityAnalysis,
    competitionAnalysis,
    assumptions,
    risks,
    categoryScores,
    overallScore,
    confidence,
    mvpRecommendation,
    experiments,
    verdict,
  } = analysis

  return (
    <div className="flex flex-col gap-10">
      <Alert variant="info" title="AI assessment" icon>
        The idea text is what you provided. Everything below is an AI-generated
        assessment based on that information — a perspective to challenge your
        thinking, not a statement of fact. You make the final call.
      </Alert>

      {/* Overview: score ring + current recommendation */}
      <Card className="p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-[auto,1fr] md:items-center">
          <ScoreRing value={overallScore} label="Overall score" />
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              AI assessment based on the information provided.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-text-secondary">AI confidence:</span>
              <span className="font-mono text-sm text-text-primary">
                {confidence}% ({confidenceLabel(confidence)})
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-1">
              <span className="text-sm text-text-secondary">
                Current recommendation
              </span>
              <Badge variant={verdictVariant[verdict] || 'neutral'}>
                {verdict}
              </Badge>
              <p className="mt-2 text-sm text-text-secondary">
                Based on the information available. This is a recommendation, not
                a decree — what you do next is your decision.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Category scores */}
      <Section
        title="Category scores"
        description="Each category is scored with an explanation — a number is never shown alone."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryScores.map((item, i) => (
            <Card key={`${item.category}-${i}`} className="flex flex-col gap-3 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-semibold text-text-primary">{item.category}</h4>
                <span className="font-mono text-sm text-text-secondary">
                  {item.score}/100
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full bg-border"
                role="img"
                aria-label={`${item.category} score ${item.score} out of 100`}
              >
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, item.score))}%`,
                    backgroundColor: scoreColor(item.score),
                  }}
                />
              </div>
              <Paragraph>{item.explanation}</Paragraph>
            </Card>
          ))}
        </div>
      </Section>

      {/* Risks */}
      <Section
        title="Risks"
        description="Severity is shown with a label and color, never by color alone."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="hidden p-4 md:block">
            <RiskRadar risks={risks} />
          </Card>
          <Card className="flex flex-col gap-4 p-5">
            <ul className="flex flex-col gap-4">
              {risks.map((item, i) => (
                <li
                  key={`${item.risk}-${i}`}
                  className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant[item.severity] || 'neutral'}>
                      {item.severity}
                    </Badge>
                    <span className="font-medium text-text-primary">
                      {item.risk}
                    </span>
                  </div>
                  {item.note && <Paragraph>{item.note}</Paragraph>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* Assumptions */}
      {assumptions.length > 0 && (
        <Section
          title="Assumptions"
          description="Beliefs that must hold true for this idea to work, and why they matter."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {assumptions.map((item, i) => (
              <Card key={`${item.assumption}-${i}`} className="flex flex-col gap-2 p-5">
                <h4 className="font-semibold text-text-primary">
                  {item.assumption}
                </h4>
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Why it matters:{' '}
                  </span>
                  {item.rationale}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Key findings */}
      <Section title="Key findings">
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          <div>
            <h4 className="font-semibold text-text-primary">Summary</h4>
            <Paragraph>{summary}</Paragraph>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary">Problem analysis</h4>
            <Paragraph>{problemAnalysis}</Paragraph>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary">
              Target audience analysis
            </h4>
            <Paragraph>{targetAudienceAnalysis}</Paragraph>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary">
              Feasibility analysis
            </h4>
            <Paragraph>{feasibilityAnalysis}</Paragraph>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary">
              Competition analysis
            </h4>
            <Paragraph>{competitionAnalysis}</Paragraph>
          </div>
        </Card>
      </Section>

      {/* MVP recommendation */}
      <Section title="MVP recommendation">
        <Card className="p-6 sm:p-8">
          <Paragraph>{mvpRecommendation}</Paragraph>
        </Card>
      </Section>

      {/* Validation experiments preview */}
      {experiments.length > 0 && (
        <Section
          title="Validation experiments"
          description="Preview based on the analysis. Full experiment tracking arrives in a later phase."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {experiments.map((item, i) => (
              <Card
                key={`${item.title}-${i}`}
                className="flex flex-col gap-2 border-border p-5"
              >
                <h4 className="font-semibold text-text-primary">{item.title}</h4>
                <p className="text-sm text-text-secondary">
                  Success criteria: {item.successCriteria}
                </p>
                <p className="text-sm text-text-secondary">
                  Timeline: {item.timeline}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
