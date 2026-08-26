export const experimentPlanFixture = [
  {
    id: 'experiment-1',
    hypothesis: 'Students will manually add assignments if it takes under two minutes.',
    method: '5 user interviews with a paper prototype.',
    successCriteria: 'At least 4 of 5 complete the task in under 2 minutes.',
    effort: 'LOW',
    timeline: '1 week',
    assumptionIds: ['assumption-1'],
  },
  {
    id: 'experiment-2',
    hypothesis: 'A subset of students will pay for automated prioritization.',
    method: 'Pricing survey with 20 respondents.',
    successCriteria: 'At least 6 of 20 indicate willingness to pay $5/month.',
    effort: 'MEDIUM',
    timeline: '2 weeks',
    assumptionIds: ['assumption-2', 'risk-1'],
  },
]
