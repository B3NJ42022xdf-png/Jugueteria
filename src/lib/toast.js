/**
 * Bus de notificaciones "toast" de la tienda.
 *
 * Cualquier componente puede mostrar una notificación sin conocer el
 * componente que la pinta: basta con llamar a `showToast`. El host
 * (`CartToast`) escucha el evento y se encarga de la animación y del cierre
 * automático.
 */

export const TOAST_EVENT = 'jugueteria:toast'

export const TOAST_KINDS = {
  CART: 'cart',
  FAVORITE: 'favorite',
  FAVORITE_REMOVED: 'favorite-removed',
  COUPON: 'coupon',
  SUCCESS: 'success',
  INFO: 'info',
  ERROR: 'error',
}

/**
 * @param {object} options
 * @param {string} [options.kind]   Tipo visual (ver `TOAST_KINDS`).
 * @param {string} [options.title]  Línea principal.
 * @param {string} [options.message] Texto secundario.
 * @param {string} [options.image]  Miniatura opcional.
 * @param {string} [options.href]   Enlace de acción opcional.
 * @param {string} [options.actionLabel] Texto del enlace de acción.
 */
export function showToast({
  kind = TOAST_KINDS.INFO,
  title = '',
  message = '',
  image = '',
  href = '',
  actionLabel = '',
} = {}) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { kind, title, message, image, href, actionLabel },
    }),
  )
}
