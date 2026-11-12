/**
 * Reglas de totales del carrito compartidas por la página del carrito y el
 * resumen de pago. Se centralizan aquí para que ambos pasos muestren siempre
 * el mismo envío y total.
 */

export const FREE_SHIPPING_FROM = 150000
export const SHIPPING_COST = 12900

/** El envío es gratis desde el umbral o cuando el carrito está vacío. */
export function calculateShipping(subtotal, itemCount) {
  if (itemCount === 0 || subtotal >= FREE_SHIPPING_FROM) return 0
  return SHIPPING_COST
}
