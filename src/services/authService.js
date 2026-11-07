/**
 * Capa de persistencia del registro de usuarios.
 *
 * En este proyecto todavía no existe un backend, así que la "base de datos"
 * se simula con localStorage. La interfaz es asíncrona a propósito: cuando
 * exista una API real, solo hay que reemplazar el cuerpo de estas funciones
 * por llamadas fetch/POST sin tocar el formulario.
 *
 * Seguridad implementada:
 *  - La contraseña NUNCA se guarda en texto plano. Se hashea con bcrypt
 *    (coste 12) y una sal aleatoria incluida en el propio hash.
 *  - Los usuarios antiguos con PBKDF2 se migran a bcrypt en su siguiente
 *    inicio de sesión, sin pedirles que cambien la contraseña.
 *  - Los datos personales (nombre, correo y teléfono) se cifran con AES-GCM.
 *    La clave de cifrado se deriva de la contraseña del usuario y NO se guarda,
 *    por lo que el contenido no puede descifrarse solo con leer localStorage.
 *  - Para poder buscar duplicados sin descifrar, se guarda un hash SHA-256 del
 *    correo normalizado (ese hash no permite recuperar el correo).
 *  - La sesión expira tras 30 minutos de inactividad y se destruye
 *    automáticamente (ver `getSession`, `touchSession` y `destroySession`).
 *  - Ningún dato de tarjeta o CVV puede llegar a localStorage: `safeSetItem`
 *    lanza SensitivePaymentDataError antes de escribir.
 *
 * NOTA IMPORTANTE: en producción el hash de contraseñas y el cifrado de datos
 * deben ejecutarse también en el servidor (bcrypt/Argon2 y una clave que jamás
 * llegue al navegador). Este archivo es la implementación de referencia del
 * cliente mientras se integra la API.
 */

import bcrypt from 'bcryptjs'
import {
  SESSION_CHANGED_EVENT,
  SESSION_EXPIRED_EVENT,
  SESSION_IDLE_MS,
  SESSION_STORAGE_KEY,
  SESSION_TOUCH_INTERVAL_MS,
  SecurityError,
  assertNoPaymentCardData,
  assertSecureContext,
  clearCsrfToken,
  notifySessionChanged,
  notifySessionExpired,
  safeGetJson,
  safeRemoveItem,
  safeSetItem,
  sanitizePlainText,
} from '../lib/security.js'
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizeEmail,
} from '../lib/validators.js'

const USERS_STORAGE_KEY = 'jugueteria.users.v1'
const BCRYPT_ROUNDS = 12
const PBKDF2_ITERATIONS = 210_000

export const SESSION_TIMEOUT_MS = SESSION_IDLE_MS
export { SESSION_CHANGED_EVENT, SESSION_EXPIRED_EVENT, SESSION_STORAGE_KEY }

/**
 * Cuenta de administrador de demostración.
 * En producción los administradores se crean desde el servidor; este acceso
 * existe únicamente para poder probar el módulo sin backend. La contraseña
 * se muestra en la pantalla de login solo como credencial de demo y NUNCA se
 * persiste en claro: `registerUser` la guarda con bcrypt.
 */
export const DEMO_ADMIN = {
  fullName: 'Administrador de la tienda',
  email: 'admin@mijugueteria.co',
  password: 'AdminJugueteria2026',
  phone: '6015550123',
}

const textEncoder = new TextEncoder()

export class DuplicateEmailError extends Error {
  constructor() {
    super('El correo electrónico ya está registrado.')
    this.name = 'DuplicateEmailError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('El correo o la contraseña no son correctos.')
    this.name = 'InvalidCredentialsError'
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('La sesión expiró por 30 minutos de inactividad.')
    this.name = 'SessionExpiredError'
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades de codificación                                          */
/* ------------------------------------------------------------------ */

function bytesToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    textEncoder.encode(value),
  )

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function constantTimeEqual(left, right) {
  const a = new Uint8Array(left)
  const b = new Uint8Array(right)

  if (a.length !== b.length) return false

  let difference = 0

  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index]
  }

  return difference === 0
}

function nowIso() {
  return new Date().toISOString()
}

/* ------------------------------------------------------------------ */
/* Contraseñas: bcrypt + migración desde PBKDF2                        */
/* ------------------------------------------------------------------ */

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  return {
    algorithm: 'bcrypt',
    hash,
    cost: BCRYPT_ROUNDS,
    updatedAt: nowIso(),
  }
}

