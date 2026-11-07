/**
 * Historial de compras, estado de los envíos y calificaciones.
 *
 * Igual que el resto del proyecto, la "base de datos" se simula con
 * localStorage. Los pedidos son los comprobantes emitidos por
 * `receiptService`; aquí se les agrega:
 *  - el estado de despacho y su línea de tiempo,
 *  - las calificaciones de producto (solo si el pedido fue entregado).
 *
 * En producción, cada función de este archivo debe reemplazarse por una
 * llamada a la API (GET /orders, PATCH /orders/:id/status, POST /ratings).
 */

import { getReceipt, listReceipts, sendShipmentStatusEmail } from './receiptService.js'
import { getProductById } from './productService.js'
import { getProductRating, listRatings, saveReview } from './reviewService.js'
import {
  safeSetItem,
  sanitizeEmail,
  sanitizePlainText,
} from '../lib/security.js'

const SHIPMENTS_STORAGE_KEY = 'jugueteria.shipments.v1'
const ORDER_AUDIT_STORAGE_KEY = 'jugueteria.orderAudit.v1'

/**
 * Etapas que el administrador puede asignar desde el panel.
 * "Cancelado" no hace parte del avance lineal del envío, pero es un estado
 * válido del pedido y se muestra con un tratamiento propio.
 */
export const ORDER_STATUSES = [
  {
    key: 'preparando',
    label: 'En preparación',
    shortLabel: 'Preparando',
    description: 'Estamos alistando tus juguetes en bodega.',
  },
  {
    key: 'en_camino',
    label: 'En camino',
    shortLabel: 'En camino',
    description: 'Tu pedido va rumbo a tu dirección.',
  },
  {
    key: 'entregado',
    label: 'Entregado',
    shortLabel: 'Entregado',
    description: 'Tu pedido llegó a su destino.',
  },
  {
    key: 'cancelado',
    label: 'Cancelado',
    shortLabel: 'Cancelado',
    description: 'El pedido fue cancelado y no será despachado.',
  },
]

/**
 * Flujo logístico. El orden del arreglo define la secuencia del seguimiento.
 * No incluye "Cancelado" porque es una salida del flujo, no una etapa.
 */
export const ORDER_STATUS_FLOW = ORDER_STATUSES.filter(
  (status) => status.key !== 'cancelado',
)

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */

function readArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeArray(key, value) {
  safeSetItem(key, value)
}

function normalizeEmail(value) {
  return sanitizeEmail(String(value ?? '').trim().toLowerCase())
}

/* ------------------------------------------------------------------ */
/* Envíos                                                              */
/* ------------------------------------------------------------------ */

export function getStatusIndex(status) {
  const index = ORDER_STATUS_FLOW.findIndex((step) => step.key === status)
  return index >= 0 ? index : 0
}

export function getStatusMeta(status) {
  return (
    ORDER_STATUSES.find((step) => step.key === status) ?? ORDER_STATUSES[0]
  )
}

function isOrderStatus(status) {
  return ORDER_STATUSES.some((step) => step.key === status)
}

/**
 * Compatibilidad con envíos creados antes de existir la guía y la bitácora.
 */
function normalizeShipment(shipment) {
  return {
    ...shipment,
    trackingNumber: sanitizePlainText(shipment.trackingNumber, { max: 40 }),
    updatedBy: shipment.updatedBy ?? null,
    history: (shipment.history ?? []).map((entry) => ({
      ...entry,
      by: entry.by ?? null,
      note: sanitizePlainText(entry.note, { max: 300 }),
      trackingNumber: sanitizePlainText(entry.trackingNumber, { max: 40 }),
    })),
  }
}

function buildShipment(receipt) {
  const startedAt = receipt.issuedAt ?? new Date().toISOString()

  return {
    receiptId: receipt.id,
    status: 'preparando',
    trackingNumber: '',
    updatedAt: startedAt,
    updatedBy: null,
    history: [
      {
        status: 'preparando',
        at: startedAt,
        trackingNumber: '',
        by: null,
      },
    ],
  }
}

function persistShipment(shipment) {
  const shipments = readArray(SHIPMENTS_STORAGE_KEY)
  const exists = shipments.some((item) => item.receiptId === shipment.receiptId)

  writeArray(
    SHIPMENTS_STORAGE_KEY,
    exists
      ? shipments.map((item) =>
          item.receiptId === shipment.receiptId ? shipment : item,
        )
      : [...shipments, shipment],
  )
}

