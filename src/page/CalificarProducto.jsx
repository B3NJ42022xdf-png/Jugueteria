import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader.jsx'
import { getSession } from '../services/authService.js'
import {
  getOrder,
  getProductRating,
  saveProductRating,
} from '../services/orderService.js'

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
})

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function StarButton({ value, selected, onSelect }) {
  const active = value <= selected

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
      aria-pressed={value === selected}
      className={`grid h-11 w-11 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 ${
        active
          ? 'border-amber-300 bg-amber-50 text-amber-500'
          : 'border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:text-amber-400'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8L12 3.6Z" />
      </svg>
    </button>
  )
}

function LockIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  )
}

function ArrowLeftIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  )
}

export default function CalificarProducto() {
  const { orderId, productId } = useParams()
  const navigate = useNavigate()
  const [session] = useState(() => getSession())
  const [order] = useState(() => getOrder(orderId))
  const [existingReview] = useState(() =>
    getProductRating(orderId, productId),
  )
  const [stars, setStars] = useState(() => existingReview?.stars ?? 0)
  const [comment, setComment] = useState(() => existingReview?.comment ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const item = useMemo(
    () => order?.items.find((entry) => entry.productId === productId) ?? null,
    [order, productId],
  )

  if (!session) {
    return <Navigate to="/login" replace state={{ from: `/calificar/${orderId}/${productId}` }} />
  }

  const ownsOrder =
    order && order.customer.email.toLowerCase() === session.email.toLowerCase()

  if (!order || !ownsOrder || !item) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <StoreHeader />
        <main className="grid flex-1 place-items-center px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="text-5xl" aria-hidden="true">
              🧸
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Producto no encontrado
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              El producto no pertenece a este pedido o el pedido ya no existe.
            </p>
            <Link
              to="/perfil"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              <ArrowLeftIcon />
              Volver a mis pedidos
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const delivered = order.status === 'entregado'

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      saveProductRating({ receiptId: order.id, productId, stars, comment })
      setSaved(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos guardar tu calificación.',
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav
            aria-label="Ruta de navegación"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm"
          >
            <Link to="/catalogo" className="font-semibold transition hover:text-violet-700">
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/perfil" className="font-semibold transition hover:text-violet-700">
              Mis Pedidos
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              Calificar producto
            </span>
          </nav>

          <Link
            to="/perfil"
            className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 transition hover:text-fuchsia-600"
          >
            <ArrowLeftIcon />
            Volver a mis pedidos
          </Link>

          <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500" />

            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-4">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-amber-50 text-4xl">
                    🧸
                  </span>
                )}

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Pedido {order.number} · {dateFormatter.format(new Date(order.issuedAt))}
                  </p>
                  <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    {item.name}
                  </h1>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircleIcon className="h-3 w-3" />
                    Compra verificada
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.brand ? `${item.brand} · ` : ''}
                    {item.quantity} × {priceFormatter.format(item.unitPrice)}
                  </p>
                </div>
              </div>

              {!delivered ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="flex items-center gap-2 text-sm font-black text-amber-800">
                    <LockIcon className="h-5 w-5" />
                    Aún no puedes calificar este producto
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-700">
                    El enlace se habilita automáticamente cuando el pedido cambia
                    a <strong>Entregado</strong>. Estado actual:{' '}
                    <strong>{order.statusMeta.label}</strong>.
                  </p>
                  <Link
                    to="/perfil"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white transition hover:bg-amber-600"
                  >
                    Ver seguimiento del pedido
                  </Link>
                </div>
              ) : saved ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircleIcon className="h-6 w-6" />
                  </span>
                  <h2 className="mt-3 text-lg font-black text-emerald-900">
                    {existingReview
                      ? '¡Actualizamos tu opinión!'
                      : '¡Gracias por tu calificación!'}
                  </h2>
                  <p className="mt-1 text-xs text-emerald-700">
                    Tu opinión ya está publicada en la ficha del juguete con tu
                    nombre y la fecha de hoy.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg
                        key={index}
                        viewBox="0 0 24 24"
                        fill={index < stars ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8L12 3.6Z" />
                      </svg>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                    <Link
                      to={`/producto/${productId}#resenas`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-violet-700 hover:to-fuchsia-600"
                    >
                      Ver mi opinión publicada
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate('/perfil')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Volver a mis pedidos
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6">
                  <fieldset>
                    <legend className="text-sm font-black text-slate-800">
                      {existingReview
                        ? 'Actualiza tu calificación'
                        : '¿Cómo calificas este juguete?'}
                    </legend>
                    <div className="mt-2 flex gap-1.5" role="group" aria-label="Calificación en estrellas">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <StarButton
                          key={value}
                          value={value}
                          selected={stars}
                          onSelect={setStars}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {stars === 0
                        ? 'Selecciona de 1 a 5 estrellas.'
                        : `${stars} de 5 estrellas`}
                    </p>
                  </fieldset>

                  <label className="mt-5 block">
                    <span className="text-sm font-black text-slate-800">
                      Comentario <span className="font-medium text-slate-400">(opcional)</span>
                    </span>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="Cuéntanos qué te pareció la calidad, el tamaño o la experiencia de juego."
                      className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                    <span className="mt-1 block text-right text-[10px] text-slate-400">
                      {comment.length}/500
                    </span>
                  </label>

                  {error && (
                    <p
                      role="alert"
                      className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 sm:w-auto"
                  >
                    {existingReview ? 'Actualizar opinión' : 'Publicar calificación'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Juguetes seguros para cada etapa
      </footer>
    </div>
  )
}