async function matchesLegacyPbkdf2(password, storedPassword) {
  try {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    )

    const bits = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: base64ToBytes(storedPassword.salt),
          iterations: storedPassword.iterations,
          hash: 'SHA-256',
        },
        baseKey,
        256,
      ),
    )

    return constantTimeEqual(bits, base64ToBytes(storedPassword.hash))
  } catch {
    return false
  }
}

/**
 * Verifica una contraseña contra el formato almacenado.
 * Acepta bcrypt (formato actual) y PBKDF2-SHA-256 (formato anterior).
 */
async function matchesPassword(password, storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'object') return false

  const algorithm = String(storedPassword.algorithm ?? '')
  const storedHash = String(storedPassword.hash ?? '')

  if (algorithm === 'bcrypt' || /^\$2[aby]\$/.test(storedHash)) {
    try {
      return await bcrypt.compare(password, storedHash)
    } catch {
      return false
    }
  }

  if (algorithm === 'PBKDF2-SHA-256' && storedPassword.salt && storedHash) {
    return matchesLegacyPbkdf2(password, storedPassword)
  }

  return false
}

function needsBcryptMigration(storedPassword) {
  if (!storedPassword || storedPassword.algorithm !== 'bcrypt') return true

  const cost = Number(String(storedPassword.hash ?? '').split('$')[2])

  return !Number.isFinite(cost) || cost < BCRYPT_ROUNDS
}

/** Rehashea con bcrypt tras un login correcto con PBKDF2. */
async function migratePassword(user, password) {
  const passwordHash = await hashPassword(password)
  const users = readUsers()

  writeUsers(
    users.map((candidate) =>
      candidate.id === user.id
        ? {
            ...candidate,
            password: passwordHash,
            securityVersion: 2,
            passwordUpdatedAt: passwordHash.updatedAt,
          }
        : candidate,
    ),
  )

  return passwordHash
}

/* ------------------------------------------------------------------ */
/* Cifrado de datos personales (AES-GCM)                               */
/* ------------------------------------------------------------------ */

async function deriveEncryptionKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    256,
  )

  return crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt'])
}

async function encryptPersonalData(personalData, key, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(JSON.stringify(personalData)),
  )

  return {
    algorithm: 'AES-GCM-256',
    salt,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

/* ------------------------------------------------------------------ */
/* "Base de datos" local                                               */
/* ------------------------------------------------------------------ */

function readUsers() {
  const parsed = safeGetJson(USERS_STORAGE_KEY, [])
  return Array.isArray(parsed)
    ? parsed.filter((user) => user && typeof user === 'object' && user.id)
    : []
}

function writeUsers(users) {
  safeSetItem(USERS_STORAGE_KEY, users)
}

/**
 * Serializa la sección crítica del registro (comprobar duplicado + escribir).
 *
 * - Web Locks API: coordina varias pestañas del mismo origen, que es el único
 *   escenario donde localStorage puede perder escrituras concurrentes.
 * - Fallback: una cola de promesas para el contexto JavaScript actual.
 *
 * En un backend real esta garantía la aporta una restricción UNIQUE sobre el
 * correo y una transacción; aquí evita que dos clics/pestañas creen duplicados.
 */
let registrationQueue = Promise.resolve()

async function withRegistrationLock(task) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('jugueteria:registration', task)
  }

  const run = registrationQueue.then(task, task)
  registrationQueue = run.then(
    () => undefined,
    () => undefined,
  )

  return run
}

/**
 * Indica si un correo ya existe. Solo compara el hash determinista del correo,
 * nunca el dato en claro.
 */
export async function emailExists(email) {
  const emailHash = await sha256Hex(normalizeEmail(email))
  return readUsers().some((user) => user.emailHash === emailHash)
}

/**
 * Valida, cifra y guarda un usuario nuevo.
 * Lanza DuplicateEmailError si el correo ya está registrado.
 */
