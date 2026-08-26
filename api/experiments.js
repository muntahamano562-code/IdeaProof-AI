import { experimentHandler } from './experimentsCore'

export default async function handler(req, res) {
  await experimentHandler(req, res)
}
