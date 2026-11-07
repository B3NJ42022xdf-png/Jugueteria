/**
 * Opiniones verificadas de clientes (simulación de backend con localStorage).
 *
 * Una opinión solo puede crearse desde un pedido entregado; `orderService`
 * valida esa regla antes de llamar a `saveReview`. Este servicio se encarga de:
 *  - guardar la calificación (1–5) y el comentario,
 *  - calcular el promedio y la distribución de estrellas,
 *  - excluir del cálculo las opiniones ocultas por moderación,
 *  - exponer la lista completa para el panel de administración.
 *
 * En producción, la moderación debe ser un endpoint protegido y el promedio
 * se calcularía en la base de datos o en un job de agregación.
 */

import {
  safeSetItem,
  sanitizePlainText,
} from '../lib/security.js'

const RATINGS_STORAGE_KEY = 'jugueteria.ratings.v1'

const AUTHOR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-fuchsia-100 text-fuchsia-700',
]

const reviewDateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */

let reviewsCache = null

function readArray() {
  if (reviewsCache) return reviewsCache

  try {
    const parsed = JSON.parse(localStorage.getItem(RATINGS_STORAGE_KEY) ?? '[]')
    reviewsCache = Array.isArray(parsed) ? parsed : []
    return reviewsCache
  } catch {
    return []
  }
}

function writeArray(value) {
  reviewsCache = value
  // `safeSetItem` bloquea cualquier intento de guardar PAN/CVV.
  safeSetItem(RATINGS_STORAGE_KEY, value)
}

// Otra pestaña puede moderar una opinión: invalidamos la caché en memoria.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === RATINGS_STORAGE_KEY) reviewsCache = null
  })
}

function notifyCatalogChanged() {
  window.dispatchEvent(new CustomEvent('jugueteria:catalog-updated'))
}

/**
 * Saneamiento en lectura y escritura: aunque una opinión vieja o manipulada
 * contenga HTML, React nunca recibe el marcado original.
 */
function normalizeReview(review) {
  const stars = Math.round(Number(review.stars))

  return {
    ...review,
    id: sanitizePlainText(review.id, { max: 64 }),
    receiptId: sanitizePlainText(review.receiptId, { max: 64 }),
    orderNumber: sanitizePlainText(review.orderNumber, { max: 40 }),
    productId: sanitizePlainText(review.productId, { max: 64 }),
    stars: Math.min(5, Math.max(1, Number.isFinite(stars) ? stars : 1)),
    comment: sanitizePlainText(review.comment, {
      max: 500,
      allowNewlines: true,
    }),
    customerName: sanitizePlainText(review.customerName, { max: 80 }),
    productName: sanitizePlainText(review.productName, { max: 80 }),
    hidden: review.hidden === true,
  }
}

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

export function listRatings(receiptId) {
  return readArray()
    .filter((rating) => rating.receiptId === receiptId)
    .map(normalizeReview)
}

export function getProductRating(receiptId, productId) {
  return (
    listRatings(receiptId).find((rating) => rating.productId === productId) ??
    null
  )
}

/** Opiniones publicadas de un producto (las ocultas se excluyen por defecto). */
export function listProductReviews(productId, { includeHidden = false } = {}) {
  return readArray()
    .filter(
      (rating) =>
        rating.productId === productId &&
        (includeHidden || rating.hidden !== true),
    )
    .map(normalizeReview)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

/** Todas las opiniones para el panel de moderación. */
export function listAllReviews() {
  return readArray()
    .map(normalizeReview)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

/**
 * Promedio combinado entre las valoraciones históricas del catálogo y las
 * opiniones verificadas publicadas. Si se oculta una opinión, deja de contar.
 */
export function getProductRatingStats(productId, baseRating = 0, baseReviews = 0) {
  const reviews = listProductReviews(productId)
  const safeBaseRating = Math.min(5, Math.max(0, Number(baseRating) || 0))
  const safeBaseReviews = Math.max(0, Math.floor(Number(baseReviews) || 0))
  const realCount = reviews.length

  if (realCount === 0) {
    return {
      rating: safeBaseRating,
      reviews: safeBaseReviews,
      realCount: 0,
      realAverage: 0,
    }
  }

  const realSum = reviews.reduce((total, review) => total + review.stars, 0)
  const total = safeBaseReviews + realCount
  const combined = (safeBaseRating * safeBaseReviews + realSum) / total

  return {
    rating: Math.round(combined * 10) / 10,
    reviews: total,
    realCount,
    realAverage: Math.round((realSum / realCount) * 10) / 10,
  }
}

/* ------------------------------------------------------------------ */
/* Escritura                                                           */
/* ------------------------------------------------------------------ */

export function saveReview({
  receiptId,
  orderNumber = '',
  productId,
  productName,
  customerName = '',
  stars,
  comment = '',
}) {
  if (!receiptId || !productId) {
    throw new Error('La opinión debe estar asociada a un pedido y un juguete.')
  }

  const value = Math.round(Number(stars))

  if (!Number.isFinite(value) || value < 1 || value > 5) {
    throw new Error('Selecciona una calificación de 1 a 5 estrellas.')
  }

  const reviews = readArray()
  const existing = reviews.find(
    (review) =>
      review.receiptId === receiptId && review.productId === productId,
  )
  const now = new Date().toISOString()

  const review = normalizeReview({
    id: existing?.id ?? crypto.randomUUID(),
    receiptId,
    orderNumber: orderNumber || existing?.orderNumber || '',
    productId,
    productName,
    customerName,
    stars: value,
    comment,
    hidden: existing?.hidden === true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  })

  writeArray(
    existing
      ? reviews.map((item) => (item.id === existing.id ? review : item))
      : [...reviews, review],
  )
  notifyCatalogChanged()

  return review
}

/** Moderación: oculta o vuelve a publicar una opinión. */
export function setReviewHidden(reviewId, hidden) {
  const reviews = readArray()
  const existing = reviews.find((review) => review.id === reviewId)

  if (!existing) {
    throw new Error('La opinión no existe.')
  }

  const updated = {
    ...normalizeReview(existing),
    hidden: Boolean(hidden),
    moderatedAt: new Date().toISOString(),
  }

  writeArray(reviews.map((review) => (review.id === reviewId ? updated : review)))
  notifyCatalogChanged()

  return updated
}

/* ------------------------------------------------------------------ */
/* Presentación                                                        */
/* ------------------------------------------------------------------ */

/** "Laura Gómez" → "Laura G." (protege el apellido completo del cliente). */
export function displayAuthorName(value) {
  const parts = sanitizePlainText(value, { max: 80 })
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'Cliente verificado'
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

export function authorColor(value) {
  const seed = [...String(value ?? 'cliente')].reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  )

  return AUTHOR_COLORS[seed % AUTHOR_COLORS.length]
}

export function formatReviewDate(isoDate) {
  if (!isoDate) return ''

  try {
    return reviewDateFormatter.format(new Date(isoDate))
  } catch {
    return ''
  }
}

export { RATINGS_STORAGE_KEY }
