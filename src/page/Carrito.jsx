import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader.jsx'
import { useCart } from '../context/cartContext.js'
import { getSession } from '../services/authService.js'
import { issueReceipt } from '../services/receiptService.js'
import {
  InsufficientStockError,
  validateCartStock,
} from '../services/storeService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const FREE_SHIPPING_FROM = 150000
const SHIPPING_COST = 12900

function formatPrice(value) {
  return priceFormatter.format(value)
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function CartIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
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

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

function AlertIcon({ className = 'h-5 w-5' }) {
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

function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function TruckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 6h11v11H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="18" cy="19" r="1.5" />
    </svg>
  )
}

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

function ArrowRightIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

function StockNotice({ info, quantity }) {
  if (!info) {
    return (
      <p className="mt-2 text-xs font-medium text-slate-400" aria-live="polite">
        Verificando stock…
      </p>
    )
  }

  if (info.insufficient) {
    return (
      <p
        role="alert"
        className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"
      >
        <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Solo quedan {info.stock} {info.stock === 1 ? 'unidad' : 'unidades'} y tienes {quantity} en
          el carrito. Ajusta la cantidad para continuar.
        </span>
      </p>
    )
  }

  if (info.changed) {
    return (
      <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
        <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          El stock cambió: quedan {info.stock} {info.stock === 1 ? 'unidad' : 'unidades'} (antes
          había {info.stockAtAdd}). Revisa tu compra antes de pagar.
        </span>
      </p>
    )
  }

  return (
    <p className="mt-2 text-xs font-medium text-slate-400">
      Stock disponible: {info.stock} {info.stock === 1 ? 'unidad' : 'unidades'}
    </p>
  )
}

function QuantityControl({ item, info, pending, onDecrease, onIncrease }) {
  const reachedStock = info ? item.quantity >= info.stock : false

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onDecrease}
        disabled={pending || item.quantity <= 1}
        aria-label={`Disminuir cantidad de ${item.product.name}`}
        className="grid h-9 w-9 place-items-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MinusIcon />
      </button>
      <span
        className="grid h-9 min-w-10 place-items-center border-x border-slate-200 px-2 text-sm font-black tabular-nums text-slate-900"
        aria-label={`${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'}`}
      >
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={pending || reachedStock}
        aria-label={`Aumentar cantidad de ${item.product.name}`}
        className="grid h-9 w-9 place-items-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PlusIcon />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Página del carrito                                                  */
/* ------------------------------------------------------------------ */

