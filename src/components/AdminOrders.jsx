import { useMemo, useState } from 'react'
import {
  ORDER_STATUSES,
  listAdminOrders,
  updateShipmentStatus,
} from '../services/orderService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const STATUS_STYLES = {
  preparando: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    card: 'border-amber-200 bg-amber-50',
    count: 'text-amber-700',
    dot: 'bg-amber-500',
    select: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  en_camino: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    card: 'border-sky-200 bg-sky-50',
    count: 'text-sky-700',
    dot: 'bg-sky-500',
    select: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  entregado: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    card: 'border-emerald-200 bg-emerald-50',
    count: 'text-emerald-700',
    dot: 'bg-emerald-500',
    select: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  cancelado: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    card: 'border-rose-200 bg-rose-50',
    count: 'text-rose-700',
    dot: 'bg-rose-500',
    select: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

const FILTERS = [
  { value: 'all', label: 'Todos' },
  ...ORDER_STATUSES.map((status) => ({
    value: status.key,
    label: status.shortLabel,
  })),
]

function formatPrice(value) {
  return priceFormatter.format(Math.round(Number(value) || 0))
}

function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : '—'
}

function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : '—'
}

function shortenEmail(value) {
  return String(value ?? '').trim() || 'Administrador'
}

function buildDraft(order) {
  return {
    status: order.status,
    tracking: order.trackingNumber ?? '',
  }
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

function TruckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.3a1 1 0 0 0-.2-.6l-3.3-4.4a1 1 0 0 0-.8-.4H14v8h2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
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

function MailIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function HistoryIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
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

function ChevronDownIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Tarjeta de pedido                                                   */
/* ------------------------------------------------------------------ */

function AdminOrderCard({ order, session, onUpdated }) {
  const [draft, setDraft] = useState(() => buildDraft(order))
  const [auditEntries, setAuditEntries] = useState(() => order.audit)
  const [auditOpen, setAuditOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(null)

  const trackedStatus = saved?.shipment.status ?? order.status
  const trackedMeta =
    ORDER_STATUSES.find((status) => status.key === trackedStatus) ??
    ORDER_STATUSES[0]
  const trackingNumber =
    saved?.shipment.trackingNumber ?? order.trackingNumber
  const audit = auditEntries
  const statusStyles =
    STATUS_STYLES[trackedStatus] ?? STATUS_STYLES.preparando
  const needsTracking =
    draft.status === 'en_camino' || draft.status === 'entregado'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaved(null)
    setWorking(true)

    try {
      const result = await updateShipmentStatus({
        receiptId: order.id,
        status: draft.status,
        trackingNumber: draft.tracking,
        admin: { email: session.email, role: session.role },
      })

      setSaved(result)
      setAuditEntries((current) => [result.auditEntry, ...current])
      onUpdated?.(order.id, result)
      setDraft({
        status: result.shipment.status,
        tracking: result.shipment.trackingNumber,
      })
      setAuditOpen(true)
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No pudimos actualizar el pedido.',
      )
    } finally {
      setWorking(false)
    }
  }

  return (
    <li
      id={`pedido-admin-${order.id}`}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <PackageIcon className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black tracking-tight text-slate-900">
                {order.number}
              </p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ring-1 ${statusStyles.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`} />
                {saved ? trackedMeta.label : order.statusMeta.label}
              </span>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-slate-600">
              {order.customer?.name}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {order.customer?.email}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Comprado el {formatDate(order.issuedAt)} · {order.items.length}{' '}
              {order.items.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Total pagado
          </p>
          <p className="text-lg font-black tracking-tight text-slate-900">
            {formatPrice(order.totals.total)}
          </p>
          {trackingNumber ? (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              <TruckIcon className="h-3 w-3" />
              {trackingNumber}
            </p>
          ) : (
            <p className="mt-1 text-[10px] text-slate-400">Sin guía asignada</p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Etapa del despacho
            </span>
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft((current) => ({ ...current, status: event.target.value }))
              }
              className={`mt-1 w-full rounded-xl border px-3 py-2 text-xs font-bold shadow-sm outline-none transition focus:ring-4 focus:ring-violet-100 ${(STATUS_STYLES[draft.status] ?? STATUS_STYLES.preparando).select}`}
            >
              {ORDER_STATUSES.map((status) => (
                <option
                  key={status.key}
                  value={status.key}
                  disabled={
                    status.key === 'cancelado' && trackedStatus === 'entregado'
                  }
                >
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Número de guía / tracking {needsTracking && <span className="text-rose-500">*</span>}
            </span>
            <input
              type="text"
              value={draft.tracking}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  tracking: event.target.value,
                }))
              }
              placeholder="Ej. TCC-984512377"
              maxLength={40}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 shadow-sm outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <button
            type="submit"
            disabled={working}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 disabled:cursor-wait disabled:opacity-60"
          >
            {working ? 'Enviando…' : 'Guardar y notificar'}
          </button>
        </form>

        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
          <MailIcon className="mt-0.5 h-3 w-3 shrink-0" />
          El cambio envía automáticamente un correo a{' '}
          <span className="font-semibold text-slate-500">
            {order.customer?.email}
          </span>{' '}
          y queda registrado en la bitácora con fecha, hora y administrador.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700"
          >
            {error}
          </p>
        )}

        {saved && (
          <div
            role="status"
            className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700"
          >
            <p className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
              Pedido actualizado a “{trackedMeta.label}”. Correo enviado a{' '}
              {saved.email.to}.
            </p>
            <p className="mt-1 text-[10px] font-normal text-emerald-600">
              Guía: {saved.shipment.trackingNumber || 'sin guía'} ·{' '}
              {formatDateTime(saved.email.sentAt)} · asunto “{saved.email.subject}”
            </p>
          </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setAuditOpen((current) => !current)}
            aria-expanded={auditOpen}
            className="inline-flex items-center gap-1.5 text-[11px] font-black text-slate-500 transition hover:text-violet-700"
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            Bitácora de la orden ({audit.length})
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform ${auditOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {auditOpen && (
            <div className="mt-2 overflow-x-auto">
              {audit.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                  Sin cambios registrados. El pedido conserva su etapa inicial.
                </p>
              ) : (
                <table className="w-full min-w-[560px] border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[9px] uppercase tracking-wide text-slate-400">
                      <th className="py-1.5 pr-2 font-black">Fecha y hora</th>
                      <th className="py-1.5 pr-2 font-black">Administrador</th>
                      <th className="py-1.5 pr-2 font-black">Cambio</th>
                      <th className="py-1.5 font-black">Guía</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 pr-2 align-top tabular-nums text-slate-500">
                          {formatDateTime(entry.at)}
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <ShieldIcon className="h-3 w-3 shrink-0 text-violet-600" />
                            <span className="break-all">
                              {shortenEmail(entry.adminEmail)}
                            </span>
                          </span>
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <span className="font-bold text-slate-700">
                            {ORDER_STATUSES.find(
                              (status) => status.key === entry.fromStatus,
                            )?.label ?? entry.fromStatus}
                          </span>
                          <span className="text-slate-400"> → </span>
                          <span className="font-black text-slate-900">
                            {ORDER_STATUSES.find(
                              (status) => status.key === entry.toStatus,
                            )?.label ?? entry.toStatus}
                          </span>
                        </td>
                        <td className="py-2 align-top font-mono text-[10px] text-slate-500">
                          {entry.trackingNumber || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Listado                                                             */
/* ------------------------------------------------------------------ */

export default function AdminOrders({ session }) {
  const [orders, setOrders] = useState(() => listAdminOrders())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const counts = useMemo(() => {
    const base = { all: orders.length }
    ORDER_STATUSES.forEach((status) => {
      base[status.key] = orders.filter(
        (order) => order.status === status.key,
      ).length
    })
    return base
  }, [orders])

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        `${order.number} ${order.customer?.name ?? ''} ${order.customer?.email ?? ''}`
          .toLowerCase()
          .includes(term)
      const matchesFilter = filter === 'all' || order.status === filter

      return matchesSearch && matchesFilter
    })
  }, [orders, search, filter])

  function refresh() {
    setOrders(listAdminOrders())
  }

  return (
    <section aria-labelledby="pedidos-admin-title">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Pedidos
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">{counts.all}</p>
        </div>
        {ORDER_STATUSES.map((status) => {
          const styles = STATUS_STYLES[status.key]
          return (
            <div
              key={status.key}
              className={`rounded-2xl border p-4 shadow-sm ${styles.card}`}
            >
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {status.shortLabel}
              </p>
              <p className={`mt-1 text-2xl font-black ${styles.count}`}>
                {counts[status.key]}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2
            id="pedidos-admin-title"
            className="text-xl font-black tracking-tight text-slate-900"
          >
            Órdenes de compra
          </h2>
          <p className="text-xs text-slate-500">
            {visibleOrders.length} de {orders.length} pedidos · el cliente recibe
            un correo en cada cambio.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por pedido o cliente"
              aria-label="Buscar pedidos por número o cliente"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:w-64"
            />
          </div>

          <div
            className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
            role="group"
            aria-label="Filtrar pedidos por estado"
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

      {orders.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="text-5xl" aria-hidden="true">
            📦
          </span>
          <h3 className="mt-4 text-lg font-black text-slate-900">
            Todavía no hay órdenes de compra
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Cuando un cliente finalice una compra aparecerá aquí con su estado
            actual, su número de guía y la bitácora de cambios.
          </p>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden="true">
            🔎
          </span>
          <h3 className="mt-3 text-base font-black text-slate-900">
            No encontramos pedidos
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Prueba con otro número de pedido, correo o cambia el filtro.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visibleOrders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              session={session}
              onUpdated={(orderId, result) =>
                setOrders((current) =>
                  current.map((item) =>
                    item.id === orderId
                      ? {
                          ...item,
                          status: result.shipment.status,
                          statusMeta:
                            ORDER_STATUSES.find(
                              (status) =>
                                status.key === result.shipment.status,
                            ) ?? item.statusMeta,
                          trackingNumber: result.shipment.trackingNumber,
                          shipmentUpdatedAt: result.shipment.updatedAt,
                          shipmentUpdatedBy: result.shipment.updatedBy,
                          audit: [result.auditEntry, ...item.audit],
                        }
                      : item,
                  ),
                )
              }
            />
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          Cada actualización registra la fecha, la hora y el correo del
          administrador. En producción el envío del correo se hace desde el
          servidor y la bitácora es inmutable.
        </p>
        <button
          type="button"
          onClick={refresh}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Actualizar listado
        </button>
      </div>
    </section>
  )
}
