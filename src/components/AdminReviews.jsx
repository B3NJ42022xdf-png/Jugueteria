import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  displayAuthorName,
  formatReviewDate,
  listAllReviews,
  setReviewHidden,
} from '../services/reviewService.js'

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'published', label: 'Publicadas' },
  { value: 'hidden', label: 'Ocultas' },
]

function formatDateTime(value) {
  if (!value) return '—'
  try {
    return dateTimeFormatter.format(new Date(value))
  } catch {
    return '—'
  }
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function StarIcon({ filled = false, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8L12 3.6Z" />
    </svg>
  )
}

function Stars({ value }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500"
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= value} className="h-3.5 w-3.5" />
      ))}
    </span>
  )
}

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function EyeIcon({ off = false, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
      {off && <path d="m4 20 16-16" />}
    </svg>
  )
}

function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function AdminReviews() {
  const [reviews, setReviews] = useState(() => listAllReviews())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const counts = useMemo(
    () => ({
      all: reviews.length,
      published: reviews.filter((review) => !review.hidden).length,
      hidden: reviews.filter((review) => review.hidden).length,
    }),
    [reviews],
  )

  const average = useMemo(() => {
    const visible = reviews.filter((review) => !review.hidden)
    if (visible.length === 0) return 0
    return Math.round(
      (visible.reduce((sum, review) => sum + review.stars, 0) /
        visible.length) *
        10,
    ) / 10
  }, [reviews])

  const visibleReviews = useMemo(() => {
    const term = search.trim().toLowerCase()

    return reviews.filter((review) => {
      const matchesSearch =
        !term ||
        `${review.productName} ${review.customerName} ${review.comment} ${review.orderNumber}`
          .toLowerCase()
          .includes(term)
      const matchesFilter =
        filter === 'all' ||
        (filter === 'hidden' ? review.hidden : !review.hidden)

      return matchesSearch && matchesFilter
    })
  }, [reviews, search, filter])

  function toggleHidden(review) {
    setNotice('')
    setError('')

    try {
      const updated = setReviewHidden(review.id, !review.hidden)
      setReviews((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setNotice(
        updated.hidden
          ? `Ocultamos la opinión de ${displayAuthorName(
              updated.customerName,
            )} sobre "${updated.productName}". El promedio se recalculó.`
          : `Publicamos de nuevo la opinión de ${displayAuthorName(
              updated.customerName,
            )} sobre "${updated.productName}".`,
      )
    } catch (moderationError) {
      setError(
        moderationError instanceof Error
          ? moderationError.message
          : 'No pudimos moderar la opinión.',
      )
    }
  }

  return (
    <section aria-labelledby="opiniones-admin-title">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Opiniones
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{counts.all}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-500">
            Publicadas
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700">
            {counts.published}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-rose-500">
            Ocultas
          </p>
          <p className="mt-1 text-2xl font-black text-rose-700">{counts.hidden}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">
            Promedio visible
          </p>
          <p className="mt-1 text-2xl font-black text-amber-700">
            {average.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2
            id="opiniones-admin-title"
            className="text-xl font-black tracking-tight text-slate-900"
          >
            Moderación de opiniones
          </h2>
          <p className="text-xs text-slate-500">
            {visibleReviews.length} de {reviews.length} opiniones · ocultar una
            opinión la retira de la ficha y del promedio del juguete.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por juguete, cliente o texto"
              aria-label="Buscar opiniones"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:w-72"
            />
          </div>

          <div
            className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
            role="group"
            aria-label="Filtrar opiniones por visibilidad"
          >
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                  filter === option.value
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
        >
          {notice}
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="text-5xl" aria-hidden="true">
            ⭐
          </span>
          <h3 className="mt-4 text-lg font-black text-slate-900">
            Todavía no hay opiniones
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Cuando un cliente califique un juguete de un pedido entregado, la
            opinión aparecerá aquí para su moderación.
          </p>
        </div>
      ) : visibleReviews.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden="true">
            🔎
          </span>
          <h3 className="mt-3 text-base font-black text-slate-900">
            No encontramos opiniones
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Prueba con otro juguete, cliente o cambia el filtro.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visibleReviews.map((review) => (
            <li
              key={review.id}
              className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                review.hidden ? 'border-rose-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/producto/${review.productId}#resenas`}
                      className="font-black tracking-tight text-slate-900 underline-offset-2 transition hover:text-violet-700 hover:underline"
                    >
                      {review.productName || review.productId}
                    </Link>
                    {review.hidden ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-700 ring-1 ring-rose-200">
                        Oculta
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                        Publicada
                      </span>
                    )}
                  </div>

                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {displayAuthorName(review.customerName)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <Stars value={review.stars} />
                    <span className="font-bold text-slate-600">
                      {review.stars}/5
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Pedido {review.orderNumber || '—'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Publicada el {formatReviewDate(review.updatedAt)}
                    {review.moderatedAt &&
                      ` · Moderada el ${formatDateTime(review.moderatedAt)}`}
                  </p>

                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      review.hidden
                        ? 'text-slate-400 line-through decoration-rose-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {review.comment || (
                      <em className="text-slate-400">Sin comentario escrito.</em>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleHidden(review)}
                  className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-black transition ${
                    review.hidden
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <EyeIcon off={!review.hidden} className="h-3.5 w-3.5" />
                  {review.hidden ? 'Publicar de nuevo' : 'Ocultar opinión'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
        La moderación es lógica: la opinión no se borra, solo se oculta a los
        compradores. Mientras está oculta deja de contar para el promedio de
        estrellas del juguete. En producción esta acción debe quedar auditada y
        protegida por el rol de administrador en el servidor.
      </p>
    </section>
  )
}
