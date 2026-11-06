import { defineConfig, loadEnv, type Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Fallback CSP for production builds (dev needs Vite's inline scripts). The host should
// also send it, plus frame-ancestors and HSTS, as real response headers.
// connect-src: the API, plus the Sentry ingest host when error monitoring is on.
function contentSecurityPolicy(apiUrl: string, sentryDsn?: string): Plugin {
  const sentryOrigin = sentryDsn ? new URL(sentryDsn).origin : ''
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:", // company logos (https only)
    "font-src 'self'",
    // A relative API URL ("/api", same origin) is covered by 'self'.
    `connect-src 'self'${apiUrl.startsWith('/') ? '' : ` ${apiUrl}`}${sentryOrigin ? ` ${sentryOrigin}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' as const }],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  return {
    plugins: [react(), tailwindcss(), contentSecurityPolicy(env.VITE_API_URL || 'http://localhost:5000', env.VITE_SENTRY_DSN)],
    // exceljs (~930 kB) is only fetched when someone exports a report.
    build: { chunkSizeWarningLimit: 1000 },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Use the shared package's TypeScript source directly (no build step for the client).
        '@masar/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
      },
    },
  }
})