/**
 * Devuelve el envío del pedido. Si todavía no existe (por ejemplo, pedidos
 * emitidos antes de esta funcionalidad), lo crea en "En preparación".
 */
export function getShipment(receiptId) {
  const existing = readArray(SHIPMENTS_STORAGE_KEY).find(
    (item) => item.receiptId === receiptId,
  )

  if (existing) return normalizeShipment(existing)

  const receipt = getReceipt(receiptId)
  if (!receipt) return null

  const shipment = buildShipment(receipt)
  persistShipment(shipment)

  return shipment
}

/**
 * Avanza el envío al siguiente estado del flujo.
 * Se conserva por compatibilidad; el panel de administración usa
 * `updateShipmentStatus`, que además registra bitácora y envía el correo.
 */
export function advanceShipment(receiptId) {
  const receipt = getReceipt(receiptId)

  if (!receipt) {
    throw new Error('El pedido no existe.')
  }

  const shipment = getShipment(receiptId)
  const currentIndex = getStatusIndex(shipment.status)
  const next = ORDER_STATUS_FLOW[currentIndex + 1]

  if (!next) return shipment

  const now = new Date().toISOString()
  const updated = {
    ...shipment,
    status: next.key,
    updatedAt: now,
    history: [
      ...shipment.history,
      { status: next.key, at: now, trackingNumber: shipment.trackingNumber, by: null },
    ],
  }

  persistShipment(updated)

  return updated
}

/* ------------------------------------------------------------------ */
/* Bitácora de cambios (auditoría)                                     */
/* ------------------------------------------------------------------ */

export function listOrderAudit(receiptId) {
  return readArray(ORDER_AUDIT_STORAGE_KEY)
    .filter((entry) => entry.receiptId === receiptId)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
}

export function listAllOrderAudit() {
  return readArray(ORDER_AUDIT_STORAGE_KEY).sort(
    (a, b) => new Date(b.at) - new Date(a.at),
  )
}

function appendAuditEntry(entry) {
  writeArray(ORDER_AUDIT_STORAGE_KEY, [...readArray(ORDER_AUDIT_STORAGE_KEY), entry])
  return entry
}

/**
 * Actualiza la etapa del despacho y/o el número de guía de un pedido.
 *
 * Reglas:
 *  - solo acepta las cuatro etapas del panel,
 *  - "En camino" y "Entregado" exigen número de guía,
 *  - un pedido entregado no se puede cancelar,
 *  - cada cambio queda en la bitácora con fecha, hora y administrador,
 *  - se envía un correo simulado al cliente con el nuevo estado.
 *
 * En producción esta función debe ejecutarse en el servidor, validar el rol
 * del usuario y disparar el correo desde la cola de mensajes.
 */
export async function updateShipmentStatus({
  receiptId,
  status,
  trackingNumber = '',
  admin = {},
  note = '',
}) {
  if (!isOrderStatus(status)) {
    throw new Error('La etapa seleccionada no es válida.')
  }

  const receipt = getReceipt(receiptId)

  if (!receipt) {
    throw new Error('El pedido no existe.')
  }

  const current = getShipment(receiptId)

  if (current.status === 'entregado' && status === 'cancelado') {
    throw new Error('Un pedido entregado no puede cancelarse.')
  }

  const cleanTracking = sanitizePlainText(trackingNumber, { max: 40 })

  if (cleanTracking && !/^[A-Za-z0-9][A-Za-z0-9-]{4,39}$/.test(cleanTracking)) {
    throw new Error(
      'El número de guía debe tener entre 5 y 40 caracteres alfanuméricos (puede incluir guiones).',
    )
  }

  const finalTracking = cleanTracking || current.trackingNumber || ''

  if (
    (status === 'en_camino' || status === 'entregado') &&
    !finalTracking
  ) {
    throw new Error(
      'Ingresa el número de guía para marcar el pedido como "En camino" o "Entregado".',
    )
  }

  if (
    current.status === status &&
    finalTracking === (current.trackingNumber ?? '')
  ) {
    throw new Error('El pedido ya tiene esa etapa y ese número de guía.')
  }

  const now = new Date().toISOString()
  const actor = {
    email: sanitizeEmail(admin.email),
    role: admin.role === 'admin' ? 'admin' : 'cliente',
  }
  const noteText = sanitizePlainText(note, { max: 300, allowNewlines: true })

  const shipment = {
    ...current,
    status,
    trackingNumber: finalTracking,
    updatedAt: now,
    updatedBy: actor,
    history: [
      ...current.history,
      {
        status,
        at: now,
        trackingNumber: finalTracking,
        by: actor,
        note: noteText,
      },
    ],
  }

  persistShipment(shipment)

  const auditEntry = appendAuditEntry({
    id: crypto.randomUUID(),
    receiptId,
    orderNumber: receipt.number,
    at: now,
    adminEmail: actor.email,
    adminRole: actor.role,
    fromStatus: current.status,
    toStatus: status,
    trackingNumber: finalTracking,
    note: noteText,
  })

  const email = await sendShipmentStatusEmail({
    receipt,
    shipment,
    statusMeta: getStatusMeta(status),
  })

  return { shipment, email, auditEntry }
}

