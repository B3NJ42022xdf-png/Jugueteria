import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const TOAST_DURATION = 3800
const MAX_VISIBLE = 3

export const CART_TOAST_EVENT = 'jugueteria:cart-toast'

/**
 * Notificación flotante que aparece al agregar un producto al carrito.
 *
 * `ProductCard` emite el evento `jugueteria:cart-toast` cuando la operación
 * termina bien; este componente escucha el evento y muestra una tarjeta con la
 * miniatura, el nombre del producto y un acceso directo al carrito. El contador
 * del encabezado se actualiza solo porque vive en el contexto del carrito.
 */
export default function CartToast() {
  const [toasts, setToasts] = useState([])
  const nextIdRef = useRef(0)
  const timersRef = useRef(new Map())

  useEffect(() => {
    const timers = timersRef.current

    function handleAdd(event) {
      const detail = event.detail ?? {}
      const id = (nextIdRef.current += 1)

      setToasts((current) => [
        ...current.slice(-(MAX_VISIBLE - 1)),
        {
          id,
          name: detail.name ?? 'Juguete',
          image: detail.image ?? '',
        },
      ])

      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
        timers.delete(id)
      }, TOAST_DURATION)

      timers.set(id, timer)
    }

    window.addEventListener(CART_TOAST_EVENT, handleAdd)

    return () => {
      window.removeEventListener(CART_TOAST_EVENT, handleAdd)
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-card pointer-events-auto flex items-center gap-3 rounded-2xl border-[3px] border-amber-200 bg-white/95 p-3 shadow-[0_18px_40px_-18px_rgba(127,29,29,0.55)] backdrop-blur"
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
              '🎁'
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
              <span aria-hidden="true">✓</span> Agregado al carrito
            </p>
            <p className="truncate text-sm font-extrabold text-toy-ink">
              {toast.name}
            </p>
            <Link
              to="/carrito"
              className="text-xs font-bold text-red-700 underline-offset-2 transition hover:text-red-500 hover:underline"
            >
              Ver carrito →
            </Link>
          </div>

          <span
            aria-hidden="true"
            className="toast-progress absolute bottom-0 left-0 h-1 rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-emerald-500"
            style={{ animationDuration: `${TOAST_DURATION}ms` }}
          />
        </div>
      ))}
    </div>
  )
}
