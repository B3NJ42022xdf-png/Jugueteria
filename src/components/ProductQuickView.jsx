import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/cartContext.js'
import { useFavorites } from '../context/favoritesContext.js'
import { getProductDetail, getProductReviews } from '../data/productDetails.js'
import { FREE_SHIPPING_FROM } from '../lib/cartTotals.js'
import { showToast, TOAST_KINDS } from '../lib/toast.js'
import { getSession, getSessionDisplayName } from '../services/authService.js'
import { getProductById } from '../services/productService.js'
import { savePublicReview } from '../services/reviewService.js'
import { InsufficientStockError } from '../services/storeService.js'
import ModalShell from './ModalShell.jsx'
import {
  Check,
  Heart,
  HeartFilled,
  Shield,
  Star,
  Truck,
} from './icons.jsx'

const priceFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('es-PE')

function formatPrice(value) {
  return priceFormatter.format(value)
}

function RatingStar({ filled, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className={`${className} ${filled ? 'text-amber-400' : 'text-slate-300'}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d="m12 3 2.7 5.8 6.3.8-4.6 4.4 1.2 6.2L12 17.4 6.4 20.2l1.2-6.2L3 9.6l6.3-.8L12 3Z" />
    </svg>
  )
}

function StarRow({ rating, className = 'h-4 w-4', wrapperClass = '' }) {
  return (
    <span className={`flex items-center gap-0.5 ${wrapperClass}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <RatingStar
          key={star}
          filled={star <= Math.round(rating)}
          className={className}
        />
      ))}
    </span>
  )
}

