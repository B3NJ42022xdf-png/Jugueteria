/**
 * API asíncrona del catálogo (simulación de backend + caché).
 *
 * Igual que en un backend real, la interfaz nunca lee `localStorage` para
 * pintar el catálogo: llama a `loadCatalog()` y espera una promesa. Esta capa:
 *  - resuelve en una promesa (equivalente a `fetch('/api/catalog')`),
 *  - mide cada respuesta con `performanceService`,
 *  - reutiliza una caché en memoria,
 *  - reutiliza una caché de sesión (`sessionStorage`) para visitas repetidas,
 *  - se invalida cuando el administrador cambia productos, stock u opiniones.
 *
 * En producción solo hay que reemplazar el cuerpo de `loadCatalog` por un
 * `fetch` real; la interfaz y las mediciones siguen igual.
 */

import { filterAndSortProducts } from '../lib/catalog.js'
import { getCatalogMeta, listProducts } from './productService.js'
import { recordMetric } from './performanceService.js'

const CACHE_KEY = 'jugueteria.catalogCache.v2'
const CACHE_VERSION = 2
const CACHE_TTL_MS = 10 * 60 * 1000

let memoryCache = null
let pendingRequest = null
const stats = {
  memoryHits: 0,
  sessionHits: 0,
  loads: 0,
  invalidations: 0,
}

function readSessionCache() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null')

    if (
      !parsed ||
      parsed.version !== CACHE_VERSION ||
      !Array.isArray(parsed.products) ||
      !parsed.meta ||
      Date.now() - parsed.savedAt > CACHE_TTL_MS
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function writeSessionCache(data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, savedAt: Date.now(), ...data }),
    )
  } catch {
    // La caché de sesión es opcional: si está llena, seguimos con memoria.
  }
}

function buildCatalog() {
  return {
    products: listProducts(),
    meta: getCatalogMeta(),
    loadedAt: new Date().toISOString(),
  }
}

/**
 * Devuelve el catálogo de forma asíncrona. La primera llamada construye los
 * datos; las siguientes responden desde memoria o `sessionStorage`.
 */
export async function loadCatalog({ force = false } = {}) {
  const startedAt = performance.now()

  if (!force && memoryCache) {
    stats.memoryHits += 1
    recordMetric({
      type: 'request',
      label: 'Catálogo desde memoria',
      durationMs: performance.now() - startedAt,
      meta: { cached: 'memory' },
    })
    return memoryCache
  }

  if (!force) {
    const sessionCache = readSessionCache()

    if (sessionCache) {
      memoryCache = {
        products: sessionCache.products,
        meta: sessionCache.meta,
        loadedAt: new Date(sessionCache.savedAt).toISOString(),
      }
      stats.sessionHits += 1
      recordMetric({
        type: 'request',
        label: 'Catálogo desde sessionStorage',
        durationMs: performance.now() - startedAt,
        meta: { cached: 'session' },
      })
      return memoryCache
    }
  }

  if (pendingRequest) return pendingRequest

  pendingRequest = Promise.resolve()
    .then(() => {
      const data = buildCatalog()
      memoryCache = data
      writeSessionCache(data)
      stats.loads += 1
      recordMetric({
        type: 'catalog',
        label: 'Carga del catálogo (AJAX simulado)',
        durationMs: performance.now() - startedAt,
        meta: { products: data.products.length },
      })
      return data
    })
    .finally(() => {
      pendingRequest = null
    })

  return pendingRequest
}

/**
 * Búsqueda asíncrona sobre el catálogo cacheado.
 * El filtrado se ejecuta en memoria para responder muy por debajo de 1 s.
 */
export async function searchCatalog({
  search = '',
  categories = [],
  brands = [],
  age = 'all',
  minPrice = 0,
  maxPrice = Number.POSITIVE_INFINITY,
  sort = 'popularity',
} = {}) {
  const catalog = await loadCatalog()
  const startedAt = performance.now()
  const products = filterAndSortProducts(catalog.products, {
    search,
    categories,
    brands,
    age,
    minPrice,
    maxPrice,
    sort,
  })

  recordMetric({
    type: 'search',
    label: 'Búsqueda de catálogo',
    durationMs: performance.now() - startedAt,
    meta: { search, results: products.length },
  })

  return products
}

/** Lectura síncrona opcional para pintar sin parpadeo cuando ya hay caché. */
export function getCatalogSnapshot() {
  if (memoryCache) return memoryCache

  const sessionCache = readSessionCache()
  if (!sessionCache) return null

  memoryCache = {
    products: sessionCache.products,
    meta: sessionCache.meta,
    loadedAt: new Date(sessionCache.savedAt).toISOString(),
  }

  return memoryCache
}

export function invalidateCatalogCache() {
  memoryCache = null
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    // Sin sessionStorage seguimos funcionando con memoria.
  }
  stats.invalidations += 1
}

export function getCacheStats() {
  return { ...stats }
}

// Cualquier cambio del administrador (producto, stock u opinión) invalida la
// caché para que la siguiente lectura traiga datos frescos.
if (typeof window !== 'undefined') {
  window.addEventListener('jugueteria:catalog-updated', invalidateCatalogCache)
}
