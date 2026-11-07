/**
 * Catálogo administrable (simulación de backend con localStorage).
 *
 * El catálogo base vive en `data/products.js`. Este servicio lo combina con:
 *  - productos creados desde el panel de administración,
 *  - cambios de nombre, precio, imagen, etc. sobre productos existentes,
 *  - el stock real (compartido con el carrito en `jugueteria.stock.v1`),
 *  - el estado activo/inactivo (eliminación lógica).
 *
 * Así, cualquier cambio del administrador se refleja de inmediato en el
 * catálogo, el detalle del producto y el carrito, sin recargar la página.
 *
 * En producción estas funciones serían llamadas a una API con permisos de
 * administrador; la validación de rol nunca debe quedarse solo en el cliente.
 */

import { PRODUCTS, createToyImage } from '../data/products.js'
import { PRODUCT_STOCK } from '../data/productDetails.js'
import {
  safeSetItem,
  sanitizePlainText,
  sanitizeUrl,
} from '../lib/security.js'
import { getProductRatingStats } from './reviewService.js'

const CUSTOM_PRODUCTS_KEY = 'jugueteria.customProducts.v1'
const PRODUCT_CHANGES_KEY = 'jugueteria.productChanges.v1'
const STOCK_STORAGE_KEY = 'jugueteria.stock.v1'

export const LOW_STOCK_THRESHOLD = 5

const AGES = ['0-2', '3-5', '6-8', '9-12']

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeJson(key, value) {
  safeSetItem(key, value)
}

function readStockMap() {
  return readJson(STOCK_STORAGE_KEY, {})
}

export function getStock(productId) {
  return resolveStock(productId, readStockMap())
}

function resolveStock(productId, overrides) {
  const base = PRODUCT_STOCK[productId] ?? 0
  const value = Object.prototype.hasOwnProperty.call(overrides, productId)
    ? Number(overrides[productId])
    : base

  return Math.max(0, Number.isFinite(value) ? Math.floor(value) : 0)
}

function writeStock(productId, stock) {
  const overrides = readStockMap()
  overrides[productId] = stock
  writeJson(STOCK_STORAGE_KEY, overrides)
}

/**
 * Avisa a la interfaz (por ejemplo al carrito) que el catálogo cambió,
 * para que los precios y nombres se refresquen sin recargar la página.
 */
function notifyCatalogChanged() {
  window.dispatchEvent(new CustomEvent('jugueteria:catalog-updated'))
}

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

function mergeProduct(product, changes, stockMap) {
  const stored = {
    ...product,
    ...(changes[product.id] ?? {}),
  }

  // Saneamiento en lectura: neutraliza datos heredados o manipulados desde
  // localStorage antes de que lleguen a React.
  const merged = {
    ...stored,
    name: sanitizePlainText(stored.name, { max: 80, fallback: 'Juguete' }),
    brand: sanitizePlainText(stored.brand, { max: 40 }),
    category: sanitizePlainText(stored.category, { max: 40 }),
    description: sanitizePlainText(stored.description, {
      max: 400,
      allowNewlines: true,
    }),
    image:
      sanitizeUrl(stored.image, { allowDataImage: true }) ||
      createToyImage('🧸', '#7c3aed', '#db2777'),
  }

  // El promedio del catálogo combina la calificación histórica con las
  // opiniones verificadas visibles. Al moderar una opinión (ocultarla),
  // el promedio se recalcula automáticamente en la siguiente lectura.
  const stats = getProductRatingStats(
    merged.id,
    merged.rating,
    merged.reviews,
  )

  return {
    ...merged,
    active: merged.active !== false,
    stock: resolveStock(product.id, stockMap),
    rating: stats.rating,
    reviews: stats.reviews,
    baseRating: Number(merged.rating) || 0,
    baseReviews: Number(merged.reviews) || 0,
    realReviewCount: stats.realCount,
  }
}

/** Devuelve el catálogo combinado. Por defecto excluye los inactivos. */
export function listProducts({ includeInactive = false } = {}) {
  const changes = readJson(PRODUCT_CHANGES_KEY, {})
  const stockMap = readStockMap()
  const products = [...PRODUCTS, ...readArray(CUSTOM_PRODUCTS_KEY)].map((product) =>
    mergeProduct(product, changes, stockMap),
  )

  return includeInactive
    ? products
    : products.filter((product) => product.active)
}

/** Producto activo por id (o inactivo si se pide explícitamente). */
export function getProductById(productId, { includeInactive = false } = {}) {
  return (
    listProducts({ includeInactive }).find(
      (product) => product.id === productId,
    ) ?? null
  )
}

export function isCustomProduct(productId) {
  return readArray(CUSTOM_PRODUCTS_KEY).some(
    (product) => product.id === productId,
  )
}

/** Categorías, marcas y precio máximo calculados con el catálogo vigente. */
export function getCatalogMeta() {
  const products = listProducts()
  const categories = [...new Set(products.map((product) => product.category))].sort(
    (a, b) => a.localeCompare(b, 'es'),
  )
  const brands = [...new Set(products.map((product) => product.brand))].sort(
    (a, b) => a.localeCompare(b, 'es'),
  )
  const priceMax = Math.max(
    100000,
    Math.ceil(Math.max(0, ...products.map((product) => product.price)) / 10000) *
      10000,
  )

  return { categories, brands, priceMax, total: products.length }
}

/**
 * Juguetes activos con stock menor al umbral (5 por defecto).
 * La alerta del panel se calcula con esta función en cada cambio.
 */
export function listLowStockProducts(threshold = LOW_STOCK_THRESHOLD) {
  return listProducts()
    .filter((product) => product.stock < threshold)
    .sort((a, b) => a.stock - b.stock)
}

