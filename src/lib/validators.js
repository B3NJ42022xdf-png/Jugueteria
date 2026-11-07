/**
 * Reglas de validación compartidas por el formulario de registro.
 * Se mantienen en un archivo aparte para poder reutilizarlas en el login
 * o en cualquier otro formulario de la tienda.
 */

import { sanitizePlainText } from './security.js'

// Sintaxis de correo: algo@dominio.tld (sin espacios y con un TLD de 2+ letras).
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

// Caracteres permitidos en un teléfono: dígitos, espacios, +, -, ( ) y .
const PHONE_REGEX = /^\+?[\d\s().-]+$/

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128
export const PASSWORD_REQUIREMENTS = [
  'Al menos 12 caracteres.',
  'Una letra mayúscula y una minúscula.',
  'Al menos un número.',
  'Evita contraseñas comunes o repetitivas.',
]

const COMMON_PASSWORDS = new Set([
  '123456789012',
  'password1234',
  'contrasena123',
  'qwertyuiop12',
  'administrador',
  'jugueteria2026',
  'admin1234567',
  'iloveyou1234',
  'welcome12345',
])

export function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

/** Nombre visible saneado: sin etiquetas HTML ni caracteres de control. */
export function normalizeFullName(value) {
  return sanitizePlainText(value, { max: 80 })
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email))
}

export function isValidPhone(phone) {
  const value = String(phone ?? '').trim()
  if (!PHONE_REGEX.test(value)) return false

  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

/**
 * Contraseña robusta:
 *  - longitud mínima de 12 y máxima de 128,
 *  - mayúscula, minúscula y número,
 *  - sin contraseñas comunes ni secuencias obvias.
 *
 * No se exige símbolo para no bloquear frases largas; la longitud aporta
 * más entropía que un carácter especial aislado.
 */
export function isValidPassword(password) {
  const value = String(password ?? '')

  if (
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH
  ) {
    return false
  }

  if (
    !/[a-z]/.test(value) ||
    !/[A-Z]/.test(value) ||
    !/\d/.test(value)
  ) {
    return false
  }

  if (COMMON_PASSWORDS.has(value.toLowerCase())) return false

  // Rechaza "aaaaaaaaaaaa", "123456789012" y secuencias de teclado.
  if (/^(.)\1+$/.test(value)) return false
  if (/^(?:0123456789|1234567890|abcdefghij|qwertyuiop)/i.test(value)) {
    return false
  }

  return true
}

/**
 * Devuelve el mensaje de error del campo o null si es válido.
 * Un solo lugar centraliza los textos que ve el usuario.
 */
export function validateField(name, value) {
  const cleanValue = typeof value === 'string' ? value : ''

  switch (name) {
    case 'fullName': {
      const cleanName = normalizeFullName(cleanValue)

      if (!cleanName) return 'Ingresa tu nombre completo.'
      if (cleanName.length < 3) {
        return 'El nombre debe tener al menos 3 caracteres.'
      }
      if (cleanName.length > 80) {
        return 'El nombre no puede superar los 80 caracteres.'
      }
      return null
    }

    case 'email':
      if (!cleanValue.trim()) return 'Ingresa tu correo electrónico.'
      if (!EMAIL_REGEX.test(normalizeEmail(cleanValue))) {
        return 'Ingresa un correo válido, por ejemplo: nombre@correo.com.'
      }
      if (cleanValue.length > 120) {
        return 'El correo no puede superar los 120 caracteres.'
      }
      return null

    case 'phone':
      if (!cleanValue.trim()) return 'Ingresa tu número de teléfono.'
      if (!isValidPhone(cleanValue)) {
        return 'Ingresa un teléfono válido de 7 a 15 dígitos.'
      }
      return null

    case 'password':
      if (!cleanValue) return 'Crea una contraseña.'
      if (!isValidPassword(cleanValue)) {
        return 'Usa al menos 12 caracteres con mayúscula, minúscula y número; evita contraseñas comunes.'
      }
      return null

    default:
      return null
  }
}

/**
 * Valida todos los campos de forma síncrona (sin consultar la "base de datos").
 * Se usa para decidir si el botón de envío puede habilitarse.
 */
export function validateRegistrationForm(form) {
  const errors = {}

  for (const field of ['fullName', 'email', 'phone', 'password']) {
    const message = validateField(field, form[field])
    if (message) errors[field] = message
  }

  return errors
}

/** Puntaje orientativo para la barra de fortaleza del formulario. */
export function getPasswordScore(password) {
  const value = String(password ?? '')
  let score = 0

  if (value.length >= PASSWORD_MIN_LENGTH) score += 1
  if (value.length >= 16) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  if (COMMON_PASSWORDS.has(value.toLowerCase())) score = 0

  return Math.min(5, score)
}
