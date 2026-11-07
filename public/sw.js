/* Service worker de Mi Juguetería: caché de navegador para visitas repetidas. */

const VERSION = 'jugueteria-v1'
const SHELL_CACHE = `${VERSION}-shell`
const ASSET_CACHE = `${VERSION}-assets`

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put('/index.html', response.clone())
    }

    return response
  } catch {
    const cache = await caches.open(SHELL_CACHE)
    return (
      (await cache.match(request)) ||
      (await cache.match('/index.html')) ||
      Response.error()
    )
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (
    url.pathname.startsWith('/assets/') ||
    /\.(?:css|js|mjs|woff2?|png|jpe?g|webp|avif|svg|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirstAsset(request))
  }
})
