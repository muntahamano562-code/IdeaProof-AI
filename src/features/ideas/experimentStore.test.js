import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadExperimentStatuses,
  saveExperimentStatuses,
  saveExperimentPlan,
  loadExperimentPlan,
} from './experimentStore'
import { experimentPlanFixture } from '../../test/fixtures/experiments'

const STATUS_KEY = 'ideaproof:experiments:test-idea-1'
const PLAN_KEY = 'ideaproof:experiments-plan:test-idea-1'

beforeEach(() => {
  localStorage.clear()
})

describe('experiment statuses', () => {
  it('loads empty safely', () => {
    expect(loadExperimentStatuses('test-idea-1')).toEqual({})
  })

  it('saves and loads statuses by idea id', () => {
    saveExperimentStatuses('test-idea-1', { 'experiment-1': 'DONE' })
    expect(loadExperimentStatuses('test-idea-1')).toEqual({
      'experiment-1': 'DONE',
    })
  })

  it('does not share statuses across ideas', () => {
    saveExperimentStatuses('test-idea-1', { 'experiment-1': 'DONE' })
    expect(loadExperimentStatuses('another-idea')).toEqual({})
  })

  it('fails safely on invalid stored data', () => {
    localStorage.setItem(STATUS_KEY, 'not-json')
    expect(loadExperimentStatuses('test-idea-1')).toEqual({})
  })

  it('ignores non-object stored data', () => {
    localStorage.setItem(STATUS_KEY, JSON.stringify([1, 2, 3]))
    expect(loadExperimentStatuses('test-idea-1')).toEqual({})
  })
})

describe('experiment plan', () => {
  it('saves and loads a plan by idea id', () => {
    saveExperimentPlan('test-idea-1', experimentPlanFixture)
    const loaded = loadExperimentPlan('test-idea-1')
    expect(loaded).toHaveLength(2)
    expect(loaded[0].id).toBe('experiment-1')
  })

  it('does not collide across ideas', () => {
    saveExperimentPlan('test-idea-1', experimentPlanFixture)
    expect(loadExperimentPlan('another-idea')).toEqual([])
  })

  it('returns [] on malformed plan', () => {
    localStorage.setItem(PLAN_KEY, '{"version":1}')
    expect(loadExperimentPlan('test-idea-1')).toEqual([])
  })

  it('returns [] when nothing stored', () => {
    expect(loadExperimentPlan('test-idea-1')).toEqual([])
  })
})
