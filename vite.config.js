import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { analyzeHandler } from './api/analyzeCore.js'
import { challengeHandler } from './api/challengeCore.js'
import { experimentHandler } from './api/experimentsCore.js'

/**
 * During local development Vite serves the SPA, but the API routes live in
 * /api (Vercel Serverless Functions). These dev-only middlewares expose
 * POST /api/analyze and POST /api/challenge by delegating to the same handlers
 * used in production, so the client wiring works end-to-end locally.
 */
function apiDevPlugin() {
  return {
    name: 'ideaproof-api-dev',
    configureServer(server) {
      const mount = (path, handler) => {
        server.middlewares.use(path, async (req, res, next) => {
          if (req.method !== 'POST') return next()
          try {
            await handler(req, res)
          } catch {
            if (!res.headersSent) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Internal API error.' }))
            }
          }
        })
      }
      mount('/api/analyze', analyzeHandler)
      mount('/api/challenge', challengeHandler)
      mount('/api/experiments', experimentHandler)
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'dist', 'src/test/e2e/**', 'playwright.config.js'],
  },
})
