import { analyzeHandler } from './analyzeCore'

export default async function handler(req, res) {
  await analyzeHandler(req, res)
}
