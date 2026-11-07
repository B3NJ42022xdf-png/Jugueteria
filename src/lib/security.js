/**
 * Capa de seguridad compartida por toda la aplicación.
 *
 * Reúne las defensas que deben aplicarse en el navegador:
 *  - saneamiento de texto contra XSS (se elimina cualquier etiqueta HTML),
 *  - validación de URLs para imágenes y webhooks,
 *  - detección y bloqueo de números de tarjeta / CVV antes de persistir,
 *  - almacenamiento seguro de JSON en localStorage,
 *  - token CSRF de doble envío para los endpoints que mutan estado,
 *  - redirección forzada a HTTPS fuera de localhost.
 *
 * Ninguna de estas funciones reemplaza las defensas del servidor: son la
 * primera barrera del cliente y la última antes de escribir en localStorage.
 */

export const SESSION_STORAGE_KEY = 'jugueteria.session.v1'
export const SESSION_IDLE_MS = 30 * 60 * 1000
export const SESSION_TOUCH_INTERVAL_MS = 30 * 1000
export const SESSION_CHANGED_EVENT = 'jugueteria:session-changed'
export const SESSION_EXPIRED_EVENT = 'jugueteria:session-expired'

export const CSRF_HEADER = 'X-CSRF-Token'
export const CSRF_ENDPOINT = '/api/csrf'
const CSRF_STORAGE_KEY = 'jugueteria.csrf.v1'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const SAFE_IDENTIFIER_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/
const RESERVED_IDENTIFIERS = new Set([
  '__proto__',
  'prototype',
  'constructor',
])
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g // eslint-disable-line no-control-regex
const HTML_TAGS = /<\s*\/?\s*[a-zA-Z][^>]*>/g
const MULTIPLE_SPACES = /[ \t]{2,}/g
const MULTIPLE_NEWLINES = /\n{3,}/g

export class SecurityError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SecurityError'
  }
}

export class SensitivePaymentDataError extends SecurityError {
  constructor(message = 'No se permite almacenar números de tarjeta ni códigos CVV.') {
    super(message)
    this.name = 'SensitivePaymentDataError'
  }
}

/* ------------------------------------------------------------------ */
/* Saneamiento de texto (XSS)                                          */
/* ------------------------------------------------------------------ */

/**
 * Convierte cualquier valor en texto plano seguro.
 * Elimina etiquetas HTML, caracteres de control y limita la longitud.
 * No decodifica entidades: React las vuelve a mostrar como texto.
 */
export function sanitizePlainText(
  value,
  { max = 500, allowNewlines = false, fallback = '' } = {},
) {
  let text = String(value ?? '').normalize('NFC')

  text = allowNewlines
    ? text.replace(/\r\n?/g, '\n')
    : text.replace(/[\r\n\t]+/g, ' ')

  text = text
    .replace(CONTROL_CHARACTERS, '')
    .replace(HTML_TAGS, '')
    .replace(/[<>]/g, '')

  text = allowNewlines
    ? text.replace(MULTIPLE_NEWLINES, '\n\n')
    : text.replace(MULTIPLE_SPACES, ' ')

  return text.trim().slice(0, max) || fallback
}

export function sanitizeEmail(value) {
  const text = sanitizePlainText(value, { max: 120 }).toLowerCase()
  return EMAIL_REGEX.test(text) ? text : ''
}

/**
 * Identificadores internos (ids de producto, claves de carrito).
 * Bloquea `__proto__`, `constructor` y cualquier intento de prototype
 * pollution que pudiera venir de un localStorage manipulado.
 */
export function sanitizeIdentifier(value, { max = 64 } = {}) {
  const text = String(value ?? '').trim()

  if (
    !text ||
    text.length > max ||
    RESERVED_IDENTIFIERS.has(text.toLowerCase()) ||
    !SAFE_IDENTIFIER_REGEX.test(text)
  ) {
    return ''
  }

  return text
}

export function assertSafeIdentifier(value, label = 'identificador') {
  const clean = sanitizeIdentifier(value)

  if (!clean) {
    throw new SecurityError(`El ${label} no es válido.`)
  }

  return clean
}

/**
 * Solo acepta http(s) y, para imágenes, data:image/* en base64.
 * Bloquea `javascript:`, `data:text/html` y cualquier esquema peligroso.
 */
export function sanitizeUrl(
  value,
  { allowDataImage = false, max = 2_000_000 } = {},
) {
  const text = String(value ?? '').trim()

  if (!text || text.length > max) return ''

  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(text)) {
    return text
  }

  try {
    const url = new URL(text, 'https://mijugueteria.local')

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''

    return text
  } catch {
    return ''
  }
}

/* ------------------------------------------------------------------ */
/* Detección de datos de pago (PAN / CVV)                              */
/* ------------------------------------------------------------------ */

