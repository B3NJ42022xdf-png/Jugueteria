/**
 * Benchmark HTTP del build de producción.
 *
 * Uso:
 *   npm run build
 *   npm run preview
 *   npm run benchmark
 *
 * Simula tráfico regular y produce `public/performance-report.json`, que el
 * panel de administración muestra en la pestaña "Rendimiento". Es un
 * equivalente ligero a JMeter para este proyecto frontend.
 */

import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BENCH_URL ?? 'http://localhost:4173'
const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 20)
// Escenario de aceptación: al menos 500 compradores simultáneos.
const CONCURRENCY = Number(
  process.env.BENCH_CONCURRENCY ?? process.env.BENCH_USERS ?? 500,
)
const MAX_P95_MS = Number(process.env.BENCH_MAX_P95_MS ?? 1500)
const MAX_FAILURE_RATE = Number(process.env.BENCH_MAX_FAILURE_RATE ?? 0.01)
const ROUTES = [
  '/catalogo',
  '/registro',
  '/producto/lego-castillo-medieval',
  '/carrito',
]
const REPORT_PATH = path.resolve('public/performance-report.json')

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  )
  return sorted[index] ?? 0
}

function round(value) {
  return Math.round(value * 100) / 100
}

async function timedFetch(url) {
  const startedAt = performance.now()
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const body = await response.text()

  return {
    durationMs: performance.now() - startedAt,
    status: response.status,
    bytes: Buffer.byteLength(body),
    body,
  }
}

async function benchmarkRoute(route) {
  // Calentamiento para descartar la primera conexión.
  for (let index = 0; index < 3; index += 1) {
    await timedFetch(`${BASE_URL}${route}`)
  }

  const samples = []
  for (let index = 0; index < ITERATIONS; index += 1) {
    samples.push(await timedFetch(`${BASE_URL}${route}`))
  }

  const durations = samples.map((sample) => sample.durationMs)
  const failures = samples.filter((sample) => sample.status >= 400).length

  return {
    route,
    requests: samples.length,
    status: samples[0]?.status ?? 0,
    avgMs: round(durations.reduce((total, value) => total + value, 0) / durations.length),
    p95Ms: round(percentile(durations, 0.95)),
    maxMs: round(Math.max(...durations)),
    failures,
    bytes: samples[0]?.bytes ?? 0,
  }
}

async function loadTest() {
  const target = `${BASE_URL}/registro`

  // Calentamiento: evita medir el establecimiento inicial de conexiones.
  await timedFetch(target)

  const startedAt = performance.now()
  const responses = await Promise.all(
    Array.from({ length: CONCURRENCY }).map(() => timedFetch(target)),
  )
  const totalMs = Math.max(performance.now() - startedAt, 1)
  const durations = responses.map((response) => response.durationMs)
  const failures = responses.filter((response) => response.status >= 400).length
  const failureRate = failures / responses.length
  const p95Ms = percentile(durations, 0.95)
  const p99Ms = percentile(durations, 0.99)

  return {
    target,
    concurrency: CONCURRENCY,
    totalMs: round(totalMs),
    avgMs: round(
      durations.reduce((total, value) => total + value, 0) / durations.length,
    ),
    p95Ms: round(p95Ms),
    p99Ms: round(p99Ms),
    maxMs: round(Math.max(...durations)),
    requestsPerSecond: round((responses.length / totalMs) * 1000),
    failures,
    failureRate: round(failureRate * 100) / 100,
    thresholds: {
      maxP95Ms: MAX_P95_MS,
      maxFailureRate: MAX_FAILURE_RATE,
    },
    passed: failureRate <= MAX_FAILURE_RATE && p95Ms <= MAX_P95_MS,
  }
}

async function assetsSummary() {
  const { body } = await timedFetch(`${BASE_URL}/catalogo`)
  const assetPaths = [...new Set(body.match(/\/assets\/[^"']+/g) ?? [])]
  const assets = []

  for (const assetPath of assetPaths) {
    const startedAt = performance.now()
    const response = await fetch(`${BASE_URL}${assetPath}`)
    const buffer = await response.arrayBuffer()
    assets.push({
      path: assetPath,
      bytes: buffer.byteLength,
      durationMs: round(performance.now() - startedAt),
      cacheControl: response.headers.get('cache-control') ?? '',
    })
  }

  return assets.sort((a, b) => b.bytes - a.bytes)
}

function readExistingReport() {
  try {
    return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'))
  } catch {
    return {}
  }
}

const existing = readExistingReport()
const routes = []

for (const route of ROUTES) {
  routes.push(await benchmarkRoute(route))
}

const load = await loadTest()
const assets = await assetsSummary()
const report = {
  generatedAt: new Date().toISOString(),
  tool: 'Node fetch · benchmark HTTP (equivalente a JMeter)',
  target: BASE_URL,
  iterations: ITERATIONS,
  routes,
  loadTest: load,
  assets,
  lighthouse: existing.lighthouse ?? null,
}

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)

console.log(JSON.stringify(report, null, 2))

if (!load.passed) {
  console.error(
    `\n[benchmark] No cumple el umbral de 500 usuarios: p95=${load.p95Ms} ms ` +
      `(máx ${MAX_P95_MS} ms), fallos=${(load.failureRate * 100).toFixed(2)} %.`,
  )
  process.exitCode = 1
} else {
  console.log(
    `\n[benchmark] OK · ${load.concurrency} usuarios concurrentes · ` +
      `${load.requestsPerSecond} req/s · p95=${load.p95Ms} ms.`,
  )
}
