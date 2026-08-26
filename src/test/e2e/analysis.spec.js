import { test, expect } from '@playwright/test'

const ANALYSIS = {
  summary:
    'Adaptive prioritization addresses a real student pain point with a clear differentiator.',
  problemAnalysis: 'Frequent and relatable for the target segment.',
  targetAudienceAnalysis: 'Well-defined but narrow.',
  feasibilityAnalysis: 'Buildable with common web stacks.',
  competitionAnalysis: 'Few tools adapt dynamically to urgency.',
  assumptions: [{ assumption: 'Students will switch tools.', rationale: 'Switching costs are high.' }],
  risks: [{ risk: 'Low willingness to pay.', severity: 'HIGH', note: 'Free alternatives exist.' }],
  categoryScores: [
    { category: 'Problem Clarity', score: 78, explanation: 'Concrete and relatable.' },
  ],
  overallScore: 62,
  confidence: 58,
  mvpRecommendation: 'Manual MVP that auto-ranks assignments.',
  experiments: [
    { title: 'Interview students', successCriteria: 'At least 5 of 8', timeline: '1 week' },
  ],
  verdict: 'PIVOT',
}

async function mockAiRoutes(page) {
  await page.route('**/api/analyze', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANALYSIS) }),
  )
  await page.route('**/api/experiments', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  )
  await page.route('**/api/challenge', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  )
}

test('new idea → AI analysis → saved → report, without re-calling the AI', async ({ page }) => {
  await mockAiRoutes(page)

  await page.goto('/ideas/new')
  await page.fill('#idea-title', 'Study planner for overwhelmed students')
  await page.fill(
    '#idea-description',
    'A planner that adapts to each student course load and surfaces the most urgent assignments first.',
  )
  await page.fill('#idea-target-users', 'University students')
  await page.fill('#idea-problem', 'Students lose track of deadlines across unrelated course tools.')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page).toHaveURL(/\/ideas\//)

  await page.getByRole('button', { name: 'Run analysis' }).click()
  await expect(page.getByText('Category scores')).toBeVisible()
  await expect(page.getByText('AI confidence')).toBeVisible()

  // History should now contain the saved idea.
  await page.goto('/history')
  await expect(page.getByText('Study planner for overwhelmed students')).toBeVisible()

  // The "Open" control is the real history link. Use an exact name match so the
  // dev-only "dev · open component playground" anchor (whose accessible name also
  // contains "open") is never selected, and navigate deterministically.
  const openLink = page
    .getByRole('link', { name: 'Open', exact: true })
    .first()
  await expect(openLink).toBeVisible()
  await expect(openLink).toHaveAttribute('href', /^\/ideas\/[^/]+$/)

  await Promise.all([
    page.waitForURL(/\/ideas\/[^/]+$/),
    openLink.click(),
  ])
  await expect(page.getByText('AI analysis')).toBeVisible()

  await page.getByRole('link', { name: 'View full report' }).click()
  await expect(page.getByText('Validation report')).toBeVisible()
  await expect(page.getByText('AI assessment notice')).toBeVisible()
})

test('history restores a saved idea without re-running the AI', async ({ page }) => {
  await mockAiRoutes(page)

  // Create and analyze one idea first.
  await page.goto('/ideas/new')
  await page.fill('#idea-title', 'Campus carpool board')
  await page.fill(
    '#idea-description',
    'A simple board where students coordinate rides to and from campus to cut commute cost.',
  )
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/\/ideas\//)
  await page.getByRole('button', { name: 'Run analysis' }).click()
  await expect(page.getByText('Category scores')).toBeVisible()

  // Reopen from history in a fresh navigation: the saved record loads directly.
  await page.goto('/history')
  const openLink = page
    .getByRole('link', { name: 'Open', exact: true })
    .first()
  await expect(openLink).toBeVisible()
  await expect(openLink).toHaveAttribute('href', /^\/ideas\/[^/]+$/)

  await Promise.all([
    page.waitForURL(/\/ideas\/[^/]+$/),
    openLink.click(),
  ])
  await expect(page.getByText('AI analysis')).toBeVisible()
  await expect(page.getByText('Category scores')).toBeVisible()
})
