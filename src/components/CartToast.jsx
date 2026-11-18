import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CART_TOAST_EVENT } from '../lib/cartEvents.js'
import { TOAST_EVENT, TOAST_KINDS } from '../lib/toast.js'
import {
  AlertTriangle,
  Check,
  Gift,
  Heart,
  HeartFilled,
  Sparkles,
  Ticket,
  X,
} from './icons.jsx'

const TOAST_DURATION = 3800
const MAX_VISIBLE = 3

const KIND_STYLES = {
  [TOAST_KINDS.CART]: {
    label: 'Agregado al carrito',
    accent: 'text-emerald-600',
    border: 'border-amber-200',
    icon: Gift,
    progress: 'from-red-600 via-amber-400 to-emerald-500',
  },
  [TOAST_KINDS.FAVORITE]: {
    label: 'Guardado en favoritos',
    accent: 'text-rose-600',
    border: 'border-rose-200',
    icon: HeartFilled,
    progress: 'from-rose-500 via-pink-400 to-amber-400',
  },
  [TOAST_KINDS.FAVORITE_REMOVED]: {
    label: 'Quitado de favoritos',
    accent: 'text-slate-500',
    border: 'border-slate-200',
    icon: Heart,
    progress: 'from-slate-400 via-slate-300 to-slate-200',
  },
  [TOAST_KINDS.COUPON]: {
    label: 'Cupón aplicado',
    accent: 'text-emerald-600',
    border: 'border-emerald-200',
    icon: Ticket,
    progress: 'from-emerald-600 via-emerald-400 to-amber-400',
  },
  [TOAST_KINDS.SUCCESS]: {
    label: '¡Listo!',
    accent: 'text-emerald-600',
    border: 'border-emerald-200',
    icon: Check,
    progress: 'from-emerald-600 via-emerald-400 to-amber-400',
  },
  [TOAST_KINDS.ERROR]: {
    label: 'No se pudo completar',
    accent: 'text-rose-600',
    border: 'border-rose-200',
    icon: AlertTriangle,
    progress: 'from-rose-600 via-rose-400 to-amber-400',
  },
  [TOAST_KINDS.INFO]: {
    label: 'Mi Juguetería',
    accent: 'text-sky-600',
    border: 'border-sky-200',
    icon: Sparkles,
    progress: 'from-sky-500 via-sky-400 to-amber-300',
  },
}

/**
 * Host de notificaciones flotantes.
 *
 * Escucha el evento genérico `jugueteria:toast` (carrito, favoritos, cupones)
 * y también el evento histórico del carrito para no romper las páginas que ya
 * lo emitían. Las notificaciones aparecen abajo a la derecha, se apilan hasta
 * tres y se cierran solas.
 */
export default function CartToast() {
  const [toasts, setToasts] = useState([])
  const nextIdRef = useRef(0)
  const timersRef = useRef(new Map())

  useEffect(() => {
    const timers = timersRef.current

    function pushToast(detail) {
      const id = (nextIdRef.current += 1)

      setToasts((current) => [
        ...current.slice(-(MAX_VISIBLE - 1)),
        { id, ...detail },
      ])

      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
        timers.delete(id)
      }, TOAST_DURATION)

      timers.set(id, timer)
    }

    function handleToast(event) {
      const detail = event.detail ?? {}
      pushToast({
        kind: detail.kind ?? TOAST_KINDS.INFO,
        title: detail.title ?? '',
        message: detail.message ?? '',
        image: detail.image ?? '',
        href: detail.href ?? '',
        actionLabel: detail.actionLabel ?? '',
      })
    }

    function handleLegacyCartToast(event) {
      const detail = event.detail ?? {}
      pushToast({
        kind: TOAST_KINDS.CART,
        title: detail.name ?? 'Juguete',
        message: 'Ya está en tu carrito.',
        image: detail.image ?? '',
        href: '/carrito',
        actionLabel: 'Ver carrito →',
      })
    }

    window.addEventListener(TOAST_EVENT, handleToast)
    window.addEventListener(CART_TOAST_EVENT, handleLegacyCartToast)

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast)
      window.removeEventListener(CART_TOAST_EVENT, handleLegacyCartToast)
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  function dismiss(id) {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80"
    >
      {toasts.map((toast) => {
        const style = KIND_STYLES[toast.kind] ?? KIND_STYLES[TOAST_KINDS.INFO]
        const ToastIcon = style.icon

        return (
          <div
            key={toast.id}
            className={`toast-card relative pointer-events-auto flex items-center gap-3 rounded-2xl border-[3px] ${style.border} bg-white/95 p-3 pr-9 shadow-[0_18px_40px_-18px_rgba(127,29,29,0.55)] backdrop-blur`}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-red-50 text-xl ring-2 ring-amber-100">
              {toast.image ? (
                <img
                  src={toast.image}
                  alt=""
                  width="48"
                  height="48"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ToastIcon className="h-6 w-6 text-red-600" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${style.accent}`}
              >
                <Check className="h-3.5 w-3.5" /> {style.label}
              </p>
              {toast.title && (
                <p className="truncate text-sm font-extrabold text-toy-ink">
                  {toast.title}
                </p>
              )}
              {toast.message && (
                <p className="text-xs font-semibold leading-snug text-slate-500">
                  {toast.message}
                </p>
              )}
              {toast.href && (
                <Link
                  to={toast.href}
                  className="text-xs font-bold text-red-700 underline-offset-2 transition hover:text-red-500 hover:underline"
                >
                  {toast.actionLabel || 'Ver más →'}
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar notificación"
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <span
              aria-hidden="true"
              className={`toast-progress absolute bottom-0 left-0 h-1 rounded-full bg-gradient-to-r ${style.progress}`}
              style={{ animationDuration: `${TOAST_DURATION}ms` }}
            />
          </div>
        )
      })}
    </div>
  )
}
