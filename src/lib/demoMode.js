/**
 * Datos y eventos del Modo Demostración / Panel del Jurado.
 *
 * El checkout es una página independiente con su propio estado. Para poder
 * prellenarlo desde el panel flotante sin acoplar ambos componentes se usa un
 * evento global y una copia temporal en `sessionStorage`:
 *
 *  - Si el checkout ya está montado, escucha el evento y aplica los datos.
 *  - Si todavía no está montado (se acaba de navegar), lee el almacenamiento
 *    al inicializar sus campos y luego lo limpia.
 *
 * Los datos son ficticios pero realistas: DNI válido, dirección de Lima y una
 * tarjeta de prueba estándar (Visa 4111…). No se envía nada a un servidor.
 */

export const DEMO_PREFILL_KEY = 'jugueteria.demoPrefill.v1'
export const DEMO_PREFILL_EVENT = 'jugueteria:demo-prefill'

export const DEMO_CHECKOUT_DATA = {
  receiptType: 'boleta',
  fullName: 'María Fernanda López',
  documentId: '70123456',
  businessName: 'Juguetes del Polo Norte S.A.C.',
  ruc: '20123456789',
  fiscalAddress: 'Av. Navidad 1225, oficina 4, Lima',
  email: 'maria.lopez@demo.pe',
  shippingAddress: 'Av. Los Jardines 456, Dpto. 302, San Miguel, Lima',
  paymentMethod: 'card',
  cardNumber: '4111 1111 1111 1111',
  cardExpiry: '12/30',
  cardCvv: '123',
  cardHolder: 'MARIA FERNANDA LOPEZ',
}

function getStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** Guarda los datos y avisa al checkout si ya está abierto. */
export function storeDemoCheckoutPrefill(data = DEMO_CHECKOUT_DATA) {
  const storage = getStorage()

  try {
    storage?.setItem(DEMO_PREFILL_KEY, JSON.stringify(data))
  } catch {
    // Si el almacenamiento está bloqueado, el evento sigue llevando los datos.
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DEMO_PREFILL_EVENT, { detail: data }),
    )
  }
}

/** Lee los datos pendientes sin borrarlos (seguro para el render inicial). */
export function readDemoCheckoutPrefill() {
  const storage = getStorage()

  try {
    const raw = storage?.getItem(DEMO_PREFILL_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function clearDemoCheckoutPrefill() {
  try {
    getStorage()?.removeItem(DEMO_PREFILL_KEY)
  } catch {
    // Sin almacenamiento disponible no hay nada que limpiar.
  }
}
