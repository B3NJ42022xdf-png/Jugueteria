/**
 * Servicio de carrito y stock (simulación de backend con localStorage).
 *
 * El stock disponible no se descuenta al agregar al carrito: se valida al
 * agregar, al cambiar cantidades y antes de finalizar la compra. Cada artículo
 * guarda `stockAtAdd`, una foto del stock cuando se agregó, para detectar
 * cambios posteriores y avisar al cliente.
 */

import { PRODUCT_STOCK } from '../data/productDetails.js'
import {
  assertSafeIdentifier,
  safeSetItem,
  sanitizeIdentifier,
} from '../lib/security.js'

const STOCK_STORAGE_KEY = 'jugueteria.stock.v1'
const CART_STORAGE_KEY = 'jugueteria.cart.v1'
const MOCK_LATENCY_MS = 250

export class InsufficientStockError extends Error {
  constructor(availableStock) {
    super('No hay suficientes unidades disponibles.')
    this.name = 'InsufficientStockError'
    this.availableStock = availableStock
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  safeSetItem(key, value)
}

function getAvailableStock(productId) {
  const overrides = readJson(STOCK_STORAGE_KEY, {})
  const baseStock = PRODUCT_STOCK[productId] ?? 0
  const stock = Object.prototype.hasOwnProperty.call(overrides, productId)
    ? Number(overrides[productId])
    : baseStock

  return Math.max(0, Number.isFinite(stock) ? stock : 0)
}

/* ------------------------------------------------------------------ */
/* Stock                                                               */
/* ------------------------------------------------------------------ */

/** Consulta simulada con latencia, para refrescar la disponibilidad. */
export async function checkStock(productId) {
  await wait(MOCK_LATENCY_MS)

  return {
    stock: getAvailableStock(productId),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Compara el stock actual con la foto guardada al agregar cada artículo.
 * Devuelve, por producto, si el stock cambió o si ya no alcanza para la
 * cantidad que el cliente tiene en el carrito.
 */
export async function validateCartStock(cart) {
  const entries = Object.entries(cart)

  return Promise.all(
    entries.map(async ([productId, item]) => {
      const { stock, updatedAt } = await checkStock(productId)

      return {
        productId,
        quantity: item.quantity,
        stock,
        stockAtAdd: item.stockAtAdd,
        changed: item.stockAtAdd != null && stock < item.stockAtAdd,
        insufficient: item.quantity > stock,
        updatedAt,
      }
    }),
  )
}

/* ------------------------------------------------------------------ */
/* Carrito                                                             */
/* ------------------------------------------------------------------ */

function normalizeEntry(value) {
  if (typeof value === 'number') {
    return { quantity: Math.max(0, Math.floor(value)), stockAtAdd: null }
  }

  if (value && typeof value === 'object') {
    const quantity = Number(value.quantity)

    if (!Number.isFinite(quantity)) return null

    return {
      quantity: Math.max(0, Math.floor(quantity)),
      stockAtAdd: Number.isFinite(Number(value.stockAtAdd))
        ? Math.max(0, Math.floor(Number(value.stockAtAdd)))
        : null,
    }
  }

  return null
}

/** Devuelve el carrito normalizado: { [productId]: { quantity, stockAtAdd } }. */
export function getCart() {
  const raw = readJson(CART_STORAGE_KEY, {})
  const cart = {}

  for (const [productId, value] of Object.entries(raw)) {
    const safeId = sanitizeIdentifier(productId)

    // Un localStorage manipulado no puede inyectar __proto__ ni ids raros.
    if (!safeId) continue

    const entry = normalizeEntry(value)

    if (entry && entry.quantity > 0) {
      cart[safeId] = entry
    }
  }

  return cart
}

function writeCart(cart) {
  writeJson(CART_STORAGE_KEY, cart)
}

export function getCartCount() {
  return Object.values(getCart()).reduce((total, item) => total + item.quantity, 0)
}

/** Agrega unidades sin descontar stock; valida contra la disponibilidad actual. */
export async function addToCart(productId, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Selecciona una cantidad válida.')
  }

  const safeProductId = assertSafeIdentifier(productId, 'producto')
  const stock = getAvailableStock(safeProductId)
  const cart = getCart()
  const currentQuantity = cart[safeProductId]?.quantity ?? 0
  const nextQuantity = currentQuantity + quantity

  if (nextQuantity > stock) {
    throw new InsufficientStockError(stock)
  }

  cart[safeProductId] = { quantity: nextQuantity, stockAtAdd: stock }
  writeCart(cart)

  return {
    remainingStock: stock,
    cartCount: getCartCount(),
    cartQuantity: nextQuantity,
  }
}

/** Cambia la cantidad absoluta de un artículo. */
export async function updateCartItemQuantity(productId, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Selecciona una cantidad válida.')
  }

  const safeProductId = assertSafeIdentifier(productId, 'producto')
  const cart = getCart()
  const entry = cart[safeProductId]

  if (!entry) {
    throw new Error('El producto no está en el carrito.')
  }

  const stock = getAvailableStock(safeProductId)
  const isIncreasing = quantity > entry.quantity

  // Reducir la cantidad siempre debe ser posible, incluso si el carrito quedó
  // por encima del stock actual: así el cliente puede ajustarse a lo disponible.
  if (isIncreasing && quantity > stock) {
    throw new InsufficientStockError(stock)
  }

  cart[safeProductId] = { ...entry, quantity }
  writeCart(cart)

  return {
    remainingStock: stock,
    cartCount: getCartCount(),
    cartQuantity: quantity,
  }
}

/** Elimina un artículo completo del carrito. */
export async function removeCartItem(productId) {
  const safeProductId = assertSafeIdentifier(productId, 'producto')
  const cart = getCart()
  delete cart[safeProductId]
  writeCart(cart)

  return {
    remainingStock: getAvailableStock(safeProductId),
    cartCount: getCartCount(),
  }
}

/**
 * Descuenta del stock las unidades compradas y vacía el carrito.
 * Se ejecuta únicamente cuando la transacción ya fue confirmada.
 */
export function commitPurchase(cart) {
  const overrides = readJson(STOCK_STORAGE_KEY, {})

  for (const [productId, item] of Object.entries(cart)) {
    const safeProductId = sanitizeIdentifier(productId)

    if (!safeProductId) continue

    const currentStock = getAvailableStock(safeProductId)
    overrides[safeProductId] = Math.max(0, currentStock - item.quantity)
  }

  writeJson(STOCK_STORAGE_KEY, overrides)
  writeCart({})
}
