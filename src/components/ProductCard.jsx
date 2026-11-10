import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/cartContext.js'
import { InsufficientStockError } from '../services/storeService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('es-CO')

/**
 * Colores por estado del producto. Se usa el texto del badge como clave para
 * que cualquier badge nuevo (por ejemplo desde el panel de administración)
 * tenga un color coherente sin tocar la tarjeta.
 */
const BADGE_STYLES = {
  'MÁS VENDEDOR': 'bg-amber-400 text-amber-950 ring-amber-300',
  'MÁS VENDIDO': 'bg-amber-400 text-amber-950 ring-amber-300',
  'TOP VENTAS': 'bg-violet-600 text-white ring-violet-400',
  OFERTA: 'bg-rose-600 text-white ring-rose-400',
  NUEVO: 'bg-emerald-600 text-white ring-emerald-400',
  'EDICIÓN NAVIDAD': 'bg-red-700 text-white ring-amber-300',
}

const DEFAULT_BADGE_STYLE = 'bg-slate-900 text-white ring-slate-700'

/** Un color distinto por categoría, legible sobre fondo claro. */
const CATEGORY_STYLES = {
  Legos: 'bg-violet-100 text-violet-700 ring-violet-200',
  'Juegos de Mesa': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Peluches: 'bg-amber-100 text-amber-800 ring-amber-200',
  'Vehículos': 'bg-sky-100 text-sky-700 ring-sky-200',
  'Bebés': 'bg-pink-100 text-pink-700 ring-pink-200',
  'Aire Libre': 'bg-teal-100 text-teal-700 ring-teal-200',
  'Científicos': 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  'Muñecos': 'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
  Navidad: 'bg-red-100 text-red-700 ring-red-200',
}

const DEFAULT_CATEGORY_STYLE = 'bg-slate-100 text-slate-600 ring-slate-200'

function StarIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-4 w-4 ${filled ? 'text-amber-400' : 'text-slate-200'}`}
      aria-hidden="true"
    >
      <path d="m12 2.5 2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.36 6.2 20.4l1.1-6.47L2.6 9.35l6.5-.95L12 2.5Z" />
    </svg>
  )
}

function CartPlusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M12 9v5" />
      <path d="M9.5 11.5h5" />
    </svg>
  )
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  )
}

function Stars({ rating, reviews }) {
  const roundedRating = Math.round(rating)

  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`${rating.toFixed(1)} de 5 estrellas, ${reviews} reseñas`}
    >
      <div className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= roundedRating} />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700" aria-hidden="true">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-slate-400" aria-hidden="true">
        ({numberFormatter.format(reviews)})
      </span>
    </div>
  )
}

/**
 * Tarjeta de producto del catálogo.
 *
 * - Usa `imageUrl` (con `image` como respaldo para datos antiguos).
 * - Efecto hover: zoom suave de la imagen y sombra elevada.
 * - Badges de estado y categoría con colores distintos.
 * - Botón "Agregar al carrito" con icono; el precio conserva su tamaño y
 *   nunca se comprime porque el botón no participa del ancho del precio.
 */
export default function ProductCard({ product, priority = false }) {
  const { addItem } = useCart()
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')
  const resetTimerRef = useRef(null)

  useEffect(
    () => () => {
      window.clearTimeout(resetTimerRef.current)
    },
    [],
  )

  const imageUrl = product.imageUrl ?? product.image
  const reviewsCount = product.reviewsCount ?? product.reviews ?? 0
  const ageRange = product.ageRange ?? product.age
  const stock = product.stock
  const soldOut = stock === 0
  const badge = String(product.badge ?? '').trim()
  const badgeStyle = BADGE_STYLES[badge.toUpperCase()] ?? DEFAULT_BADGE_STYLE
  const categoryStyle =
    CATEGORY_STYLES[product.category] ?? DEFAULT_CATEGORY_STYLE

  function scheduleReset(delay) {
    window.clearTimeout(resetTimerRef.current)
    resetTimerRef.current = window.setTimeout(() => {
      setStatus('idle')
      setFeedback('')
    }, delay)
  }

  async function handleAddToCart() {
    if (status === 'adding' || soldOut) return

    setStatus('adding')
    setFeedback('')

    try {
      await addItem(product.id, 1)
      setStatus('added')
      setFeedback('Agregado al carrito')
      scheduleReset(2000)
    } catch (error) {
      setStatus('error')
      setFeedback(
        error instanceof InsufficientStockError
          ? `Solo quedan ${error.availableStock} unidades.`
          : 'No se pudo agregar. Intenta de nuevo.',
      )
      scheduleReset(3500)
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[28px] border-[3px] border-[#ffe3c2] bg-white shadow-[0_14px_34px_-22px_rgba(120,70,30,0.45)] toy-card-lift focus-within:ring-4 focus-within:ring-toy-sun/50 hover:border-toy-sun/70 hover:shadow-[0_26px_50px_-24px_rgba(255,90,95,0.45)]">
      <Link
        to={`/producto/${product.id}`}
        aria-label={`Ver detalle de ${product.name}`}
        className="absolute inset-0 z-10 rounded-[28px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-toy-orange"
      />

      <div className="relative aspect-[4/3] overflow-hidden bg-toy-cream-deep">
        <img
          src={imageUrl}
          alt={`${product.name} de ${product.brand}`}
          width="800"
          height="600"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-110 group-hover:rotate-1"
        />

        {/* Degradado sutil para que los badges se lean sobre cualquier foto. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
        />

        {badge && (
          <span
            className={`absolute left-3 top-3 -rotate-3 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-md ring-2 ring-white/70 ${badgeStyle}`}
          >
            {badge}
          </span>
        )}

        {product.category === 'Navidad' && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 animate-twinkle select-none text-xl drop-shadow-sm"
          >
            ❄️
          </span>
        )}

        <span
          className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ring-2 ring-white/60 ${categoryStyle}`}
        >
          {product.category}
        </span>

        {stock !== undefined && stock !== null && stock > 0 && stock <= 5 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-rose-600 shadow-sm backdrop-blur">
            ¡Últimas {stock}!
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-slate-950/55 text-sm font-black uppercase tracking-wide text-white backdrop-blur-[1px]">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-extrabold uppercase tracking-wide text-toy-coral">
            {product.brand}
          </span>
          <span className="shrink-0 rounded-full bg-toy-cream-deep px-2 py-0.5 font-bold text-slate-600">
            {ageRange} años
          </span>
        </div>

        <h3 className="mt-2 font-display text-lg font-extrabold leading-snug text-toy-ink">
          {product.name}
        </h3>

        <div className="mt-2">
          <Stars rating={product.rating} reviews={reviewsCount} />
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-5 gap-y-3 pt-4">
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Precio
            </span>
            <p className="whitespace-nowrap font-display text-2xl font-extrabold tracking-tight text-toy-ink tabular-nums">
              {priceFormatter.format(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={status === 'adding' || soldOut}
            aria-label={`Agregar ${product.name} al carrito`}
            className="toy-btn relative z-20 ml-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toy-sun/60"
          >
            {status === 'added' ? (
              <>
                <CheckIcon />
                <span className="whitespace-nowrap">¡Listo!</span>
              </>
            ) : status === 'adding' ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeOpacity="0.3"
                    strokeWidth="3"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="whitespace-nowrap">Agregando…</span>
              </>
            ) : (
              <>
                <CartPlusIcon />
                <span className="whitespace-nowrap">Agregar</span>
              </>
            )}
          </button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={`mt-2 min-h-4 text-xs font-semibold ${
            status === 'error' ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {feedback}
        </p>
      </div>
    </article>
  )
}
