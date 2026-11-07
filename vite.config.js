import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Endpoints de disponibilidad para desarrollo y preview.
 * En producción los implementa `server/index.mjs`; aquí permiten probar el
 * panel de administración sin levantar el servidor Node.
 */
function availabilityEndpoints() {
  const middleware = (request, response, next) => {
    const url = (request.url ?? '').split('?')[0]
    const nodeProcess = globalThis.process

    if (url === '/health') {
      const maintenance = nodeProcess?.env?.MAINTENANCE_MODE === 'true'

      response.statusCode = 200
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')
      response.end(
        JSON.stringify({
          status: maintenance ? 'maintenance' : 'ok',
          uptimeSeconds: Math.round(nodeProcess?.uptime?.() ?? 0),
          version: nodeProcess?.env?.npm_package_version ?? '1.0.0',
          environment: 'development',
          maintenance,
          timestamp: new Date().toISOString(),
        }),
      )
      return
    }

    if (url === '/api/alerts/test' && request.method === 'POST') {
      response.statusCode = 200
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')
      response.end(
        JSON.stringify({
          delivered: false,
          channel: 'Panel',
          error:
            'Configura ALERT_WEBHOOK_URL en el servidor para enviar la alerta a Slack.',
        }),
      )
      return
    }

    next()
  }

  return {
    name: 'availability-endpoints',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

/**
 * Reproduce en `vite preview` las cabeceras del servidor real (`public/_headers`
 * y `vercel.json`). Así el benchmark local mide las mismas reglas de caché que
 * se aplican en Netlify, Cloudflare Pages o Vercel.
 */
function productionCacheHeaders() {
  return {
    name: 'production-cache-headers',
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url ?? ''

        if (url.startsWith('/assets/')) {
          response.setHeader(
            'Cache-Control',
            'public, max-age=31536000, immutable',
          )
        } else if (
          url === '/' ||
          url.endsWith('/index.html') ||
          url.endsWith('/sw.js')
        ) {
          response.setHeader('Cache-Control', 'no-cache')
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    availabilityEndpoints(),
    productionCacheHeaders(),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    // Separa React del código de la app para aprovechar la caché del navegador
    // entre despliegues: solo cambia el chunk que realmente se modificó.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'react-vendor'
          }
          return undefined
        },
      },
    },
  },
})
