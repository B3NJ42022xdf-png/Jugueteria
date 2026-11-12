import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader.jsx'
import { useCart } from '../context/cartContext.js'
import {
  calculateShipping,
  FREE_SHIPPING_FROM,
} from '../lib/cartTotals.js'
import { getSession } from '../services/authService.js'
import { issueReceipt } from '../services/receiptService.js'
import { validateCartStock } from '../services/storeService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(value) {
  return priceFormatter.format(value)
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
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

function ArrowRightIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
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

/* ------------------------------------------------------------------ */
/* Página: resumen de pago                                             */
/* ------------------------------------------------------------------ */

export default function Checkout() {
  const { items, itemCount, subtotal, completePurchase } = useCart()
  const navigate = useNavigate()

  const [receiptType, setReceiptType] = useState('boleta')
  const [customerName, setCustomerName] = useState('Cliente de demostración')
  const [customerEmail, setCustomerEmail] = useState(
    () => getSession()?.email ?? 'cliente@ejemplo.com',
  )
  const [customerTaxId, setCustomerTaxId] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [stockInfo, setStockInfo] = useState({})

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

  // Revalida el stock al entrar al resumen para no confirmar sobre datos viejos.
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

    return () => {
      cancelled = true
    }
  }, [snapshot])

  const shipping = calculateShipping(subtotal, itemCount)
  const total = subtotal + shipping
  const problems = Object.values(stockInfo).filter(
    (info) => info.insufficient,
  )

  async function handleConfirm() {
    if (items.length === 0 || checkingOut) return

    const email = customerEmail.trim()
    const taxId = customerTaxId.trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedback({
        type: 'error',
        text: 'Ingresa un correo válido para enviarte el comprobante.',
      })
      return
    }

    if (receiptType === 'factura' && !taxId) {
      setFeedback({
        type: 'error',
        text: 'Ingresa el NIT/RUC para emitir la factura electrónica.',
      })
      return
    }

    setCheckingOut(true)
    setFeedback(null)

    try {
      const results = await validateCartStock(snapshot)
      setStockInfo(
        Object.fromEntries(results.map((result) => [result.productId, result])),
      )

      const insufficient = results.filter((result) => result.insufficient)

      if (insufficient.length > 0) {
        const names = insufficient
          .map(
            (result) =>
              items.find((item) => item.id === result.productId)?.product.name,
          )
          .filter(Boolean)

        setFeedback({
          type: 'warning',
          text:
            names.length === 1
              ? `No pudimos confirmar el pago: ${names[0]} ya no tiene unidades suficientes. Ajusta la cantidad en el carrito.`
              : `No pudimos confirmar el pago: ${names.join(', ')} ya no tienen unidades suficientes. Ajusta las cantidades en el carrito.`,
        })
        return
      }

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
      setFeedback({
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
          <nav
            aria-label="Ruta de navegación"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm"
          >
            <Link to="/catalogo" className="font-semibold transition hover:text-violet-700">
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/carrito" className="font-semibold transition hover:text-violet-700">
              Mi carrito
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              Resumen de pago
            </span>
          </nav>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Resumen de pago
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Revisa tus artículos y los datos de facturación antes de confirmar.
            </p>
          </div>

          {items.length === 0 ? (
            <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-100 text-3xl">
                🎁
              </div>
              <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900">
                No hay artículos para pagar
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Agrega juguetes al carrito para continuar con el pago.
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
              <div className="space-y-4">
                {problems.length > 0 && (
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
                          Hay artículos sin stock suficiente
                        </p>
                        <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-800">
                          {problems.map((info) => (
                            <li key={info.productId}>
                              {items.find((item) => item.id === info.productId)?.product.name}:{' '}
                              solo quedan {info.stock}{' '}
                              {info.stock === 1 ? 'unidad' : 'unidades'}
                            </li>
                          ))}
                        </ul>
                        <Link
                          to="/carrito"
                          className="mt-2 inline-block text-xs font-bold text-amber-900 underline underline-offset-2"
                        >
                          Volver al carrito para ajustar cantidades
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <section
                  aria-labelledby="facturacion-title"
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2
                    id="facturacion-title"
                    className="text-base font-black text-slate-900"
                  >
                    Datos de facturación
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    El comprobante se emite automáticamente al confirmar el pago.
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
                  aria-labelledby="pago-articulos-title"
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2
                    id="pago-articulos-title"
                    className="text-base font-black text-slate-900"
                  >
                    Artículos ({itemCount})
                  </h2>

                  <ul className="mt-4 divide-y divide-slate-100">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                        <Link
                          to={`/producto/${item.id}`}
                          className="shrink-0 overflow-hidden rounded-xl bg-slate-100"
                          aria-label={`Ver detalle de ${item.product.name}`}
                        >
                          <img
                            src={item.product.imageUrl ?? item.product.image}
                            alt={item.product.name}
                            width="64"
                            height="64"
                            loading="lazy"
                            decoding="async"
                            className="h-16 w-16 object-cover"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900">
                            {item.product.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatPrice(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-black tabular-nums text-slate-900">
                          {formatPrice(item.subtotal)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/carrito"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 transition hover:text-fuchsia-600"
                  >
                    ← Volver al carrito
                  </Link>
                </section>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-24">
                <section
                  aria-labelledby="pago-resumen-title"
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h2
                    id="pago-resumen-title"
                    className="text-base font-black text-slate-900"
                  >
                    Total a pagar
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
                      <dt className="text-sm font-black text-slate-900">Total</dt>
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
                    onClick={handleConfirm}
                    disabled={checkingOut}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-base font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 disabled:cursor-wait disabled:opacity-60 disabled:shadow-none"
                  >
                    {checkingOut ? 'Emitiendo comprobante…' : 'Confirmar y pagar'}
                    {!checkingOut && <ArrowRightIcon />}
                  </button>

                  <p className="mt-3 flex items-start gap-1.5 text-left text-[11px] leading-relaxed text-slate-400">
                    <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      Pago protegido. Al confirmar se emite tu comprobante
                      electrónico y se envía por correo con PDF y XML.
                    </span>
                  </p>

                  {feedback && (
                    <div
                      role={feedback.type === 'success' ? 'status' : 'alert'}
                      className={`mt-3 rounded-xl border p-3 text-xs font-semibold ${
                        feedback.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : feedback.type === 'warning'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span className="flex items-start gap-1.5">
                        {feedback.type === 'success' ? (
                          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="min-w-0">{feedback.text}</span>
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