const CARD_NUMBER_CANDIDATE = /(?:\d[ -]?){13,19}/g
const MAGNETIC_STRIPE = /%B\d{12,19}\^/
const CVV_INLINE = /\b(?:cvv|cvc|cid|csc|security\s*code|c[oó]digo\s*de\s*seguridad)\b\s*[:=#-]?\s*\d{3,4}\b/i

const SENSITIVE_KEYS = new Set([
  'cvv',
  'cvc',
  'cid',
  'csc',
  'pin',
  'cardnumber',
  'cardnumbers',
  'pan',
  'creditcard',
  'debitcard',
  'numerotarjeta',
  'tarjetacredito',
  'tarjetadebito',
  'securitycode',
  'codigoseguridad',
  'trackdata',
  'magstripe',
  'expiry',
])

function normalizeKey(key) {
  return String(key ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function isSensitivePaymentKey(key) {
  const normalized = normalizeKey(key)

  return (
    SENSITIVE_KEYS.has(normalized) ||
    /(cvv|cvc|cardnumber|numerotarjeta|securitycode|codigoseguridad|trackdata|magstripe)/.test(
      normalized,
    )
  )
}

/** Algoritmo de Luhn: descarta secuencias de 13–19 dígitos que no son tarjetas. */
export function passesLuhn(digits) {
  if (!/^\d{13,19}$/.test(digits)) return false

  let sum = 0
  let double = false

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])

    if (double) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    double = !double
  }

  return sum % 10 === 0
}

export function findCardNumbers(value) {
  const text = String(value ?? '')
  const matches = text.match(CARD_NUMBER_CANDIDATE) ?? []

  return matches
    .map((candidate) => candidate.replace(/\D/g, ''))
    .filter((digits) => passesLuhn(digits))
}

function inspectPaymentData(value, seen, depth) {
  if (depth > 8) return false

  if (typeof value === 'string') {
    return (
      findCardNumbers(value).length > 0 ||
      CVV_INLINE.test(value) ||
      MAGNETIC_STRIPE.test(value)
    )
  }

  if (typeof value === 'number') {
    return passesLuhn(String(Math.trunc(value)))
  }

  if (!value || typeof value !== 'object') return false
  if (seen.has(value)) return false

  seen.add(value)

  if (Array.isArray(value)) {
    return value.some((item) => inspectPaymentData(item, seen, depth + 1))
  }

  for (const [key, entry] of Object.entries(value)) {
    if (isSensitivePaymentKey(key) && entry !== '' && entry != null) {
      return true
    }

    if (inspectPaymentData(entry, seen, depth + 1)) return true
  }

  return false
}

/** Verdadero si el valor contiene un PAN válido, un CVV o una banda magnética. */
export function containsPaymentCardData(value) {
  return inspectPaymentData(value, new WeakSet(), 0)
}

/**
 * Lanza SensitivePaymentDataError antes de guardar o exportar datos.
 * Se usa en todos los servicios que escriben en localStorage.
 */
export function assertNoPaymentCardData(value, context = 'los datos') {
  if (containsPaymentCardData(value)) {
    throw new SensitivePaymentDataError(
      `Bloqueado por seguridad: ${context} contiene un número de tarjeta o un código CVV. Esa información nunca debe almacenarse.`,
    )
  }

  return value
}

/** Reemplaza PAN/CVV por [REDACTADO] sin borrar el resto del objeto. */
export function redactPaymentCardData(value, seen = new WeakSet()) {
  if (typeof value === 'string') {
    return value
      .replace(CARD_NUMBER_CANDIDATE, (candidate) =>
        passesLuhn(candidate.replace(/\D/g, '')) ? '[REDACTADO]' : candidate,
      )
      .replace(CVV_INLINE, '[REDACTADO]')
      .replace(MAGNETIC_STRIPE, '[REDACTADO]')
  }

  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return value

  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => redactPaymentCardData(item, seen))
  }

  const output = {}

  for (const [key, entry] of Object.entries(value)) {
    if (isSensitivePaymentKey(key) && entry !== '' && entry != null) {
      output[key] = '[REDACTADO]'
      continue
    }

    output[key] = redactPaymentCardData(entry, seen)
  }

  return output
}

/* ------------------------------------------------------------------ */
/* localStorage seguro                                                 */
/* ------------------------------------------------------------------ */

export function safeSetItem(key, value, { serialize = true } = {}) {
  assertNoPaymentCardData(key, 'la clave de almacenamiento')

  const payload = serialize ? JSON.stringify(value) : String(value)
  assertNoPaymentCardData(payload, `la clave "${key}"`)

  localStorage.setItem(key, payload)
  return payload
}

export function safeGetJson(key, fallback = null) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function safeRemoveItem(key) {
  localStorage.removeItem(key)
}

