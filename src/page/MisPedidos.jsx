import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import StoreFooter from '../components/StoreFooter.jsx'
import StoreHeader from '../components/StoreHeader.jsx'
import { ChristmasTree, Receipt, TeddyBear } from '../components/icons.jsx'
import { getSession } from '../services/authService.js'
import { listCustomerOrders } from '../services/orderService.js'
import {
  downloadReceiptPdf,
  getReceipt,
} from '../services/receiptService.js'

const priceFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const STATUS_STYLES = {
  preparando: 'bg-amber-50 text-amber-700 ring-amber-200',
  en_camino: 'bg-sky-50 text-sky-700 ring-sky-200',
  entregado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelado: 'bg-rose-50 text-rose-700 ring-rose-200',
}

function formatPrice(value) {
  return priceFormatter.format(Number(value) || 0)
}

function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

function PackageIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}

function ReceiptIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  )
}

function DownloadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
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

function OrderCard({ order }) {
  const statusStyle =
    STATUS_STYLES[order.status] ?? STATUS_STYLES.preparando
  const preview = order.items.slice(0, 3)
  const hiddenItems = order.items.length - preview.length

  function handleDownload() {
    const receipt = getReceipt(order.id)
    if (receipt) downloadReceiptPdf(receipt)
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-200 hover:shadow-md">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-700 ring-1 ring-amber-100">
            <PackageIcon />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-black tracking-tight text-slate-900">
                {order.number}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ring-1 ${statusStyle}`}>
                {order.statusMeta.label}
              </span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              {order.typeLabel} electrónica · {formatDate(order.issuedAt)} ·{' '}
              {order.items.length}{' '}
              {order.items.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Total pagado
          </p>
          <p className="text-lg font-black tracking-tight text-slate-900">
            {formatPrice(order.totals.total)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {preview.map((item) => (
            <span
              key={`${order.id}-${item.productId}`}
              className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={`Miniatura de ${item.name}`}
                  width="48"
                  height="48"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <TeddyBear className="h-5 w-5 text-slate-400" />
              )}
            </span>
          ))}
          {hiddenItems > 0 && (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-50 text-xs font-black text-slate-500 ring-1 ring-slate-200">
              +{hiddenItems}
            </span>
          )}
          <p className="min-w-0 truncate text-xs font-semibold text-slate-500">
            {order.items.map((item) => item.name).join(', ')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/orden/${order.id}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            aria-label={`Ver e imprimir ${order.typeLabel.toLowerCase()} ${order.number}`}
          >
            <ReceiptIcon />
            Ver / imprimir
          </Link>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            aria-label={`Descargar PDF de ${order.typeLabel.toLowerCase()} ${order.number}`}
          >
            <DownloadIcon />
            PDF
          </button>
        </div>
      </div>
    </article>
  )
}

export default function MisPedidos() {
  const [session] = useState(() => getSession())
  const [orders, setOrders] = useState(() =>
    session ? listCustomerOrders(session.email) : [],
  )

  if (!session) {
    return <Navigate to="/login" replace state={{ from: '/mis-pedidos' }} />
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav
            aria-label="Ruta de navegación"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm"
          >
            <Link
              to="/catalogo"
              className="font-semibold transition hover:text-red-700"
            >
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              Mis pedidos
            </span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-red-800 ring-1 ring-amber-200">
                <ChristmasTree className="h-3.5 w-3.5" /> Historial navideño
              </span>
              <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-toy-ink sm:text-3xl">
                Mis pedidos
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
                Consulta, vuelve a ver o imprime las boletas y facturas de tus
                compras anteriores.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOrders(listCustomerOrders(session.email))}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              Actualizar
            </button>
          </div>

          {orders.length === 0 ? (
            <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-600 ring-2 ring-amber-100" aria-hidden="true">
                <Receipt className="h-7 w-7" />
              </span>
              <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900">
                Todavía no tienes pedidos
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Cuando finalices una compra con{' '}
                <strong className="break-all text-slate-700">{session.email}</strong>,
                aparecerá aquí con su comprobante listo para ver o imprimir.
              </p>
              <Link
                to="/catalogo"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
              >
                Explorar el catálogo
                <ArrowRightIcon />
              </Link>
            </section>
          ) : (
            <div className="mt-6 space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  )
}
