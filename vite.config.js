import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { analyzeHandler } from './api/analyzeCore.js'

/**
 * During local development Vite serves the SPA, but the analysis route lives in
 * /api (a Vercel Serverless Function). This dev-only middleware exposes
 * POST /api/analyze by delegating to the same handler used in production, so the
 * client wiring works end-to-end locally without Vercel.
 */
function apiAnalyzeDevPlugin() {
  return {
    name: 'ideaproof-api-analyze-dev',
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res, next) => {
        if (req.method !== 'POST') return next()
        try {
          await analyzeHandler(req, res)
        } catch {
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Internal analysis error.' }))
          }
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiAnalyzeDevPlugin()],
})