/* ------------------------------------------------------------------ */
/* Validación                                                          */
/* ------------------------------------------------------------------ */

function sanitizeText(
  value,
  label,
  { required = true, max = 80, allowNewlines = false } = {},
) {
  const text = sanitizePlainText(value, { max, allowNewlines })

  if (required && !text) {
    throw new Error(`Ingresa ${label}.`)
  }

  return text
}

function sanitizePrice(value) {
  const price = Number(value)

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Ingresa un precio válido mayor a 0.')
  }

  return Math.round(price)
}

function sanitizeStock(value) {
  const stock = Number(value)

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('El stock debe ser un número entero mayor o igual a 0.')
  }

  return stock
}

function sanitizeImage(value, fallback) {
  const raw = String(value ?? '').trim()

  if (!raw) return fallback

  const image = sanitizeUrl(raw, { allowDataImage: true })

  if (!image) {
    throw new Error('La imagen debe ser un archivo de imagen o una URL válida.')
  }

  return image
}

function sanitizeAge(value) {
  const age = String(value ?? '').trim()
  return AGES.includes(age) ? age : AGES[1]
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function uniqueId(name) {
  const base = slugify(name) || 'juguete'
  const taken = new Set([
    ...PRODUCTS.map((product) => product.id),
    ...readArray(CUSTOM_PRODUCTS_KEY).map((product) => product.id),
  ])
  let candidate = base
  let suffix = 2

  while (taken.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  return candidate
}

/* ------------------------------------------------------------------ */
/* Escritura                                                           */
/* ------------------------------------------------------------------ */

function buildFields(input, current = {}) {
  return {
    name: sanitizeText(input.name ?? current.name, 'el nombre del juguete'),
    brand: sanitizeText(input.brand ?? current.brand, 'la marca', { max: 40 }),
    category: sanitizeText(input.category ?? current.category, 'la categoría', {
      max: 40,
    }),
    age: sanitizeAge(input.age ?? current.age),
    price: sanitizePrice(input.price ?? current.price),
    image: sanitizeImage(
      input.image ?? current.image,
      current.image ?? createToyImage('🧸', '#7c3aed', '#db2777'),
    ),
    description: sanitizeText(
      input.description ?? current.description,
      'la descripción',
      { required: false, max: 400, allowNewlines: true },
    ),
  }
}

/** Crea un juguete nuevo. Lanza un Error con un mensaje legible si no es válido. */
export function createProduct(input) {
  const fields = buildFields(input)
  const stock = sanitizeStock(input.stock ?? 0)
  const id = uniqueId(fields.name)

  const product = {
    id,
    ...fields,
    rating: 0,
    reviews: 0,
    popularity: 50,
    badge: 'Nuevo',
    tags: [
      ...new Set(
        `${fields.name} ${fields.brand} ${fields.category}`
          .toLowerCase()
          .split(/[^a-z0-9áéíóúñü]+/i)
          .filter(Boolean),
      ),
    ],
    active: true,
    createdAt: new Date().toISOString(),
  }

  writeJson(CUSTOM_PRODUCTS_KEY, [...readArray(CUSTOM_PRODUCTS_KEY), product])
  writeStock(id, stock)
  notifyCatalogChanged()

  return getProductById(id, { includeInactive: true })
}

/**
 * Actualiza campos del juguete y/o su stock. El stock se escribe en la misma
 * clave que usa el carrito, por lo que el cambio es inmediato en toda la app.
 */
export function updateProduct(productId, input) {
  const current = getProductById(productId, { includeInactive: true })

  if (!current) {
    throw new Error('El juguete no existe.')
  }

  const fields = buildFields(input, current)
  const customProducts = readArray(CUSTOM_PRODUCTS_KEY)
  const isCustom = customProducts.some((product) => product.id === productId)

  if (isCustom) {
    writeJson(
      CUSTOM_PRODUCTS_KEY,
      customProducts.map((product) =>
        product.id === productId ? { ...product, ...fields } : product,
      ),
    )
  } else {
    const changes = readJson(PRODUCT_CHANGES_KEY, {})
    changes[productId] = { ...(changes[productId] ?? {}), ...fields }
    writeJson(PRODUCT_CHANGES_KEY, changes)
  }

  if (input.stock !== undefined) {
    writeStock(productId, sanitizeStock(input.stock))
  }

  notifyCatalogChanged()

  return getProductById(productId, { includeInactive: true })
}

/** Actualización rápida y aislada del stock (usada por los botones +/-). */
export function updateProductStock(productId, stock) {
  if (!getProductById(productId, { includeInactive: true })) {
    throw new Error('El juguete no existe.')
  }

  writeStock(productId, sanitizeStock(stock))
  notifyCatalogChanged()

  return getProductById(productId, { includeInactive: true })
}

/** Eliminación lógica: el juguete deja de mostrarse, pero se conserva. */
export function setProductActive(productId, active) {
  const current = getProductById(productId, { includeInactive: true })

  if (!current) {
    throw new Error('El juguete no existe.')
  }

  const customProducts = readArray(CUSTOM_PRODUCTS_KEY)
  const isCustom = customProducts.some((product) => product.id === productId)

  if (isCustom) {
    writeJson(
      CUSTOM_PRODUCTS_KEY,
      customProducts.map((product) =>
        product.id === productId
          ? { ...product, active: Boolean(active) }
          : product,
      ),
    )
  } else {
    const changes = readJson(PRODUCT_CHANGES_KEY, {})
    changes[productId] = {
      ...(changes[productId] ?? {}),
      active: Boolean(active),
    }
    writeJson(PRODUCT_CHANGES_KEY, changes)
  }

  notifyCatalogChanged()

  return getProductById(productId, { includeInactive: true })
}

export { AGES }
