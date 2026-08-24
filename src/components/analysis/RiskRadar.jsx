import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

const severityNum = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
const severityColor = {
  LOW: 'rgb(var(--color-risk-low))',
  MEDIUM: 'rgb(var(--color-risk-medium))',
  HIGH: 'rgb(var(--color-risk-high))',
  CRITICAL: 'rgb(var(--color-risk-critical))',
}

function topSeverity(risks) {
  return risks.reduce(
    (top, r) => (severityNum[r.severity] > severityNum[top] ? r.severity : top),
    'LOW',
  )
}

/**
 * Risk Radar (Recharts). Plot severity (1-4) per risk as the single axis
 * series, colored by the highest severity present. The accessible text
 * equivalent (severity badges + risk text) is rendered by the dashboard, so
 * this chart is hidden on small screens via its container.
 */
export function RiskRadar({ risks }) {
  if (!risks || risks.length === 0) return null

  const data = risks.map((r) => ({ risk: r.risk, value: severityNum[r.severity] }))
  const color = severityColor[topSeverity(risks)]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="rgb(var(--color-border))" />
        <PolarAngleAxis
          dataKey="risk"
          tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11 }}
        />
        <PolarRadiusAxis
          domain={[0, 4]}
          tickCount={5}
          axisLine={false}
          tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 10 }}
        />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
