/**
 * Cupones promocionales de la tienda.
 *
 * Se mantienen en un módulo puro para que el carrito, el checkout y el
 * comprobante calculen exactamente el mismo descuento. Los códigos se
 * normalizan (sin espacios y en mayúsculas) para que el cliente pueda escribir
 * "navidad20" o " Navidad20 " sin que falle.
 */

import { calculateShipping } from './cartTotals.js'

export const COUPONS = {
  NAVIDAD20: {
    code: 'NAVIDAD20',
    type: 'percent',
    value: 0.2,
    label: '20% de descuento',
    description: 'Aplica 20% de descuento sobre el subtotal de tu compra.',
  },
  ENVIOGRATIS: {
    code: 'ENVIOGRATIS',
    type: 'free-shipping',
    value: 0,
    label: 'Envío gratis',
    description: 'Deja el costo de envío en S/ 0.00.',
  },
}

/** Códigos que la interfaz muestra como sugerencia. */
export const FEATURED_COUPON_CODES = Object.keys(COUPONS)

export function normalizeCouponCode(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

/** Devuelve el cupón configurado o `null` si el código no existe. */
export function findCoupon(value) {
  return COUPONS[normalizeCouponCode(value)] ?? null
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

/**
 * Calcula descuento, envío, total y ahorro para un cupón.
 *
 * - `NAVIDAD20` descuenta el 20% del subtotal.
 * - `ENVIOGRATIS` mantiene el envío en cero.
 * - El envío gratis por compras desde S/ 150 se sigue respetando.
 */
export function calculateCouponTotals({ coupon, subtotal, itemCount }) {
  const safeSubtotal = Math.max(0, roundMoney(Number(subtotal) || 0))
  const baseShipping = calculateShipping(safeSubtotal, itemCount)
  let discount = 0
  let shipping = baseShipping

  if (coupon && safeSubtotal > 0) {
    if (coupon.type === 'percent') {
      discount = roundMoney(safeSubtotal * coupon.value)
    } else if (coupon.type === 'free-shipping') {
      shipping = 0
    }
  }

  const total = Math.max(0, roundMoney(safeSubtotal - discount + shipping))
  const savings = Math.max(0, roundMoney(discount + (baseShipping - shipping)))

  return {
    baseShipping,
    discount,
    shipping,
    total,
    savings,
  }
}
