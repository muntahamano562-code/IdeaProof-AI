import { ideaFixture } from './idea'
import { analysisFixture } from './analysis'

export { ideaFixture }
export { analysisFixture }

export const historyFixture = {
  id: ideaFixture.id,
  idea: ideaFixture,
  analysis: analysisFixture,
  createdAt: ideaFixture.createdAt,
  updatedAt: ideaFixture.updatedAt,
}

export const historyStoreFixture = {
  version: 1,
  items: [historyFixture],
}
