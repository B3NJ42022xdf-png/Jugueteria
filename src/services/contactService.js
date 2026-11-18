/**
 * Mensajes del formulario "Contáctanos".
 *
 * No hay backend real en esta demo: el envío se simula con una pequeña espera
 * y el mensaje saneado queda registrado en localStorage, igual que los pedidos
 * y comprobantes. Así la confirmación con número de referencia es verificable
 * y el formulario se comporta como una función completa.
 */

import {
  safeGetJson,
  safeSetItem,
  sanitizeEmail,
  sanitizePlainText,
} from '../lib/security.js'

export const CONTACT_MESSAGES_KEY = 'jugueteria.contactMessages.v1'

const SEND_DELAY_MS = 700

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * @param {{name: string, email: string, subject: string, message: string}} input
 * @returns {Promise<{reference: string, createdAt: string}>}
 */
export async function sendContactMessage({ name, email, subject, message }) {
  const cleanName = sanitizePlainText(name, { max: 80 })
  const cleanEmail = sanitizeEmail(email)
  const cleanSubject = sanitizePlainText(subject, { max: 120 })
  const cleanMessage = sanitizePlainText(message, {
    max: 1200,
    allowNewlines: true,
  })

  if (cleanName.length < 2) {
    throw new Error('Escribe tu nombre para saber cómo llamarte.')
  }

  if (!cleanEmail) {
    throw new Error('Necesitamos un correo válido para responderte.')
  }

  if (cleanSubject.length < 3) {
    throw new Error('Resume el motivo de tu consulta en el asunto.')
  }

  if (cleanMessage.length < 10) {
    throw new Error('Cuéntanos un poco más para poder ayudarte.')
  }

  await wait(SEND_DELAY_MS)

  const stored = safeGetJson(CONTACT_MESSAGES_KEY, [])
  const entries = Array.isArray(stored) ? stored : []
  const year = new Date().getFullYear()
  const reference = `MSG-${year}-${String(entries.length + 1).padStart(4, '0')}`

  const record = {
    id: reference,
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
    channel: 'formulario-web',
    status: 'recibido',
    createdAt: new Date().toISOString(),
  }

  safeSetItem(CONTACT_MESSAGES_KEY, [...entries, record])

  return { reference, createdAt: record.createdAt }
}