export async function registerUser({
  fullName,
  email,
  phone,
  password,
  role = 'cliente',
  requestId = '',
}) {
  assertSecureContext()

  if (!crypto?.subtle) {
    throw new SecurityError(
      'Tu navegador no permite el cifrado seguro. Abre la app con HTTPS o en localhost.',
    )
  }

  const normalizedEmail = normalizeEmail(email)
  const cleanName = sanitizePlainText(fullName, { max: 80 })
  const cleanPhone = sanitizePlainText(phone, { max: 25 })

  // Validación defensiva: nunca confiar únicamente en el formulario.
  if (
    !cleanName ||
    !isValidEmail(normalizedEmail) ||
    !isValidPhone(cleanPhone) ||
    !isValidPassword(password)
  ) {
    throw new Error('Los datos del registro no son válidos.')
  }

  // Ningún dato de tarjeta/CVV puede entrar a la "base de datos".
  assertNoPaymentCardData(
    { fullName: cleanName, email: normalizedEmail, phone: cleanPhone },
    'el registro del usuario',
  )

  // Clave de idempotencia: permite reintentar un envío sin crear otra cuenta.
  const cleanRequestId =
    typeof requestId === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(requestId)
      ? requestId
      : null

  // Las operaciones criptográficas se hacen antes del lock para no bloquear
  // el registro de otros usuarios mientras bcrypt/PBKDF2 trabajan.
  const emailHash = await sha256Hex(normalizedEmail)
  const passwordHash = await hashPassword(password)
  const encryptionSalt = bytesToBase64(
    crypto.getRandomValues(new Uint8Array(16)),
  )
  const encryptionKey = await deriveEncryptionKey(password, encryptionSalt)

  const encryptedData = await encryptPersonalData(
    {
      fullName: cleanName,
      email: normalizedEmail,
      phone: cleanPhone,
    },
    encryptionKey,
    encryptionSalt,
  )

  return withRegistrationLock(async () => {
    const users = readUsers()

    // Reintento idempotente: el mismo requestId devuelve la cuenta ya creada.
    if (cleanRequestId) {
      const previous = users.find(
        (candidate) => candidate.requestId === cleanRequestId,
      )

      if (previous) return { id: previous.id }
    }

    // Segunda comprobación DENTRO de la sección crítica: dos envíos
    // simultáneos con el mismo correo no pueden pasar ambos.
    if (users.some((candidate) => candidate.emailHash === emailHash)) {
      throw new DuplicateEmailError()
    }

    const user = {
      id: crypto.randomUUID(),
      emailHash,
      password: passwordHash,
      personalData: encryptedData,
      role: role === 'admin' ? 'admin' : 'cliente',
      securityVersion: 2,
      createdAt: nowIso(),
      passwordUpdatedAt: passwordHash.updatedAt,
      ...(cleanRequestId ? { requestId: cleanRequestId } : {}),
    }

    writeUsers([...users, user])

    return { id: user.id }
  })
}

/* ------------------------------------------------------------------ */
/* Sesión e inicio de sesión                                           */
/* ------------------------------------------------------------------ */

function buildSession(user, normalizedEmail) {
  const issuedAt = Date.now()

  return {
    userId: user.id,
    email: normalizedEmail,
    role: user.role === 'admin' ? 'admin' : 'cliente',
    signedInAt: new Date(issuedAt).toISOString(),
    lastActivityAt: new Date(issuedAt).toISOString(),
    expiresAt: new Date(issuedAt + SESSION_IDLE_MS).toISOString(),
    idleTimeoutMs: SESSION_IDLE_MS,
    securityVersion: 2,
  }
}

function writeSession(session) {
  safeSetItem(SESSION_STORAGE_KEY, session)
  return session
}

function isSessionExpired(session, now = Date.now()) {
  if (!session || typeof session !== 'object') return true

  const expiresAt = Date.parse(String(session.expiresAt ?? ''))

  if (Number.isFinite(expiresAt)) return now >= expiresAt

  // Compatibilidad con sesiones creadas antes de existir `expiresAt`.
  const lastActivity = Date.parse(
    String(session.lastActivityAt ?? session.signedInAt ?? ''),
  )

  return !Number.isFinite(lastActivity) || now - lastActivity >= SESSION_IDLE_MS
}

/**
 * Crea la cuenta de administrador de demostración si todavía no existe.
 * Se invoca al iniciar sesión con las credenciales demo.
 */
let adminSeedPromise = null

export function ensureDemoAdmin() {
  if (!adminSeedPromise) {
    adminSeedPromise = (async () => {
      const emailHash = await sha256Hex(normalizeEmail(DEMO_ADMIN.email))
      const exists = readUsers().some((user) => user.emailHash === emailHash)

      if (exists) return

      await registerUser({
        fullName: DEMO_ADMIN.fullName,
        email: DEMO_ADMIN.email,
        phone: DEMO_ADMIN.phone,
        password: DEMO_ADMIN.password,
        role: 'admin',
      })
    })().catch((error) => {
      adminSeedPromise = null
      throw error
    })
  }

  return adminSeedPromise
}

/**
 * Valida las credenciales y abre una sesión local de 30 minutos.
 *
 * La sesión guarda id, correo y rol: son los datos mínimos para identificar
 * al usuario y proteger el módulo de administración. En producción la sesión
 * debe ser una cookie httpOnly emitida por el servidor.
 */
