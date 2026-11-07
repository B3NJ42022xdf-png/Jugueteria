/**
 * Servidor HTTP de producción para Mi Juguetería.
 *
 * - Sirve el build de `dist/` con cabeceras de caché.
 * - Expone `/health` para UptimeRobot, Docker, PM2 y Nginx.
 * - Expone `/api/alerts/test` para reenviar alertas a Slack sin CORS.
 * - Soporta modo mantenimiento (`MAINTENANCE_MODE=true`) con respuesta 503.
 * - Cierra ordenadamente ante SIGTERM/SIGINT (PM2, Docker, systemd).
 *
 * No usa dependencias externas: solo módulos nativos de Node 18+.
 */

import {
  createReadStream,
  existsSync,
  statSync,
} from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT ?? 3000)
const HOST = process.env.HOST ?? '0.0.0.0'
const STARTED_AT = Date.now()
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true'
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL ?? ''
const APP_VERSION = process.env.APP_VERSION ?? '1.0.0'
const MAINTENANCE_FILE = path.join(ROOT, 'mantenimiento.html')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(payload))
}

function healthPayload() {
  return {
    status: MAINTENANCE_MODE ? 'maintenance' : 'ok',
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
    processUptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    version: APP_VERSION,
    environment: process.env.NODE_ENV ?? 'production',
    maintenance: MAINTENANCE_MODE,
    timestamp: new Date().toISOString(),
  }
}

function cacheControlFor(pathname, filePath) {
  if (pathname.startsWith('/assets/')) {
    return 'public, max-age=31536000, immutable'
  }

  if (
    path.basename(filePath) === 'index.html' ||
    pathname.endsWith('/sw.js') ||
    pathname.endsWith('/mantenimiento.html')
  ) {
    return 'no-cache'
  }

  return 'public, max-age=604800'
}

function resolveFile(pathname) {
  const relative = pathname.replace(/^\/+/, '')
  const candidate = path.resolve(ROOT, relative || 'index.html')

  if (!candidate.startsWith(`${ROOT}${path.sep}`) && candidate !== ROOT) {
    return null
  }

  return candidate
}

function serveFile(filePath, request, response) {
  if (!filePath || !existsSync(filePath)) return false

  let stats
  try {
    stats = statSync(filePath)
  } catch {
    return false
  }

  if (!stats.isFile()) return false

  const extension = path.extname(filePath).toLowerCase()
  response.statusCode = 200
  response.setHeader(
    'Content-Type',
    MIME_TYPES[extension] ?? 'application/octet-stream',
  )
  response.setHeader('Content-Length', stats.size)
  response.setHeader(
    'Cache-Control',
    cacheControlFor(request.url?.split('?')[0] ?? '/', filePath),
  )
  response.setHeader('X-Content-Type-Options', 'nosniff')

  if (request.method === 'HEAD') {
    response.end()
    return true
  }

  createReadStream(filePath).pipe(response)
  return true
}

function serveMaintenance(request, response) {
  if (existsSync(MAINTENANCE_FILE)) {
    response.statusCode = 503
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Retry-After', '600')
    if (request.method === 'HEAD') {
      response.end()
      return
    }
    createReadStream(MAINTENANCE_FILE).pipe(response)
    return
  }

  response.statusCode = 503
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.setHeader('Retry-After', '600')
  response.end('Mantenimiento programado. Volvemos pronto.')
}

function readBody(request, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk
      if (body.length > limit) {
        reject(new Error('Cuerpo de la petición demasiado grande.'))
        request.destroy()
      }
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

async function handleAlertTest(request, response) {
  let message = 'Alerta de prueba de Mi Juguetería.'

  try {
    const body = await readBody(request)
    const payload = body ? JSON.parse(body) : {}
    if (payload.message) message = String(payload.message).slice(0, 500)
  } catch {
    // Si el cuerpo no es JSON, se envía el mensaje por defecto.
  }

  if (!ALERT_WEBHOOK_URL) {
    sendJson(response, 200, {
      delivered: false,
      channel: 'Panel',
      error:
        'ALERT_WEBHOOK_URL no está configurado. La alerta quedó registrada en el panel.',
    })
    return
  }

  try {
    const webhook = await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
      signal: AbortSignal.timeout(5000),
    })

    if (!webhook.ok) {
      throw new Error(`El webhook respondió HTTP ${webhook.status}.`)
    }

    sendJson(response, 200, { delivered: true, channel: 'Slack' })
  } catch (error) {
    sendJson(response, 502, {
      delivered: false,
      channel: 'Panel',
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo entregar la alerta.',
    })
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? 'localhost'}`,
  )
  let pathname

  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    response.statusCode = 400
    response.end('Solicitud inválida.')
    return
  }

  if (pathname === '/health' || pathname === '/api/health') {
    sendJson(response, 200, healthPayload())
    return
  }

  if (pathname === '/api/alerts/test' && request.method === 'POST') {
    await handleAlertTest(request, response)
    return
  }

  if (MAINTENANCE_MODE) {
    serveMaintenance(request, response)
    return
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.setHeader('Allow', 'GET, HEAD, POST')
    response.end('Método no permitido.')
    return
  }

  const filePath = resolveFile(pathname)

  if (filePath && serveFile(filePath, request, response)) return

  const hasExtension = Boolean(path.extname(pathname))

  if (!hasExtension || request.headers.accept?.includes('text/html')) {
    const indexPath = path.join(ROOT, 'index.html')

    if (serveFile(indexPath, request, response)) return
  }

  response.statusCode = 404
  response.setHeader('Content-Type', 'text/plain; charset=utf-8')
  response.end('No encontrado.')
})

server.listen(PORT, HOST, () => {
  console.log(
    `Mi Juguetería disponible en http://${HOST}:${PORT} · mantenimiento=${
      MAINTENANCE_MODE ? 'sí' : 'no'
    }`,
  )

  // PM2 con `wait_ready: true` espera esta señal antes de dar el proceso por vivo.
  if (typeof process.send === 'function') process.send('ready')
})

let shuttingDown = false

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`Recibido ${signal}. Cerrando el servidor…`)

  server.close(() => {
    process.exit(0)
  })

  server.closeIdleConnections?.()
  setTimeout(() => server.closeAllConnections?.(), 5000).unref()
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