function buildTimeline(shipment) {
  const cancelled = shipment.status === 'cancelado'
  const effectiveStatus = cancelled
    ? ([...shipment.history]
        .reverse()
        .find((entry) => entry.status !== 'cancelado')?.status ?? 'preparando')
    : shipment.status
  const currentIndex = getStatusIndex(effectiveStatus)

  return ORDER_STATUS_FLOW.map((step, index) => ({
    ...step,
    at: shipment.history?.find((entry) => entry.status === step.key)?.at ?? null,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending',
  }))
}

/* ------------------------------------------------------------------ */
/* Calificaciones                                                      */
/* ------------------------------------------------------------------ */

export { getProductRating, listRatings }

/**
 * Guarda (o actualiza) la opinión de un juguete.
 *
 * Reglas de negocio (criterio 1): solo el dueño del pedido y solo cuando la
 * etapa del envío es "Entregado". El almacenamiento y el promedio viven en
 * `reviewService`, que además permite la moderación desde el panel admin.
 */
export function saveProductRating({ receiptId, productId, stars, comment = '' }) {
  const receipt = getReceipt(receiptId)

  if (!receipt) {
    throw new Error('El pedido no existe.')
  }

  const shipment = getShipment(receiptId)

  if (shipment?.status !== 'entregado') {
    throw new Error('Podrás calificar el producto cuando tu pedido esté entregado.')
  }

  const item = receipt.items.find((entry) => entry.productId === productId)

  if (!item) {
    throw new Error('El producto no pertenece a este pedido.')
  }

  return saveReview({
    receiptId,
    orderNumber: receipt.number,
    productId,
    productName: item.name,
    customerName: receipt.customer?.name ?? '',
    stars,
    comment,
  })
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */

function productImage(productId) {
  return getProductById(productId, { includeInactive: true })?.image ?? null
}

function decorateOrder(receipt) {
  const shipment = getShipment(receipt.id)
  const audit = listOrderAudit(receipt.id)

  return {
    ...receipt,
    status: shipment?.status ?? 'preparando',
    statusMeta: getStatusMeta(shipment?.status),
    timeline: buildTimeline(shipment ?? buildShipment(receipt)),
    shipmentUpdatedAt: shipment?.updatedAt ?? receipt.issuedAt,
    shipmentUpdatedBy: shipment?.updatedBy ?? null,
    trackingNumber: shipment?.trackingNumber ?? '',
    shipmentHistory: shipment?.history ?? [],
    audit,
    ratings: listRatings(receipt.id),
    items: receipt.items.map((item) => ({
      ...item,
      image: productImage(item.productId),
      rating:
        listRatings(receipt.id).find(
          (rating) => rating.productId === item.productId,
        ) ?? null,
    })),
  }
}

/** Historial del cliente, ordenado de más reciente a más antiguo. */
export function listCustomerOrders(email) {
  const owner = normalizeEmail(email)

  if (!owner) return []

  return listReceipts()
    .filter((receipt) => normalizeEmail(receipt.customer?.email) === owner)
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    .map(decorateOrder)
}

/** Pedido puntual, verificando que pertenezca al correo indicado. */
export function getCustomerOrder(email, receiptId) {
  const owner = normalizeEmail(email)
  const receipt = getReceipt(receiptId)

  if (!owner || !receipt) return null
  if (normalizeEmail(receipt.customer?.email) !== owner) return null

  return decorateOrder(receipt)
}

export function getOrder(receiptId) {
  const receipt = getReceipt(receiptId)
  return receipt ? decorateOrder(receipt) : null
}

/** Listado administrativo: todos los pedidos, de cualquier cliente. */
export function listAdminOrders() {
  return listReceipts().map(decorateOrder)
}

export { normalizeEmail }
