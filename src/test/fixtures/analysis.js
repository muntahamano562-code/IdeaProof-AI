export const analysisFixture = {
  summary:
    'The idea addresses a real, recurring student pain point with a clear differentiator: adaptive prioritization.',
  problemAnalysis:
    'The problem is real and frequent for the target segment, though intensity varies by course load.',
  targetAudienceAnalysis:
    'The audience is well-defined but may be narrow; willingness to pay is untested.',
  feasibilityAnalysis:
    'Technically feasible with standard web tooling; integration with course systems is the hard part.',
  competitionAnalysis:
    'Generic planners exist, but few adapt dynamically to urgency. Differentiation is plausible.',
  assumptions: [
    {
      assumption: 'Students will switch from their current tools.',
      rationale: 'Switching costs are high; adoption depends on clear early value.',
    },
    {
      assumption: 'Course data is accessible via APIs or exports.',
      rationale: 'Without data access, prioritization cannot be automatic.',
    },
  ],
  risks: [
    {
      risk: 'Low willingness to pay for another planner.',
      severity: 'HIGH',
      note: 'Many free alternatives exist.',
    },
    {
      risk: 'Course data integration is blocked by institutions.',
      severity: 'MEDIUM',
      note: 'Privacy and access policies vary.',
    },
  ],
  categoryScores: [
    { category: 'Problem Clarity', score: 78, explanation: 'Problem is concrete and relatable.' },
    { category: 'Market', score: 55, explanation: 'Niche but reachable via campuses.' },
    { category: 'Feasibility', score: 70, explanation: 'Buildable with common web stacks.' },
    { category: 'Differentiation', score: 66, explanation: 'Adaptive prioritization is a real edge.' },
    { category: 'Momentum', score: 40, explanation: 'No traction or validation yet.' },
  ],
  overallScore: 62,
  confidence: 58,
  mvpRecommendation:
    'Build a manual MVP that lets students paste assignments and auto-ranks them.',
  experiments: [
    {
      title: 'Interview 8 students about planning pain',
      successCriteria: 'At least 5 of 8 name deadline overload as a current priority.',
      timeline: '1 week',
    },
  ],
  verdict: 'PIVOT',
}