function initials(value) {
  return String(value ?? 'Cliente')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Vista rápida de un juguete dentro de un modal.
 *
 * Se abre al tocar la imagen o el título de cualquier tarjeta del catálogo.
 * Reúne descripción completa, edad recomendada, stock real, selector de
 * cantidad y una pestaña de opiniones donde el cliente puede calificar de 1 a
 * 5 estrellas y publicar un comentario que aparece de inmediato en la lista.
 *
 * La ficha completa sigue disponible en `/producto/:id`.
 */
export default function ProductQuickView({ product, onClose }) {
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const detail = useMemo(() => getProductDetail(product), [product])

  const [tab, setTab] = useState('detalle')
  const [stock, setStock] = useState(() =>
    Math.max(0, Number(product.stock) || 0),
  )
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [reviews, setReviews] = useState(() => getProductReviews(product))
  const [reviewForm, setReviewForm] = useState({ stars: 5, comment: '' })
  const [reviewError, setReviewError] = useState('')
  const [reviewDone, setReviewDone] = useState(false)

  const favorite = isFavorite(product.id)
  const imageUrl = product.imageUrl ?? product.image
  const ageRange = product.ageRange ?? product.age
  const soldOut = stock <= 0
  const maxQuantity = Math.max(1, stock)
  const selectedQuantity = Math.min(quantity, maxQuantity)
  const oldPrice = Number(product.oldPrice) || 0
  const discount = Number(product.discount) || 0
  const hasOffer = discount > 0 && oldPrice > product.price
  const authorName = useMemo(
    () => getSessionDisplayName(getSession()) || 'Cliente navideño',
    [],
  )

  function changeQuantity(delta) {
    setQuantity((current) =>
      Math.min(maxQuantity, Math.max(1, current + delta)),
    )
  }

  function handleToggleFavorite() {
    const added = toggleFavorite(product.id)

    showToast({
      kind: added ? TOAST_KINDS.FAVORITE : TOAST_KINDS.FAVORITE_REMOVED,
      title: product.name,
      message: added
        ? 'Lo guardamos en tu lista de deseos.'
        : 'Lo quitamos de tu lista de deseos.',
      image: imageUrl,
      href: '/favoritos',
      actionLabel: 'Ver favoritos →',
    })
  }

  async function handleAddToCart() {
    if (adding || soldOut) return

    setAdding(true)
    setFeedback(null)

    try {
      const result = await addItem(product.id, selectedQuantity)

      setStock(result.remainingStock)
      setQuantity(1)
      setFeedback({
        type: 'success',
        text: `Agregamos ${selectedQuantity} ${
          selectedQuantity === 1 ? 'unidad' : 'unidades'
        } al carrito.`,
      })

      showToast({
        kind: TOAST_KINDS.CART,
        title: product.name,
        message: 'Ya está en tu carrito.',
        image: imageUrl,
        href: '/carrito',
        actionLabel: 'Ver carrito →',
      })
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        setStock(error.availableStock)
        setFeedback({
          type: 'error',
          text:
            error.availableStock === 0
              ? 'Este juguete se quedó sin stock.'
              : `Solo quedan ${error.availableStock} unidades disponibles.`,
        })
      } else {
        setFeedback({
          type: 'error',
          text: 'No pudimos agregar el juguete. Inténtalo de nuevo.',
        })
      }
    } finally {
      setAdding(false)
    }
  }

  function handleReviewSubmit(event) {
    event.preventDefault()
    setReviewError('')
    setReviewDone(false)

    try {
      savePublicReview({
        productId: product.id,
        productName: product.name,
        customerName: authorName,
        stars: reviewForm.stars,
        comment: reviewForm.comment,
      })

      const latest = getProductById(product.id) ?? product
      setReviews(getProductReviews(latest))
      setReviewForm({ stars: 5, comment: '' })
      setReviewDone(true)

      showToast({
        kind: TOAST_KINDS.SUCCESS,
        title: '¡Gracias por tu opinión!',
        message: 'Tu reseña ya aparece en la ficha del producto.',
        image: imageUrl,
        href: '/favoritos',
        actionLabel: 'Ver favoritos →',
      })
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : 'No pudimos publicar tu opinión. Inténtalo de nuevo.',
      )
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="quickview-titulo"
      describedBy="quickview-descripcion"
      closeLabel="Cerrar detalle del producto"
      maxWidth="max-w-4xl"
    >
      <div className="pr-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-900">
            {product.category}
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-toy-coral">
            {product.brand}
          </span>
          {hasOffer && (
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              -{discount}%
            </span>
          )}
        </div>

        <h2
          id="quickview-titulo"
          className="mt-2 font-display text-2xl font-extrabold leading-tight text-toy-ink sm:text-3xl"
        >
          {product.name}
        </h2>
        <p
          id="quickview-descripcion"
          className="mt-1 text-xs font-semibold text-slate-500"
        >
          {product.brand} · Edad recomendada {ageRange} años · Ref.{' '}
          {product.id.toUpperCase()}
        </p>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <div className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-sm">
            <img
              src={imageUrl}
              alt={`${product.name}, juguete de ${product.brand} para ${ageRange} años`}
              width="800"
              height="800"
              loading="eager"
              decoding="async"
              className="aspect-square w-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-pressed={favorite}
            className={`mt-2 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 ${
              favorite
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-amber-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-rose-700'
            }`}
          >
            {favorite ? (
              <HeartFilled className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {favorite ? 'En tu lista de deseos' : 'Guardar en favoritos'}
          </button>
        </div>

        <div>
          <div className="flex flex-wrap items-end gap-2">
            <p className="font-display text-3xl font-extrabold tracking-tight text-toy-ink tabular-nums">
              {formatPrice(product.price)}
            </p>
            {hasOffer && (
              <span className="pb-1 text-sm font-bold text-slate-400 line-through tabular-nums">
                {formatPrice(oldPrice)}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StarRow rating={reviews.average} />
            <span className="text-sm font-black text-slate-700">
              {reviews.average.toFixed(1)}
            </span>
            <button
              type="button"
              onClick={() => setTab('opiniones')}
              className="cursor-pointer text-xs font-bold text-red-700 underline underline-offset-2 transition hover:text-red-800"
            >
              {numberFormatter.format(reviews.total)} opiniones
            </button>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
              <dt className="font-black uppercase tracking-wide text-slate-400">
                Edad recomendada
              </dt>
              <dd className="mt-0.5 font-extrabold text-toy-ink">
                {ageRange} años
              </dd>
            </div>
            <div className="rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
              <dt className="font-black uppercase tracking-wide text-slate-400">
                Stock disponible
              </dt>
              <dd
                className={`mt-0.5 font-extrabold ${
                  soldOut ? 'text-rose-600' : 'text-emerald-700'
                }`}
                aria-live="polite"
              >
                {soldOut
                  ? 'Agotado'
                  : `${numberFormatter.format(stock)} ${
                      stock === 1 ? 'unidad disponible' : 'unidades disponibles'
                    }`}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {detail.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center overflow-hidden rounded-xl border-2 border-amber-200 bg-white">
              <button
                type="button"
                onClick={() => changeQuantity(-1)}
                disabled={soldOut || selectedQuantity <= 1}
                aria-label="Quitar una unidad"
                className="grid h-11 w-10 cursor-pointer place-items-center text-lg font-black text-red-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                −
              </button>
              <span
                aria-live="polite"
                className="w-10 text-center text-sm font-black tabular-nums text-toy-ink"
              >
                {selectedQuantity}
              </span>
              <button
                type="button"
                onClick={() => changeQuantity(1)}
                disabled={soldOut || selectedQuantity >= maxQuantity}
                aria-label="Agregar una unidad"
                className="grid h-11 w-10 cursor-pointer place-items-center text-lg font-black text-red-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || soldOut}
              className="toy-btn inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toy-sun/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {soldOut
                ? 'Agotado'
                : adding
                  ? 'Agregando…'
                  : 'Agregar al carrito'}
            </button>
          </div>

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 text-xs font-bold ${
                feedback.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {feedback.text}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-emerald-600" /> Envío gratis
              desde {formatPrice(FREE_SHIPPING_FROM)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-emerald-600" /> Compra
              protegida
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-b-2 border-amber-100">
        <div
          role="tablist"
          aria-label="Información del producto"
          className="flex flex-wrap gap-1"
        >
          <button
            type="button"
            role="tab"
            id="quickview-tab-detalle"
            aria-selected={tab === 'detalle'}
            aria-controls="quickview-panel-detalle"
            onClick={() => setTab('detalle')}
            className={`cursor-pointer rounded-t-xl px-3 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              tab === 'detalle'
                ? 'bg-amber-100 text-red-800'
                : 'text-slate-500 hover:bg-amber-50 hover:text-red-700'
            }`}
          >
            Detalle completo
          </button>
          <button
            type="button"
            role="tab"
            id="quickview-tab-opiniones"
            aria-selected={tab === 'opiniones'}
            aria-controls="quickview-panel-opiniones"
            onClick={() => setTab('opiniones')}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-t-xl px-3 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              tab === 'opiniones'
                ? 'bg-amber-100 text-red-800'
                : 'text-slate-500 hover:bg-amber-50 hover:text-red-700'
            }`}
          >
            <Star className="h-3.5 w-3.5" /> Opiniones de clientes (
            {numberFormatter.format(reviews.total)})
          </button>
        </div>
      </div>

      {tab === 'detalle' ? (
        <div
          role="tabpanel"
          id="quickview-panel-detalle"
          aria-labelledby="quickview-tab-detalle"
          className="pt-4"
        >
          <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-red-800">
            Descripción completa
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {detail.description}
          </p>

          <h3 className="mt-4 font-display text-sm font-extrabold uppercase tracking-wide text-red-800">
            Lo que hace especial a este juguete
          </h3>
          <ul className="mt-1.5 space-y-1.5">
            {detail.highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-2 rounded-xl bg-amber-50/70 px-3 py-2 text-xs font-semibold leading-relaxed text-slate-600 ring-1 ring-amber-100"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {detail.specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs ring-1 ring-amber-100"
              >
                <dt className="font-semibold text-slate-500">{spec.label}</dt>
                <dd className="text-right font-extrabold text-slate-700">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
            <Shield className="mr-1 inline h-3.5 w-3.5" />
            {detail.materials}
          </p>

          <Link
            to={`/producto/${product.id}`}
            onClick={onClose}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-amber-300 bg-white px-4 py-2 text-xs font-extrabold text-red-800 transition hover:-translate-y-0.5 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
          >
            Ver ficha completa del producto →
          </Link>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="quickview-panel-opiniones"
          aria-labelledby="quickview-tab-opiniones"
          className="pt-4"
        >
          <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-100">
              <p className="font-display text-4xl font-extrabold leading-none text-toy-ink">
                {reviews.average.toFixed(1)}
              </p>
              <StarRow
                rating={reviews.average}
                wrapperClass="mt-1 justify-center"
              />
              <p className="mt-1 text-[11px] font-bold text-slate-500">
                {numberFormatter.format(reviews.total)} valoraciones
              </p>
            </div>

            <div className="space-y-1.5">
              {reviews.breakdown.map((row) => (
                <div
                  key={row.stars}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span className="w-3 text-right font-bold text-slate-600">
                    {row.stars}
                  </span>
                  <Star className="h-3 w-3 text-amber-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold tabular-nums text-slate-500">
                    {row.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleReviewSubmit}
            className="mt-4 rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-4"
          >
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wide text-red-800">
              Deja tu opinión
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              Se publicará como <strong>{authorName}</strong> y aparecerá al
              instante en esta lista.
            </p>

            <div
              role="group"
              aria-label="Calificación de 1 a 5 estrellas"
              className="mt-2 flex flex-wrap items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setReviewForm((current) => ({ ...current, stars: star }))
                  }
                  aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
                  aria-pressed={reviewForm.stars === star}
                  className="cursor-pointer rounded-md p-0.5 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <RatingStar
                    filled={star <= reviewForm.stars}
                    className="h-7 w-7"
                  />
                </button>
              ))}
              <span className="ml-1 text-xs font-extrabold text-slate-600">
                {reviewForm.stars} de 5
              </span>
            </div>

            <label
              htmlFor="quickview-opinion"
              className="mt-2 block text-[10px] font-black uppercase tracking-wide text-slate-500"
            >
              Comentario
            </label>
            <textarea
              id="quickview-opinion"
              value={reviewForm.comment}
              onChange={(event) => {
                setReviewForm((current) => ({
                  ...current,
                  comment: event.target.value,
                }))
                setReviewError('')
                setReviewDone(false)
              }}
              rows={3}
              maxLength={500}
              placeholder="Cuéntanos cómo fue tu experiencia con este juguete…"
              className="toy-input mt-1 w-full resize-y rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-400"
            />

            {reviewError && (
              <p
                role="alert"
                className="mt-1.5 animate-shake rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200"
              >
                {reviewError}
              </p>
            )}

            {reviewDone && (
              <p
                role="status"
                aria-live="polite"
                className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                <Check className="h-3.5 w-3.5" /> ¡Tu opinión ya está
                publicada!
              </p>
            )}

            <button
              type="submit"
              className="christmas-btn mt-2 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-xs font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              Publicar opinión
            </button>
          </form>

          <h3 className="mt-4 font-display text-sm font-extrabold uppercase tracking-wide text-red-800">
            Opiniones de clientes
          </h3>

          {reviews.items.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-6 text-center text-xs font-semibold text-slate-500">
              Este juguete aún no tiene opiniones. ¡Sé el primero en
              recomendarlo!
            </p>
          ) : (
            <ul className="mt-1 divide-y divide-amber-100">
              {reviews.items.slice(0, 8).map((review) => (
                <li key={review.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-black ${review.color}`}
                        aria-hidden="true"
                      >
                        {initials(review.author)}
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">
                          {review.author}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {review.date}
                        </p>
                      </div>
                    </div>
                    <StarRow rating={review.rating} className="h-3.5 w-3.5" />
                  </div>

                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {review.comment}
                  </p>

                  <span
                    className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ring-1 ${
                      review.verified
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-sky-50 text-sky-700 ring-sky-200'
                    }`}
                  >
                    {review.verified
                      ? 'Compra verificada'
                      : 'Opinión de la comunidad'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ModalShell>
  )
}
