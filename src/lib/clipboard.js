/**
 * Copia texto al portapapeles del usuario.
 *
 * Usa la API moderna cuando está disponible (requiere contexto seguro) y cae
 * en el método clásico con un textarea temporal para navegadores antiguos o
 * cuando el permiso es rechazado. Devuelve `true` solo si la copia funcionó.
 */
export async function copyText(value) {
  const text = String(value ?? '')

  if (!text) return false

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permiso rechazado o contexto no seguro: se intenta el método clásico.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length)

    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)

    return copied
  } catch {
    return false
  }
}
