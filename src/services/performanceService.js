/**
 * Rendimiento de la tienda (presupuestos, métricas y benchmark).
 *
 * Este módulo centraliza las mediciones que exige el proyecto:
 *  - carga del catálogo ≤ 2 s,
 *  - peticiones asíncronas ≤ 1 s,
 *  - búsquedas ≤ 250 ms,
 *  - ahorro obtenido al convertir imágenes a WebP.
 *
 * Las métricas se guardan en `sessionStorage` para que el panel de
 * administración pueda mostrar evidencias sin afectar visitas futuras. En
 * producción estos números deberían reportarse a un servicio de observabilidad.
 */

export const PERFORMANCE_BUDGETS = {
  catalogLoadMs: 2000,
  asyncRequestMs: 1000,
  searchMs: 250,
}

const METRICS_KEY = 'jugueteria.performance.v1'
const IMAGE_METRICS_KEY = 'jugueteria.imageOptimization.v1'
const MAX_METRICS = 120

function readArray(key) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeArray(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Si el navegador bloquea el almacenamiento, la app sigue funcionando.
  }
}

function round(value) {
  return Math.round(value * 100) / 100
}

function percentile(values, ratio) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  )
  return sorted[index]
}

/* ------------------------------------------------------------------ */
/* Métricas de peticiones                                              */
/* ------------------------------------------------------------------ */

export function recordMetric({ type, label, durationMs, meta = {} }) {
  const entry = {
    id: crypto.randomUUID(),
    type,
    label,
    durationMs: round(Math.max(0, Number(durationMs) || 0)),
    at: new Date().toISOString(),
    meta,
  }
  const metrics = [...readArray(METRICS_KEY), entry].slice(-MAX_METRICS)
  writeArray(METRICS_KEY, metrics)
  return entry
}

/** Mide una operación síncrona (filtros, ordenamientos, etc.). */
export function measureSync(type, label, operation) {
  const startedAt = performance.now()
  const result = operation()

  recordMetric({
    type,
    label,
    durationMs: performance.now() - startedAt,
  })

  return result
}

/** Mide una promesa y registra su duración real. */
export function measureAsync(type, label, operation) {
  const startedAt = performance.now()

  return Promise.resolve()
    .then(operation)
    .then((result) => {
      recordMetric({
        type,
        label,
        durationMs: performance.now() - startedAt,
        meta: { ok: true },
      })
      return result
    })
    .catch((error) => {
      recordMetric({
        type,
        label,
        durationMs: performance.now() - startedAt,
        meta: { ok: false },
      })
      throw error
    })
}

export function getMetrics() {
  return readArray(METRICS_KEY)
}

export function clearMetrics() {
  writeArray(METRICS_KEY, [])
  writeArray(IMAGE_METRICS_KEY, [])
}

function summarize(metrics, type) {
  const values = metrics
    .filter((metric) => metric.type === type)
    .map((metric) => metric.durationMs)

  return {
    count: values.length,
    last: values.at(-1) ?? 0,
    average: values.length
      ? round(values.reduce((total, value) => total + value, 0) / values.length)
      : 0,
    max: values.length ? round(Math.max(...values)) : 0,
    p95: round(percentile(values, 0.95)),
  }
}

export function getPerformanceSnapshot() {
  const metrics = getMetrics()
  const images = readArray(IMAGE_METRICS_KEY)
  const beforeBytes = images.reduce(
    (total, item) => total + item.beforeBytes,
    0,
  )
  const afterBytes = images.reduce((total, item) => total + item.afterBytes, 0)
  const catalog = summarize(metrics, 'catalog')
  const request = summarize(metrics, 'request')
  const search = summarize(metrics, 'search')

  return {
    budgets: PERFORMANCE_BUDGETS,
    catalog,
    request,
    search,
    images: {
      count: images.length,
      beforeBytes,
      afterBytes,
      savedBytes: Math.max(0, beforeBytes - afterBytes),
      savedPercent:
        beforeBytes > 0
          ? round(((beforeBytes - afterBytes) / beforeBytes) * 100)
          : 0,
    },
    budgetStatus: {
      catalog: catalog.count === 0 || catalog.p95 <= PERFORMANCE_BUDGETS.catalogLoadMs,
      request:
        request.count === 0 ||
        request.p95 <= PERFORMANCE_BUDGETS.asyncRequestMs,
      search: search.count === 0 || search.p95 <= PERFORMANCE_BUDGETS.searchMs,
    },
    metrics: metrics.slice(-12).reverse(),
  }
}

/* ------------------------------------------------------------------ */
/* Imágenes WebP                                                       */
/* ------------------------------------------------------------------ */

export function recordImageOptimization({
  beforeBytes,
  afterBytes,
  sourceType = '',
}) {
  const entry = {
    id: crypto.randomUUID(),
    beforeBytes: Number(beforeBytes) || 0,
    afterBytes: Number(afterBytes) || 0,
    sourceType,
    at: new Date().toISOString(),
  }
  writeArray(
    IMAGE_METRICS_KEY,
    [...readArray(IMAGE_METRICS_KEY), entry].slice(-MAX_METRICS),
  )
  return entry
}

/* ------------------------------------------------------------------ */
/* Navigation Timing                                                   */
/* ------------------------------------------------------------------ */

export function getNavigationTiming() {
  if (typeof performance === 'undefined') return null

  const [navigation] = performance.getEntriesByType('navigation')
  if (!navigation) return null

  return {
    ttfb: round(navigation.responseStart - navigation.requestStart),
    domContentLoaded: round(
      navigation.domContentLoadedEventEnd - navigation.startTime,
    ),
    load: round(navigation.loadEventEnd - navigation.startTime),
    transferSize: navigation.transferSize,
  }
}

/* ------------------------------------------------------------------ */
/* Benchmark ejecutable desde el panel                                 */
/* ------------------------------------------------------------------ */

/**
 * Mide la capa asíncrona real del catálogo: carga en frío, carga en caché y
 * búsqueda. Se usa desde la pestaña "Rendimiento" del panel de administración.
 */
export async function runPerformanceBenchmark({ iterations = 5 } = {}) {
  const api = await import('./catalogApi.js')
  const runs = []

  async function run(name, budgetMs, operation) {
    const startedAt = performance.now()
    await operation()
    const durationMs = round(performance.now() - startedAt)
    runs.push({
      name,
      budgetMs,
      durationMs,
      passed: durationMs <= budgetMs,
    })
  }

  api.invalidateCatalogCache()
  await run('Catálogo en frío', PERFORMANCE_BUDGETS.catalogLoadMs, () =>
    api.loadCatalog({ force: true }),
  )

  for (let index = 0; index < iterations; index += 1) {
    await run('Catálogo desde caché', PERFORMANCE_BUDGETS.asyncRequestMs, () =>
      api.loadCatalog(),
    )
  }

  await run('Búsqueda asíncrona', PERFORMANCE_BUDGETS.searchMs, () =>
    api.searchCatalog({ search: 'lego' }),
  )

  return {
    ranAt: new Date().toISOString(),
    runs,
    passed: runs.every((item) => item.passed),
    cache: api.getCacheStats(),
    navigation: getNavigationTiming(),
  }
}
