import { analyzeHandler } from './analyzeCore.js'

export default async function handler(req, res) {
  await analyzeHandler(req, res)
}