/**
 * Auditoría de arranque: recorre localStorage y elimina cualquier registro
 * con número de tarjeta, CVV o una clave explícitamente sensible.
 * Devuelve un informe para la consola y para pruebas automatizadas.
 */
export function auditLocalStorageForPaymentData() {
  const removed = []
  const findings = []

  if (typeof localStorage === 'undefined') {
    return { clean: true, removed, findings, scannedAt: new Date().toISOString() }
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)

    if (!key) continue

    if (isSensitivePaymentKey(key)) {
      removed.push({ key, reason: 'clave sensible' })
      localStorage.removeItem(key)
      continue
    }

    const raw = localStorage.getItem(key)

    if (!raw) continue

    let parsed = raw

    try {
      parsed = JSON.parse(raw)
    } catch {
      // El valor no es JSON: se analiza como texto.
    }

    if (containsPaymentCardData(parsed) || containsPaymentCardData(raw)) {
      removed.push({ key, reason: 'contenido de pago' })
      findings.push({
        key,
        cards: findCardNumbers(raw).length,
      })
      localStorage.removeItem(key)
    }
  }

  return {
    clean: removed.length === 0,
    removed,
    findings,
    scannedAt: new Date().toISOString(),
  }
}

/* ------------------------------------------------------------------ */
/* CSRF (token de doble envío)                                         */
/* ------------------------------------------------------------------ */

let csrfTokenCache = null
let csrfRequest = null

export function clearCsrfToken() {
  csrfTokenCache = null
  csrfRequest = null

  try {
    sessionStorage.removeItem(CSRF_STORAGE_KEY)
  } catch {
    // sessionStorage puede estar bloqueado; el token en memoria sigue vivo.
  }
}

/**
 * Obtiene un token CSRF del servidor. Se cachea en memoria y en sessionStorage
 * para no pedir uno nuevo en cada operación.
 */
export async function getCsrfToken({ force = false } = {}) {
  if (csrfTokenCache && !force) return csrfTokenCache

  if (!force) {
    try {
      const cached = sessionStorage.getItem(CSRF_STORAGE_KEY)

      if (cached) {
        csrfTokenCache = cached
        return cached
      }
    } catch {
      // Sin sessionStorage se usa solo la memoria.
    }
  }

  if (!csrfRequest) {
    csrfRequest = fetch(CSRF_ENDPOINT, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new SecurityError(
            `No se pudo obtener el token CSRF (HTTP ${response.status}).`,
          )
        }

        const payload = await response.json()

        if (!payload?.token || typeof payload.token !== 'string') {
          throw new SecurityError('El servidor devolvió un token CSRF inválido.')
        }

        csrfTokenCache = payload.token

        try {
          sessionStorage.setItem(CSRF_STORAGE_KEY, payload.token)
        } catch {
          // La memoria es suficiente para esta pestaña.
        }

        return csrfTokenCache
      })
      .finally(() => {
        csrfRequest = null
      })
  }

  return csrfRequest
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * `fetch` con token CSRF automático para POST/PUT/PATCH/DELETE.
 * Siempre envía cookies de la misma origen y desactiva la caché.
 */
export async function csrfFetch(input, init = {}) {
  const method = String(init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers ?? {})

  headers.set('Accept', headers.get('Accept') ?? 'application/json')

  if (!SAFE_METHODS.has(method)) {
    const token = await getCsrfToken()

    headers.set(CSRF_HEADER, token)
    headers.set('X-Requested-With', 'XMLHttpRequest')
    headers.set('X-Content-Type-Options', 'nosniff')
  }

  return fetch(input, {
    ...init,
    method,
    headers,
    credentials: 'same-origin',
    cache: init.cache ?? 'no-store',
  })
}

/* ------------------------------------------------------------------ */
/* HTTPS                                                               */
/* ------------------------------------------------------------------ */

function isLocalHostname(hostname) {
  const host = String(hostname ?? '').toLowerCase()

  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.localhost')
  )
}

/**
 * Fuerza HTTPS en cualquier host que no sea local. En localhost se permite
 * HTTP para no romper el servidor de desarrollo de Vite.
 */
export function enforceHttps(location = globalThis.location) {
  if (!location || location.protocol !== 'http:') return false
  if (isLocalHostname(location.hostname)) return false

  const target = `https://${location.host}${location.pathname}${location.search}${location.hash}`
  location.replace(target)

  return true
}

export function assertSecureContext() {
  const location = globalThis.location

  if (
    globalThis.isSecureContext === false ||
    (location?.protocol === 'http:' && !isLocalHostname(location.hostname))
  ) {
    throw new SecurityError(
      'La conexión no es segura. Abre la tienda por HTTPS para proteger tus datos.',
    )
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades de sesión                                                */
/* ------------------------------------------------------------------ */

export function notifySessionChanged(detail = {}) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT, { detail }))
}

export function notifySessionExpired(reason = 'expired') {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }),
  )
}
