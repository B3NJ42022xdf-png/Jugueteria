/**
 * Carta a Papá Noel generada desde la lista de deseos.
 *
 * El mensaje se construye en texto plano (con saltos de línea) para que
 * WhatsApp lo muestre formateado. Los precios se expresan en Soles con dos
 * decimales y el total es la suma de los precios actuales de los favoritos.
 * No se abre ninguna aplicación del sistema: solo se devuelve una URL de
 * WhatsApp que el navegador abre en una pestaña nueva.
 */

const amountFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatWishlistPrice(value) {
  const amount = Number(value)
  return `S/ ${amountFormatter.format(Number.isFinite(amount) ? amount : 0)}`
}

/** @param {Array<{name?: string, price?: number}>} favorites */
export function buildWishlistLetter(favorites) {
  const items = Array.isArray(favorites) ? favorites.filter(Boolean) : []

  if (items.length === 0) return ''

  const lines = items.map((product, index) => {
    const name = String(product.name ?? 'Juguete').trim()
    return `${index + 1}. ${name} — ${formatWishlistPrice(product.price)}`
  })

  const total = items.reduce((sum, product) => {
    const price = Number(product.price)
    return sum + (Number.isFinite(price) ? price : 0)
  }, 0)

  return [
    'Mi carta a Papá Noel',
    '',
    'Hola, estos son los juguetes que me gustaría recibir esta Navidad:',
    '',
    ...lines,
    '',
    `Monto total estimado: ${formatWishlistPrice(total)}`,
    '',
    'Enviado desde Mi Juguetería — Especial Navidad',
  ].join('\n')
}

export function buildWhatsAppLetterUrl(favorites) {
  const message = buildWishlistLetter(favorites)
  return message ? `https://wa.me/?text=${encodeURIComponent(message)}` : ''
}