export async function loginUser({ email, password }) {
  assertSecureContext()

  if (!crypto?.subtle) {
    throw new SecurityError(
      'Tu navegador no permite el cifrado seguro. Abre la app con HTTPS o en localhost.',
    )
  }

  const normalizedEmail = normalizeEmail(email)
  const emailHash = await sha256Hex(normalizedEmail)
  let user = readUsers().find((candidate) => candidate.emailHash === emailHash)

  const isDemoAdmin =
    normalizedEmail === normalizeEmail(DEMO_ADMIN.email) &&
    password === DEMO_ADMIN.password

  if (!user && isDemoAdmin) {
    await ensureDemoAdmin()
    user = readUsers().find((candidate) => candidate.emailHash === emailHash)
  }

  if (!user || !(await matchesPassword(password, user.password))) {
    throw new InvalidCredentialsError()
  }

  // Migración transparente: PBKDF2 → bcrypt en el primer login correcto.
  if (needsBcryptMigration(user.password)) {
    user = { ...user, password: await migratePassword(user, password) }
  }

  const session = writeSession(buildSession(user, normalizedEmail))

  notifySessionChanged({ session })

  return session
}

/**
 * Devuelve la sesión activa o null si no hay nadie autenticado o si expiró.
 * Por defecto NO escribe en localStorage: el latido de actividad lo hace
 * `SessionGuard` con `touchSession`, evitando efectos secundarios en render.
 */
export function getSession({ touch = false } = {}) {
  const parsed = safeGetJson(SESSION_STORAGE_KEY, null)

  if (!parsed || typeof parsed.email !== 'string' || !parsed.userId) {
    return null
  }

  if (isSessionExpired(parsed)) {
    destroySession('expired')
    return null
  }

  // Integridad: la sesión debe apuntar a un usuario que siga existiendo.
  const users = readUsers()

  if (users.length > 0 && !users.some((user) => user.id === parsed.userId)) {
    destroySession('invalid')
    return null
  }

  const session = {
    ...parsed,
    role: parsed.role === 'admin' ? 'admin' : 'cliente',
  }

  return touch ? touchSession(session) : session
}

/** Extiende la sesión hasta 30 minutos después de la última actividad. */
export function touchSession(session = safeGetJson(SESSION_STORAGE_KEY, null)) {
  if (!session || typeof session !== 'object') return null

  if (isSessionExpired(session)) {
    destroySession('expired')
    return null
  }

  const now = Date.now()
  const lastActivity = Date.parse(
    String(session.lastActivityAt ?? session.signedInAt ?? ''),
  )
  const elapsed = Number.isFinite(lastActivity) ? now - lastActivity : Infinity

  if (elapsed < SESSION_TOUCH_INTERVAL_MS && session.expiresAt) {
    return {
      ...session,
      role: session.role === 'admin' ? 'admin' : 'cliente',
    }
  }

  const next = {
    ...session,
    role: session.role === 'admin' ? 'admin' : 'cliente',
    lastActivityAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_IDLE_MS).toISOString(),
    idleTimeoutMs: SESSION_IDLE_MS,
  }

  writeSession(next)
  return next
}

/** Milisegundos restantes hasta la expiración, o null si no hay sesión. */
export function getSessionRemainingMs(
  session = safeGetJson(SESSION_STORAGE_KEY, null),
) {
  if (!session) return null

  const expiresAt = Date.parse(String(session.expiresAt ?? ''))

  if (Number.isFinite(expiresAt)) {
    return Math.max(0, expiresAt - Date.now())
  }

  const lastActivity = Date.parse(
    String(session.lastActivityAt ?? session.signedInAt ?? ''),
  )

  if (!Number.isFinite(lastActivity)) return 0

  return Math.max(0, lastActivity + SESSION_IDLE_MS - Date.now())
}

export function isSessionActive() {
  return getSession({ touch: false }) !== null
}

/**
 * Destruye la sesión y avisa a la interfaz. Se usa tanto en logout manual
 * como en expiración por inactividad o por integridad inválida.
 */
export function destroySession(reason = 'manual') {
  safeRemoveItem(SESSION_STORAGE_KEY)
  clearCsrfToken()

  const notify = () => {
    notifySessionExpired(reason)
    notifySessionChanged({ session: null, reason })
  }

  // Fuera del ciclo de render: `getSession` puede llamarse desde un componente.
  if (typeof queueMicrotask === 'function') queueMicrotask(notify)
  else setTimeout(notify, 0)
}

export function logoutUser() {
  destroySession('manual')
}
