import { challengeHandler } from './challengeCore'

export default async function handler(req, res) {
  await challengeHandler(req, res)
}
