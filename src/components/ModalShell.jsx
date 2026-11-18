import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from './icons.jsx'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Contenedor accesible para los modales de la tienda.
 *
 * Se monta en `document.body`, bloquea el scroll de fondo, atrapa el foco
 * dentro del diálogo, cierra con Escape o clic en el fondo y devuelve el foco
 * al elemento que lo abrió. El contenido de cada modal se pasa como children.
 */
export default function ModalShell({
  onClose,
  labelledBy,
  describedBy,
  closeLabel = 'Cerrar ventana',
  maxWidth = 'max-w-lg',
  children,
}) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current
      if (!dialog) return

      const preferred = dialog.querySelector('[data-autofocus]')
      const first = preferred ?? dialog.querySelector(FOCUSABLE_SELECTOR)
      first?.focus()
    }, 60)

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [])

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/65 px-3 py-6 backdrop-blur-sm"
      onMouseDown={handleBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`relative my-auto w-full ${maxWidth} animate-pop-in overflow-hidden rounded-[30px] border-[3px] border-amber-200 bg-[#fffaf2] shadow-[0_30px_80px_-24px_rgba(15,23,42,0.7)]`}
      >
        <div aria-hidden="true" className="christmas-stripes h-2 w-full" />

        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-3 top-5 z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-amber-100 transition hover:bg-white hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[calc(100dvh-3rem)] overflow-y-auto px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
