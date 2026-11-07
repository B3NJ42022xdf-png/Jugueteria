import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader.jsx'
import { useCart } from '../context/cartContext.js'
import { getProductDetail, getProductReviews } from '../data/productDetails.js'
import { getProductById } from '../services/productService.js'
import {
  InsufficientStockError,
  checkStock,
} from '../services/storeService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('es-CO')

function formatPrice(value) {
  return priceFormatter.format(value)
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function StarIcon({ filled, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${className} ${filled ? 'text-amber-400' : 'text-slate-200'}`}
      aria-hidden="true"
    >
      <path d="m12 2.5 2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.36 6.2 20.4l1.1-6.47L2.6 9.35l6.5-.95L12 2.5Z" />
    </svg>
  )
}

function ZoomInIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  )
}

function ZoomOutIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8 11h6" />
    </svg>
  )
}

function CartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function ArrowLeftIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function AlertTriangleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.3 3.6 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  )
}

function MinusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function TruckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 6h11v11H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="18" cy="19" r="1.5" />
    </svg>
  )
}

function ShieldIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function RefreshIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

function Stars({ rating, reviews, size = 'sm' }) {
  const rounded = Math.round(rating)
  const starClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const description = reviews == null
    ? `${rating.toFixed(1)} de 5 estrellas`
    : `${rating.toFixed(1)} de 5 estrellas, ${reviews} valoraciones`

  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={description}>
      <div className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= rounded} className={starClass} />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700" aria-hidden="true">
        {rating.toFixed(1)}
      </span>
      {reviews != null && (
        <span className="text-xs text-slate-400" aria-hidden="true">
          ({numberFormatter.format(reviews)})
        </span>
      )}
    </div>
  )
}

function getStockStatus(stock) {
  if (stock === null) {
    return {
      label: 'Verificando stock…',
      detail: 'Consultando disponibilidad',
      badge: 'border-slate-200 bg-slate-50 text-slate-500',
      dot: 'bg-slate-400 animate-pulse',
    }
  }

  if (stock === 0) {
    return {
      label: 'Agotado',
      detail: 'Sin unidades disponibles por ahora',
      badge: 'border-rose-200 bg-rose-50 text-rose-700',
      dot: 'bg-rose-500',
    }
  }

  if (stock <= 5) {
    return {
      label: 'Últimas unidades disponibles',
      detail: `Solo quedan ${stock} ${stock === 1 ? 'unidad' : 'unidades'}`,
      badge: 'border-amber-200 bg-amber-50 text-amber-800',
      dot: 'bg-amber-500 animate-pulse',
    }
  }

  return {
    label: 'En stock',
    detail: `${stock} unidades disponibles`,
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  }
}

function useStock(productId) {
  const [stock, setStock] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!productId) return undefined

    let cancelled = false

    async function refresh() {
      try {
        const result = await checkStock(productId)
        if (cancelled) return

        setStock(result.stock)
        setUpdatedAt(result.updatedAt)
        setError(false)
      } catch {
        if (!cancelled) setError(true)
      }
    }

    refresh()
    const interval = setInterval(refresh, 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [productId])

  return { stock, updatedAt, error, setStock }
}

/* ------------------------------------------------------------------ */
/* Página de detalle                                                   */
/* ------------------------------------------------------------------ */

function ProductoDetalleContent({ id }) {
  const product = useMemo(() => getProductById(id), [id])
  const detail = useMemo(() => (product ? getProductDetail(product) : null), [product])
  const reviews = useMemo(() => (product ? getProductReviews(product) : null), [product])

  const { stock, updatedAt, error: stockError, setStock } = useStock(product?.id)
  const { addItem } = useCart()

  const [activeImage, setActiveImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const status = getStockStatus(stock)
  const canBuy = stock !== null && stock > 0
  const maxQuantity = Math.max(1, stock ?? 1)
  const selectedQuantity = Math.min(quantity, maxQuantity)
  const lastUpdate = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null

  function handleZoomMove(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setZoomOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`)
  }

  function handleQuantityChange(event) {
    const value = Number(event.target.value)

    if (!Number.isFinite(value)) {
      setQuantity(1)
      return
    }

    const max = Math.max(1, stock ?? 1)
    setQuantity(Math.min(Math.max(1, Math.floor(value)), max))
  }

  async function handleAddToCart() {
    if (!product || !canBuy || adding) return

    setAdding(true)
    setFeedback(null)

    try {
      const result = await addItem(product.id, selectedQuantity)

      setStock(result.remainingStock)
      setFeedback({
        type: 'success',
        text: `Agregamos ${selectedQuantity} ${selectedQuantity === 1 ? 'unidad' : 'unidades'} de ${product.name} al carrito.`,
      })
      setQuantity(1)
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        setStock(error.availableStock)
        setFeedback({
          type: 'error',
          text:
            error.availableStock === 0
              ? 'Este producto se quedó sin stock.'
              : `Solo quedan ${error.availableStock} unidades disponibles.`,
        })
      } else {
        setFeedback({
          type: 'error',
          text: 'No pudimos agregar el producto. Intenta de nuevo.',
        })
      }
    } finally {
      setAdding(false)
    }
  }

  if (!product || !detail || !reviews) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <StoreHeader />
        <main className="grid flex-1 place-items-center px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="text-5xl" aria-hidden="true">
              🧩
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Producto no encontrado
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Es posible que el juguete ya no esté disponible o que el enlace sea incorrecto.
            </p>
            <Link
              to="/catalogo"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Ir al catálogo
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav aria-label="Ruta de navegación" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
            <Link to="/catalogo" className="font-semibold transition hover:text-violet-700">
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <span>{product.category}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              {product.name}
            </span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            {/* Galería */}
            <section aria-label="Galería de imágenes del producto" className="lg:sticky lg:top-24">
              <div
                className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleZoomMove}
                onClick={() => setIsZoomed(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setIsZoomed(true)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Acercar imagen de ${product.name}`}
              >
                <img
                  src={detail.gallery[activeImage]}
                  alt={`${product.name} de ${product.brand}, vista ${activeImage + 1}`}
                  width="400"
                  height="400"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-200"
                  style={{
                    transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                    transformOrigin: zoomOrigin,
                  }}
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/45 to-transparent px-4 pb-3 pt-10 text-white">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
                    <ZoomInIcon className="h-3.5 w-3.5" />
                    {isZoomed ? 'Zoom activo · mueve el cursor' : 'Pasa el cursor para hacer zoom'}
                  </span>
                  <span className="text-[11px] font-bold">
                    {activeImage + 1} / {detail.gallery.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setIsZoomed((zoomed) => !zoomed)
                  }}
                  aria-label={isZoomed ? 'Reducir imagen' : 'Acercar imagen'}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                >
                  {isZoomed ? <ZoomOutIcon className="h-4 w-4" /> : <ZoomInIcon className="h-4 w-4" />}
                  {isZoomed ? 'Reducir' : 'Acercar'}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {detail.gallery.map((image, index) => (
                  <button
                    key={`${product.id}-image-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveImage(index)
                      setIsZoomed(false)
                    }}
                    aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                    aria-pressed={activeImage === index}
                    className={`overflow-hidden rounded-2xl border-2 bg-white transition ${
                      activeImage === index
                        ? 'border-violet-600 ring-4 ring-violet-100'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt=""
                      width="400"
                      height="300"
                      decoding="async"
                      className="aspect-[4/3] h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>

            {/* Panel de compra */}
            <section aria-labelledby="product-title">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700">
                  {product.category}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                  {product.brand}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
                  {product.age} años
                </span>
              </div>

              <h1
                id="product-title"
                className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl"
              >
                {product.name}
              </h1>

              <a href="#resenas" className="mt-3 inline-flex transition hover:opacity-80">
                <Stars rating={product.rating} reviews={product.reviews} size="lg" />
              </a>

              <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                <p className="text-4xl font-black tracking-tight text-slate-900">
                  {formatPrice(product.price)}
                </p>
                <p className="pb-1 text-xs text-slate-500">IVA incluido</p>
              </div>

              <div className={`mt-4 rounded-2xl border p-4 ${status.badge}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-black">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dot}`} />
                      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status.dot}`} />
                    </span>
                    {status.label}
                  </span>
                  <span className="text-xs font-semibold opacity-80">{status.detail}</span>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium opacity-70">
                  <RefreshIcon className="h-3.5 w-3.5" />
                  {stockError
                    ? 'No se pudo actualizar el stock. Reintentando…'
                    : lastUpdate
                      ? `Actualizado en tiempo real a las ${lastUpdate}`
                      : 'Consultando disponibilidad…'}
                </p>
              </div>

              <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                {detail.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-700">Unidades</span>

                  <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) =>
                          Math.max(1, Math.min(current, maxQuantity) - 1),
                        )
                      }
                      disabled={!canBuy || selectedQuantity <= 1}
                      aria-label="Disminuir cantidad"
                      className="grid h-10 w-10 place-items-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <MinusIcon />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max={maxQuantity}
                      value={selectedQuantity}
                      onChange={handleQuantityChange}
                      disabled={!canBuy}
                      aria-label="Cantidad de unidades"
                      className="h-10 w-14 border-x border-slate-200 text-center text-sm font-black text-slate-900 outline-none focus:bg-violet-50 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) =>
                          Math.min(maxQuantity, Math.max(1, current) + 1),
                        )
                      }
                      disabled={!canBuy || selectedQuantity >= (stock ?? 0)}
                      aria-label="Aumentar cantidad"
                      className="grid h-10 w-10 place-items-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">
                    Subtotal ({selectedQuantity} {selectedQuantity === 1 ? 'unidad' : 'unidades'})
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {formatPrice(product.price * selectedQuantity)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canBuy || adding}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  <CartIcon className="h-5 w-5" />
                  {adding ? 'Agregando…' : 'Agregar al carrito'}
                </button>

                {feedback && (
                  <div
                    role="status"
                    className={`mt-3 rounded-xl border p-3 text-sm font-semibold ${
                      feedback.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
                  <TruckIcon className="h-5 w-5 shrink-0 text-violet-600" />
                  Envío gratis desde {formatPrice(150000)}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
                  <RefreshIcon className="h-5 w-5 shrink-0 text-violet-600" />
                  Devolución en 30 días
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
                  <ShieldIcon className="h-5 w-5 shrink-0 text-violet-600" />
                  Pago 100 % seguro
                </div>
              </div>
            </section>
          </div>

          {/* Descripción, especificaciones y materiales */}
          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Descripción del producto
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {detail.description}
                </p>

                <h3 className="mt-6 text-sm font-black uppercase tracking-wide text-slate-500">
                  Lo que hace especial a este juguete
                </h3>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {detail.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-600">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Especificaciones técnicas
                </h2>
                <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {detail.specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3"
                    >
                      <dt className="text-sm text-slate-500">{spec.label}</dt>
                      <dd className="text-right text-sm font-bold text-slate-800">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Materiales de fabricación
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {detail.materials}
                </p>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-black text-amber-900">
                  <AlertTriangleIcon className="h-5 w-5 shrink-0" />
                  Advertencias de seguridad
                </h2>
                <ul className="mt-4 space-y-3">
                  {detail.safety.map((warning) => (
                    <li key={warning} className="flex items-start gap-2 text-sm leading-relaxed text-amber-900/80">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-black text-slate-900">Edad recomendada</h2>
                <p className="mt-2 text-3xl font-black text-violet-600">
                  {product.age.replace('-', ' a ')} años
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  La edad sugerida es una guía. Valora siempre las habilidades e intereses del
                  niño y la supervisión necesaria.
                </p>
              </section>
            </aside>
          </div>

          {/* Reseñas */}
          <section
            id="resenas"
            aria-labelledby="resenas-title"
            className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="resenas-title" className="text-xl font-black tracking-tight text-slate-900">
                  Comentarios y puntuaciones
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Opiniones agregadas de clientes que ya compraron este juguete.
                  {reviews.realCount > 0 && (
                    <span className="font-semibold text-emerald-700">
                      {' '}
                      {reviews.realCount}{' '}
                      {reviews.realCount === 1
                        ? 'opinión verificada reciente'
                        : 'opiniones verificadas recientes'}
                      .
                    </span>
                  )}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {numberFormatter.format(reviews.total)} valoraciones
              </span>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="flex items-end gap-3">
                  <p className="text-5xl font-black tracking-tight text-slate-900">
                    {reviews.average.toFixed(1)}
                  </p>
                  <div className="pb-1">
                    <Stars rating={reviews.average} size="lg" />
                    <p className="mt-1 text-xs text-slate-500">
                      {numberFormatter.format(reviews.total)} valoraciones
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {reviews.breakdown.map((row) => (
                    <div key={row.stars} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-right font-bold text-slate-600">{row.stars}</span>
                      <StarIcon filled className="h-3.5 w-3.5" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-amber-400"
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-semibold tabular-nums text-slate-500">
                        {row.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {reviews.items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                    <span className="text-4xl" aria-hidden="true">
                      ⭐
                    </span>
                    <p className="mt-3 text-sm font-bold text-slate-700">
                      Este juguete aún no tiene opiniones publicadas.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Las opiniones aparecen aquí cuando un cliente recibe su
                      pedido y lo califica.
                    </p>
                  </div>
                )}

                {reviews.items.map((review) => (
                  <article key={review.id} className="border-b border-slate-100 py-5 first:pt-0 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black ${review.color}`}
                          aria-hidden="true"
                        >
                          {review.author
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                        <div>
                          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                            {review.author}
                            {review.verified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckIcon className="h-3 w-3" />
                                Compra verificada
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{review.date}</p>
                        </div>
                      </div>
                      <Stars rating={review.rating} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                  </article>
                ))}

                {reviews.items.length > 0 && (
                  <p className="mt-4 text-xs text-slate-400">
                    Mostrando {reviews.items.length} de{' '}
                    {numberFormatter.format(reviews.total)} comentarios.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-4 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Juguetes seguros para cada etapa
      </footer>
    </div>
  )
}

function ProductoDetalle() {
  const { id } = useParams()

  return <ProductoDetalleContent key={id} id={id} />
}

export default ProductoDetalle
