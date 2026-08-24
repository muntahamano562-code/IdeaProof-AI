import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'

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

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Paragraph({ children }) {
  return <p className="whitespace-pre-wrap text-text-primary">{children}</p>
}

export function AnalysisView({ analysis }) {
  if (!analysis) return null

  const verdictLabel = analysis.verdict.replace("DON'T BUILD", "DON'T BUILD")

  return (
    <div className="mt-8 flex flex-col gap-8">
      <Alert variant="info" title="AI assessment" icon>
        This is an AI-generated assessment based on the information you provided.
        It is a perspective to challenge your thinking, not a statement of fact.
      </Alert>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text-secondary">Overall score</p>
            <p className="font-display text-4xl font-semibold text-text-primary">
              {analysis.overallScore}
              <span className="text-xl text-text-secondary"> / 100</span>
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Confidence: {analysis.confidence}%
            </p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm text-text-secondary">
              Current recommendation
            </span>
            <Badge variant={verdictVariant[analysis.verdict] || 'neutral'}>
              {verdictLabel}
            </Badge>
          </div>
        </div>
      </Card>

      <Section title="Key findings">
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          <div>
            <h3 className="font-semibold text-text-primary">Summary</h3>
            <Paragraph>{analysis.summary}</Paragraph>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Problem analysis</h3>
            <Paragraph>{analysis.problemAnalysis}</Paragraph>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              Target audience analysis
            </h3>
            <Paragraph>{analysis.targetAudienceAnalysis}</Paragraph>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              Feasibility analysis
            </h3>
            <Paragraph>{analysis.feasibilityAnalysis}</Paragraph>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              Competition analysis
            </h3>
            <Paragraph>{analysis.competitionAnalysis}</Paragraph>
          </div>
        </Card>
      </Section>

      <Section title="Category scores">
        <Card className="flex flex-col gap-4 p-6 sm:p-8">
          <ul className="flex flex-col gap-4">
            {analysis.categoryScores.map((item, i) => (
              <li key={`${item.category}-${i}`} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-text-primary">
                    {item.category}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {item.score} / 100
                  </span>
                </div>
                <Paragraph>{item.explanation}</Paragraph>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      {analysis.risks.length > 0 && (
        <Section title="Risks">
          <Card className="flex flex-col gap-4 p-6 sm:p-8">
            <ul className="flex flex-col gap-4">
              {analysis.risks.map((item, i) => (
                <li key={`${item.risk}-${i}`} className="flex flex-col gap-1">
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
        </Section>
      )}

      {analysis.assumptions.length > 0 && (
        <Section title="Assumptions">
          <Card className="flex flex-col gap-4 p-6 sm:p-8">
            <ul className="flex flex-col gap-4">
              {analysis.assumptions.map((item, i) => (
                <li key={`${item.assumption}-${i}`} className="flex flex-col gap-1">
                  <p className="font-medium text-text-primary">
                    {item.assumption}
                  </p>
                  <Paragraph>{item.rationale}</Paragraph>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      <Section title="MVP recommendation">
        <Card className="p-6 sm:p-8">
          <Paragraph>{analysis.mvpRecommendation}</Paragraph>
        </Card>
      </Section>

      {analysis.experiments.length > 0 && (
        <Section title="Validation experiments">
          <Card className="flex flex-col gap-4 p-6 sm:p-8">
            <ul className="flex flex-col gap-4">
              {analysis.experiments.map((item, i) => (
                <li
                  key={`${item.title}-${i}`}
                  className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <p className="font-medium text-text-primary">{item.title}</p>
                  <p className="text-sm text-text-secondary">
                    Success criteria: {item.successCriteria}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Timeline: {item.timeline}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}
    </div>
  )
}