export default function Carrito() {
  const {
    items,
    itemCount,
    subtotal,
    changeQuantity,
    removeItem,
    completePurchase,
  } = useCart()
  const navigate = useNavigate()

  const [stockInfo, setStockInfo] = useState({})
  const [stockVersion, setStockVersion] = useState(0)
  const [pendingId, setPendingId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [checkout, setCheckout] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [receiptType, setReceiptType] = useState('boleta')
  const [customerName, setCustomerName] = useState('Cliente de demostración')
  const [customerEmail, setCustomerEmail] = useState(
    () => getSession()?.email ?? 'cliente@ejemplo.com',
  )
  const [customerTaxId, setCustomerTaxId] = useState('')

  const snapshot = useMemo(
    () =>
      Object.fromEntries(
        items.map((item) => [
          item.id,
          { quantity: item.quantity, stockAtAdd: item.stockAtAdd },
        ]),
      ),
    [items],
  )

  // Valida el stock al entrar, cada 15 s y cuando otra pestaña cambia el stock.
  useEffect(() => {
    const productIds = Object.keys(snapshot)

    if (productIds.length === 0) return undefined

    let cancelled = false

    async function refreshStock() {
      const results = await validateCartStock(snapshot)

      if (cancelled) return

      setStockInfo(
        Object.fromEntries(results.map((result) => [result.productId, result])),
      )
    }

    refreshStock()
    const interval = setInterval(refreshStock, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [snapshot, stockVersion])

  useEffect(() => {
    function handleStockChange(event) {
      if (event.key === 'jugueteria.stock.v1') {
        setStockVersion((version) => version + 1)
      }
    }

    window.addEventListener('storage', handleStockChange)
    return () => window.removeEventListener('storage', handleStockChange)
  }, [])

  const stockAlerts = items
    .map((item) => ({ item, info: stockInfo[item.id] }))
    .filter(({ info }) => info && (info.changed || info.insufficient))

  const shipping =
    items.length === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  async function handleQuantity(item, quantity) {
    if (quantity < 1 || quantity === item.quantity || pendingId === item.id) return

    setPendingId(item.id)
    setActionError(null)
    setCheckout(null)

    try {
      await changeQuantity(item.id, quantity)
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        setStockInfo((previous) => ({
          ...previous,
          [item.id]: {
            productId: item.id,
            quantity: item.quantity,
            stock: error.availableStock,
            stockAtAdd: item.stockAtAdd,
            changed:
              item.stockAtAdd != null && error.availableStock < item.stockAtAdd,
            insufficient: item.quantity > error.availableStock,
            updatedAt: new Date().toISOString(),
          },
        }))
        setActionError(
          error.availableStock === 0
            ? `${item.product.name} se quedó sin stock. Elimínalo para continuar.`
            : `Solo quedan ${error.availableStock} ${
                error.availableStock === 1 ? 'unidad' : 'unidades'
              } de ${item.product.name}.`,
        )
      } else {
        setActionError('No pudimos actualizar la cantidad. Intenta de nuevo.')
      }
    } finally {
      setPendingId(null)
    }
  }

  async function handleRemove(item) {
    if (pendingId === item.id) return

    setPendingId(item.id)
    setActionError(null)
    setCheckout(null)

    try {
      await removeItem(item.id)
    } catch {
      setActionError('No pudimos eliminar el producto. Intenta de nuevo.')
    } finally {
      setPendingId(null)
    }
  }

  async function handleRefreshStock() {
    if (items.length === 0 || refreshing) return

    setRefreshing(true)
    setActionError(null)

    try {
      const results = await validateCartStock(snapshot)
      setStockInfo(
        Object.fromEntries(results.map((result) => [result.productId, result])),
      )
    } catch {
      setActionError('No pudimos actualizar el stock. Intenta de nuevo.')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleCheckout() {
    if (items.length === 0 || checkingOut) return

    const email = customerEmail.trim()
    const taxId = customerTaxId.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCheckout({
        type: 'error',
        text: 'Ingresa un correo válido para enviarte el comprobante.',
      })
      return
    }

    if (receiptType === 'factura' && !taxId) {
      setCheckout({
        type: 'error',
        text: 'Ingresa el NIT/RUC para emitir la factura electrónica.',
      })
      return
    }

    setCheckingOut(true)
    setCheckout(null)
    setActionError(null)

    try {
      const results = await validateCartStock(snapshot)
      setStockInfo(
        Object.fromEntries(results.map((result) => [result.productId, result])),
      )

      const problems = results.filter((result) => result.insufficient)

      if (problems.length > 0) {
        const names = problems
          .map(
            (result) =>
              items.find((item) => item.id === result.productId)?.product.name,
          )
          .filter(Boolean)

        setCheckout({
          type: 'warning',
          text:
            names.length === 1
              ? `No pudimos avanzar a la caja: ${names[0]} ya no tiene unidades suficientes. Ajusta la cantidad marcada.`
              : `No pudimos avanzar a la caja: ${names.join(', ')} ya no tienen unidades suficientes. Ajusta las cantidades marcadas.`,
        })
        return
      }

      // La transacción está confirmada: se emite el comprobante, se envía el
      // correo simulado, se registra la contabilidad y se descuenta el stock.
      const receipt = await issueReceipt({
        items,
        type: receiptType,
        customer: {
          name: customerName.trim() || 'Cliente de demostración',
          email,
          taxId,
        },
        shipping,
      })

      completePurchase(snapshot)
      navigate(`/orden/${receipt.id}`)
    } catch (error) {
      setCheckout({
        type: 'error',
        text:
          error instanceof Error && error.message
            ? error.message
            : 'No pudimos emitir el comprobante. Intenta de nuevo.',
      })
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav aria-label="Ruta de navegación" className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
            <Link to="/catalogo" className="font-semibold transition hover:text-violet-700">
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              Mi carrito
            </span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Mi carrito
              </h1>
              <p className="mt-1 text-sm text-slate-500" aria-live="polite">
                {itemCount === 0
                  ? 'Todavía no agregaste juguetes.'
                  : `${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'} en tu carrito`}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={handleRefreshStock}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualizando…' : 'Actualizar stock'}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-100 text-violet-600">
                <CartIcon className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900">
                Tu carrito está vacío
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Explora el catálogo y agrega los juguetes que quieras. Podrás cambiar las
                cantidades o eliminarlos antes de pagar.
              </p>
              <Link
                to="/catalogo"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
              >
                Explorar juguetes
                <ArrowRightIcon />
              </Link>
            </section>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <section aria-labelledby="articulos-title" className="space-y-4">
                <h2 id="articulos-title" className="sr-only">
                  Artículos del carrito
                </h2>

                {stockAlerts.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                        <AlertIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-amber-900">
                          {stockAlerts.length === 1
                            ? 'El stock de un artículo cambió'
                            : 'El stock de algunos artículos cambió'}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-800">
                          {stockAlerts.map(({ item, info }) => (
                            <li key={item.id}>
                              {item.product.name}:{' '}
                              {info.insufficient
                                ? `solo quedan ${info.stock} ${
                                    info.stock === 1 ? 'unidad' : 'unidades'
                                  }`
                                : `quedan ${info.stock} ${
                                    info.stock === 1 ? 'unidad' : 'unidades'
                                  } (antes había ${info.stockAtAdd})`}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-amber-800/80">
                          Actualiza las cantidades antes de finalizar la compra.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {actionError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"
                  >
                    {actionError}
                  </div>
                )}

                <div className="space-y-3">
                  {items.map((item) => {
                    const info = stockInfo[item.id]
                    const pending = pendingId === item.id

                    return (
                      <article
                        key={item.id}
                        aria-busy={pending}
                        className={`flex gap-3 rounded-2xl border bg-white p-3 shadow-sm transition sm:gap-4 sm:p-4 ${
                          info?.insufficient
                            ? 'border-rose-200'
                            : info?.changed
                              ? 'border-amber-200'
                              : 'border-slate-200'
                        } ${pending ? 'opacity-60' : ''}`}
                      >
                        <Link
                          to={`/producto/${item.id}`}
                          className="shrink-0 self-start overflow-hidden rounded-xl bg-slate-100"
                          aria-label={`Ver detalle de ${item.product.name}`}
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            width="80"
                            height="80"
                            loading="lazy"
                            decoding="async"
                            className="h-20 w-20 object-cover sm:h-28 sm:w-28"
                          />
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">
                                {item.product.brand}
                              </p>
                              <h3 className="mt-0.5 text-sm font-black leading-snug text-slate-900 sm:text-base">
                                <Link
                                  to={`/producto/${item.id}`}
                                  className="transition hover:text-violet-700"
                                >
                                  {item.product.name}
                                </Link>
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Precio unitario:{' '}
                                <span className="font-bold text-slate-700">
                                  {formatPrice(item.unitPrice)}
                                </span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemove(item)}
                              disabled={pending}
                              aria-label={`Eliminar ${item.product.name} del carrito`}
                              title="Eliminar del carrito"
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <TrashIcon />
                            </button>
                          </div>

                          <StockNotice info={info} quantity={item.quantity} />

                          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                            <div className="flex items-center gap-2">
                              <QuantityControl
                                item={item}
                                info={info}
                                pending={pending}
                                onDecrease={() => handleQuantity(item, item.quantity - 1)}
                                onIncrease={() => handleQuantity(item, item.quantity + 1)}
                              />
                              <span className="text-[11px] font-semibold text-slate-400">
                                Cantidad
                              </span>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Subtotal
                              </p>
                              <p className="text-base font-black tracking-tight text-slate-900">
                                {formatPrice(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 transition hover:text-fuchsia-600"
                >
                  ← Seguir comprando
                </Link>
              </section>

              <aside className="space-y-4 lg:sticky lg:top-24">
                <section
                  aria-labelledby="comprobante-title"
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2
                    id="comprobante-title"
                    className="text-base font-black text-slate-900"
                  >
                    Comprobante electrónico
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Se emitirá automáticamente al confirmar la compra.
                  </p>

                  <div
                    className="mt-3 grid grid-cols-2 gap-2"
                    role="group"
                    aria-label="Tipo de comprobante"
                  >
                    {[
                      { value: 'boleta', label: 'Boleta', hint: 'Persona natural' },
                      { value: 'factura', label: 'Factura', hint: 'Empresa / NIT' },
                    ].map((option) => {
                      const active = receiptType === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setReceiptType(option.value)}
                          aria-pressed={active}
                          className={`rounded-xl border px-3 py-2 text-left transition ${
                            active
                              ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`block text-sm font-black ${
                              active ? 'text-violet-700' : 'text-slate-700'
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {option.hint}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-3 space-y-3">
                    <label className="block">
                      <span className="text-[11px] font-bold text-slate-600">
                        Nombre o razón social
                      </span>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-bold text-slate-600">
                        Correo electrónico
                      </span>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(event) => setCustomerEmail(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      />
                      <span className="mt-1 block text-[10px] text-slate-400">
                        Aquí enviaremos el comprobante en PDF y XML.
                      </span>
                    </label>

                    {receiptType === 'factura' && (
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-600">
                          NIT / RUC
                        </span>
                        <input
                          type="text"
                          value={customerTaxId}
                          onChange={(event) => setCustomerTaxId(event.target.value)}
                          placeholder="900.123.456-7"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                        />
                      </label>
                    )}
                  </div>
                </section>

                <section
                  aria-labelledby="resumen-title"
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2 id="resumen-title" className="text-base font-black text-slate-900">
                    Resumen de compra
                  </h2>

                  <dl className="mt-4 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Artículos</dt>
                      <dd className="font-bold text-slate-800">{itemCount}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Subtotal</dt>
                      <dd className="font-bold text-slate-800">{formatPrice(subtotal)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-slate-500">
                        <TruckIcon className="h-4 w-4" />
                        Envío
                      </dt>
                      <dd className="font-bold text-emerald-600">
                        {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
                      </dd>
                    </div>
                    <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                      <dt className="text-sm font-black text-slate-900">Total a pagar</dt>
                      <dd className="text-2xl font-black tracking-tight text-slate-900">
                        {formatPrice(total)}
                      </dd>
                    </div>
                  </dl>

                  {subtotal > 0 && subtotal < FREE_SHIPPING_FROM && (
                    <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-semibold text-violet-700">
                      Te faltan {formatPrice(FREE_SHIPPING_FROM - subtotal)} para el envío gratis.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-base font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 disabled:cursor-wait disabled:opacity-60 disabled:shadow-none"
                  >
                    {checkingOut ? 'Emitiendo comprobante…' : 'Finalizar compra'}
                    {!checkingOut && <ArrowRightIcon />}
                  </button>

                  <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-slate-400">
                    <ShieldIcon className="mt-0.5 shrink-0" />
                    Al finalizar se emite tu comprobante electrónico y se envía por
                    correo con PDF y XML.
                  </p>

                  {checkout && (
                    <div
                      role={checkout.type === 'success' ? 'status' : 'alert'}
                      className={`mt-3 rounded-xl border p-3 text-xs font-semibold ${
                        checkout.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : checkout.type === 'warning'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span className="flex items-start gap-1.5">
                        {checkout.type === 'success' ? (
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        )}
                        {checkout.text}
                      </span>
                    </div>
                  )}
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Juguetes seguros para cada etapa
      </footer>
    </div>
  )
}
