import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader.jsx'
import { getSession, logoutUser } from '../services/authService.js'
import {
  ORDER_STATUS_FLOW,
  getStatusIndex,
  listCustomerOrders,
} from '../services/orderService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatPrice(value) {
  return priceFormatter.format(Math.round(Number(value) || 0))
}

function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : 'Pendiente'
}

const STATUS_STYLES = {
  preparando: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  en_camino: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    dot: 'bg-sky-500',
  },
  entregado: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelado: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function PackageIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}

function TruckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.3a1 1 0 0 0-.2-.6l-3.3-4.4a1 1 0 0 0-.8-.4H14v8h2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
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

function ChevronDownIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
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

function ReceiptIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  )
}

function StarIcon({ className = 'h-4 w-4', filled = true }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8L12 3.6Z" />
    </svg>
  )
}

function LogoutIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Línea de tiempo                                                     */
/* ------------------------------------------------------------------ */

function OrderTimeline({ order }) {
  const cancelled = order.status === 'cancelado'
  const effectiveStatus = cancelled
    ? ([...(order.shipmentHistory ?? [])]
        .reverse()
        .find((entry) => entry.status !== 'cancelado')?.status ?? 'preparando')
    : order.status
  const currentIndex = getStatusIndex(effectiveStatus)
  const progress = (currentIndex / (ORDER_STATUS_FLOW.length - 1)) * 100

  return (
    <div className="relative pt-1">
      <div
        aria-hidden="true"
        className="absolute left-[16.66%] right-[16.66%] top-4 h-1 rounded-full bg-slate-200"
      />
      <div
        aria-hidden="true"
        className="absolute left-[16.66%] top-4 h-1 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
        style={{ width: `${progress * 0.6666}%` }}
      />

      <ol className="relative grid grid-cols-3">
        {order.timeline.map((step, index) => {
          const done = step.state === 'done'
          const current = step.state === 'current'

          return (
            <li key={step.key} className="flex flex-col items-center text-center">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black transition ${
                  done
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : current
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-4 ring-violet-100'
                      : 'border border-slate-200 bg-white text-slate-400'
                }`}
                aria-current={current ? 'step' : undefined}
              >
                {done || (current && step.key === 'entregado')
                  ? '✓'
                  : index + 1}
              </span>
              <span
                className={`mt-2 text-[11px] font-black leading-tight sm:text-xs ${
                  current
                    ? 'text-violet-700'
                    : done
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              <span className="mt-0.5 text-[10px] leading-tight text-slate-400">
                {step.at ? formatDateTime(step.at) : 'Pendiente'}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tarjeta de pedido                                                   */
/* ------------------------------------------------------------------ */

function OrderCard({ order, open, onToggle }) {
  const styles = STATUS_STYLES[order.status] ?? STATUS_STYLES.preparando
  const delivered = order.status === 'entregado'
  const cancelled = order.status === 'cancelado'

  return (
    <article
      id={`pedido-${order.id}`}
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
        open ? 'border-violet-300 ring-4 ring-violet-50' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`detalle-${order.id}`}
        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50/70 sm:items-center sm:p-5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
          <PackageIcon className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-black tracking-tight text-slate-900">
              {order.number}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ring-1 ${styles.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
              {order.statusMeta.label}
            </span>
          </span>
          <span className="mt-1 block text-[11px] text-slate-500">
            {formatDate(order.issuedAt)} · {order.items.length}{' '}
            {order.items.length === 1 ? 'producto' : 'productos'}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Total pagado
          </span>
          <span className="block text-base font-black tracking-tight text-slate-900 sm:text-lg">
            {formatPrice(order.totals.total)}
          </span>
        </span>

        <span
          className={`mt-1 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div
          id={`detalle-${order.id}`}
          className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5"
        >
          <section aria-labelledby={`seguimiento-${order.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3
                id={`seguimiento-${order.id}`}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500"
              >
                <TruckIcon className="h-4 w-4 text-violet-600" />
                Seguimiento del envío
              </h3>
              <span className="text-[10px] text-slate-400">
                Actualizado {formatDateTime(order.shipmentUpdatedAt)}
              </span>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <OrderTimeline order={order} />

              {order.trackingNumber && (
                <p className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                  <TruckIcon className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                  Número de guía:
                  <span className="font-mono font-bold text-slate-700">
                    {order.trackingNumber}
                  </span>
                </p>
              )}

              {cancelled && (
                <p className="mt-4 flex items-start gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                  <span aria-hidden="true">⚠️</span>
                  Este pedido fue cancelado y no será despachado. Si tienes dudas,
                  contacta a la juguetería.
                </p>
              )}

              {!delivered && !cancelled && (
                <p className="mt-5 flex items-start gap-1.5 border-t border-dashed border-slate-200 pt-4 text-[10px] leading-relaxed text-slate-400">
                  <TruckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Nuestro equipo actualiza la etapa del envío y te avisa por correo
                  en cada cambio.
                </p>
              )}

              {delivered && (
                <p className="mt-5 flex items-center gap-1.5 border-t border-dashed border-slate-200 pt-4 text-[11px] font-semibold text-emerald-700">
                  <CheckCircleIcon className="h-4 w-4" />
                  Pedido entregado. Ya puedes calificar tus juguetes.
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby={`desglose-${order.id}`} className="mt-5">
            <h3
              id={`desglose-${order.id}`}
              className="text-xs font-black uppercase tracking-wide text-slate-500"
            >
              Juguetes comprados
            </h3>

            <ul className="mt-2 divide-y divide-slate-200/80 rounded-2xl border border-slate-200 bg-white px-4">
              {order.items.map((item) => (
                <li
                  key={`${order.id}-${item.productId}`}
                  className="flex items-center gap-3 py-3"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      width="56"
                      height="56"
                      loading="lazy"
                      decoding="async"
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-violet-50 text-2xl">
                      🧸
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.brand ? `${item.brand} · ` : ''}
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>

                    {delivered ? (
                      item.rating ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                          {Array.from({ length: item.rating.stars }).map(
                            (_, index) => (
                              <StarIcon key={index} className="h-3 w-3" />
                            ),
                          )}
                          <span className="ml-0.5 font-semibold text-slate-500">
                            Tu calificación
                          </span>
                        </p>
                      ) : (
                        <Link
                          to={`/calificar/${order.id}/${item.productId}`}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-black text-violet-700 underline-offset-2 transition hover:text-fuchsia-600 hover:underline"
                        >
                          Calificar producto
                          <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                      )
                    ) : (
                      <p className="mt-1 text-[10px] text-slate-400">
                        La calificación se habilita al entregarse.
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black tabular-nums text-slate-900">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              Base gravable {formatPrice(order.totals.taxableBase)} · IVA{' '}
              {formatPrice(order.totals.tax)}
            </div>

            <Link
              to={`/orden/${order.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <ReceiptIcon />
              Ver comprobante electrónico
            </Link>
          </footer>
        </div>
      )}
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function Perfil() {
  const navigate = useNavigate()
  const [session] = useState(() => getSession())
  const [orders, setOrders] = useState(() =>
    session ? listCustomerOrders(session.email) : [],
  )
  const [openOrderId, setOpenOrderId] = useState(() => orders[0]?.id ?? null)

  if (!session) {
    return <Navigate to="/login" replace state={{ from: '/perfil' }} />
  }

  const deliveredCount = orders.filter(
    (order) => order.status === 'entregado',
  ).length
  const inTransitCount = orders.filter(
    (order) => order.status === 'en_camino',
  ).length

  function handleLogout() {
    logoutUser()
    navigate('/login', { replace: true })
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
              className="font-semibold transition hover:text-violet-700"
            >
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              Mi perfil
            </span>
          </nav>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-400" />

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-2xl font-black text-white shadow-lg shadow-fuchsia-500/25">
                  {session.email.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-600">
                    Cliente registrado
                  </p>
                  <h1 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    Mi perfil
                  </h1>
                  <p className="truncate text-sm font-semibold text-slate-500">
                    {session.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <dl className="flex gap-2">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                    <dt className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                      Pedidos
                    </dt>
                    <dd className="text-base font-black text-slate-900">
                      {orders.length}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-sky-50 px-3 py-2 text-center">
                    <dt className="text-[9px] font-black uppercase tracking-wide text-sky-500">
                      En camino
                    </dt>
                    <dd className="text-base font-black text-sky-700">
                      {inTransitCount}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-center">
                    <dt className="text-[9px] font-black uppercase tracking-wide text-emerald-500">
                      Entregados
                    </dt>
                    <dd className="text-base font-black text-emerald-700">
                      {deliveredCount}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                >
                  <LogoutIcon />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </section>

          <section aria-labelledby="mis-pedidos-title" className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2
                  id="mis-pedidos-title"
                  className="text-2xl font-black tracking-tight text-slate-900"
                >
                  Mis Pedidos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Historial ordenado del más reciente al más antiguo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
                  {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
                <button
                  type="button"
                  onClick={() => setOrders(listCustomerOrders(session.email))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  Actualizar
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <span className="text-5xl" aria-hidden="true">
                  🧾
                </span>
                <h3 className="mt-4 text-lg font-black text-slate-900">
                  Todavía no tienes pedidos
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  Cuando finalices una compra con{' '}
                  <strong className="text-slate-700">{session.email}</strong>,
                  aparecerá aquí con su estado de envío y podrás calificar tus
                  juguetes.
                </p>
                <Link
                  to="/catalogo"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"
                >
                  Explorar el catálogo
                  <ArrowRightIcon />
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    open={openOrderId === order.id}
                    onToggle={() =>
                      setOpenOrderId((current) =>
                        current === order.id ? null : order.id,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Juguetes seguros para cada etapa
      </footer>
    </div>
  )
}
