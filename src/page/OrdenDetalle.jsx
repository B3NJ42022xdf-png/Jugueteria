import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader.jsx'
import {
  downloadReceiptPdf,
  downloadReceiptXml,
  formatReceiptMoney,
  getReceipt,
} from '../services/receiptService.js'

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function formatPrice(value) {
  return formatReceiptMoney(value)
}

function formatDate(isoDate) {
  return isoDate ? dateFormatter.format(new Date(isoDate)) : '—'
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function CheckCircleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
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

function FileIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  )
}

function MailIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function DatabaseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
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

function ArrowLeftIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Documento                                                           */
/* ------------------------------------------------------------------ */

function ReceiptDocument({ receipt }) {
  const taxPercent = Math.round(receipt.totals.taxRate * 100)

  return (
    <section
      aria-labelledby="comprobante-title"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-400" />

      <div className="p-5 sm:p-7">
        <h2 id="comprobante-title" className="sr-only">
          Comprobante electrónico
        </h2>

        <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xl shadow-md shadow-fuchsia-500/30">
                🧸
              </span>
              <div>
                <p className="text-base font-black leading-tight text-slate-900">
                  {receipt.store.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  Juguetería y artículos de entretenimiento
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-0.5 text-[11px] leading-relaxed text-slate-500">
              <p>
                <span className="font-semibold text-slate-700">
                  {receipt.store.taxIdLabel}: {receipt.store.taxId}
                </span>{' '}
                · {receipt.store.regime}
              </p>
              <p>{receipt.store.address}</p>
              <p>
                {receipt.store.phone} · {receipt.store.email}
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
              {receipt.typeLabel} electrónica
            </span>
            <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
              {receipt.number}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Emitido el {formatDate(receipt.issuedAt)}
            </p>
            <p className="text-[11px] text-slate-400">Moneda: {receipt.currency}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Cliente
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-800">
              {receipt.customer.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Correo
            </p>
            <p className="mt-0.5 break-all text-sm font-semibold text-slate-700">
              {receipt.customer.email}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {receipt.customer.taxIdLabel}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">
              {receipt.customer.taxId || 'No informado'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Código de verificación
            </p>
            <p className="mt-0.5 break-all font-mono text-xs font-semibold text-slate-600">
              {receipt.verificationCode}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="w-8 py-2 pr-2 font-black">#</th>
                <th className="py-2 pr-3 font-black">Descripción</th>
                <th className="py-2 pr-3 text-right font-black">Cant.</th>
                <th className="py-2 pr-3 text-right font-black">P. unit.</th>
                <th className="py-2 text-right font-black">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr
                  key={`${item.productId}-${item.index}`}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-3 pr-2 align-top text-xs text-slate-400">
                    {item.index}
                  </td>
                  <td className="py-3 pr-3 align-top">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    {item.brand && (
                      <p className="text-[11px] text-slate-400">{item.brand}</p>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right align-top tabular-nums text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="py-3 pr-3 text-right align-top tabular-nums text-slate-600">
                    {formatPrice(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right align-top font-bold tabular-nums text-slate-800">
                    {formatPrice(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <dl className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-bold tabular-nums text-slate-800">
                {formatPrice(receipt.totals.subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Envío</dt>
              <dd className="font-bold tabular-nums text-emerald-600">
                {receipt.totals.shipping === 0
                  ? 'Gratis'
                  : formatPrice(receipt.totals.shipping)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
              <dt className="text-slate-500">Base gravable</dt>
              <dd className="font-bold tabular-nums text-slate-800">
                {formatPrice(receipt.totals.taxableBase)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">IVA ({taxPercent} %)</dt>
              <dd className="font-bold tabular-nums text-slate-800">
                {formatPrice(receipt.totals.tax)}
              </dd>
            </div>
            <div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-3">
              <dt className="text-base font-black text-slate-900">Total pagado</dt>
              <dd className="text-xl font-black tracking-tight text-slate-900">
                {formatPrice(receipt.totals.total)}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-3 text-right text-[10px] text-slate-400">
          Precios en {receipt.currency}. El IVA ya está incluido en los precios
          unitarios.
        </p>

        <div className="mt-6 border-t border-dashed border-slate-200 pt-4 text-center text-[10px] leading-relaxed text-slate-400">
          <p>{receipt.store.resolution}</p>
          <p className="mt-1">
            Comprobante electrónico generado automáticamente y registrado para
            auditoría. Documento de demostración.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function OrdenDetalle() {
  const { id } = useParams()
  const receipt = useMemo(() => getReceipt(id), [id])

  if (!receipt) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <StoreHeader />
        <main className="grid flex-1 place-items-center px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="text-5xl" aria-hidden="true">
              🧾
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
              Comprobante no encontrado
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              El comprobante que buscas no existe o fue eliminado de este
              dispositivo.
            </p>
            <Link
              to="/catalogo"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              <ArrowLeftIcon />
              Ir al catálogo
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const attachments = receipt.email?.attachments ?? []

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
            <span className="font-semibold text-slate-700" aria-current="page">
              Detalle de la orden
            </span>
          </nav>

          <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircleIcon className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    ¡Compra confirmada!
                  </h1>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Emitimos tu {receipt.typeLabel.toLowerCase()} electrónica{' '}
                    <strong className="text-slate-800">{receipt.number}</strong> y
                    enviamos el PDF y el XML a{' '}
                    <strong className="break-all text-slate-800">
                      {receipt.customer.email}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Total pagado
                </p>
                <p className="text-xl font-black tracking-tight text-slate-900">
                  {formatPrice(receipt.totals.total)}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <ReceiptDocument receipt={receipt} />

            <aside className="space-y-4 lg:sticky lg:top-24">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-black text-slate-900">
                  Descargar comprobante
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Obtén la representación impresa y el documento electrónico de tu
                  compra.
                </p>

                <button
                  type="button"
                  onClick={() => downloadReceiptPdf(receipt)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300"
                >
                  <DownloadIcon />
                  Descargar PDF
                </button>

                <button
                  type="button"
                  onClick={() => downloadReceiptXml(receipt)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                >
                  <FileIcon />
                  Descargar XML
                </button>

                <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
                  El PDF es la representación impresa. El XML es el comprobante
                  electrónico para tu contabilidad.
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <MailIcon className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-black text-slate-900">
                    Correo enviado
                  </h2>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  Enviado automáticamente a
                </p>
                <p className="break-all text-sm font-bold text-slate-800">
                  {receipt.email?.to ?? receipt.customer.email}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {formatDate(receipt.email?.sentAt)}
                </p>

                <p className="mt-4 text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Adjuntos
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {attachments.map((attachment) => (
                    <li
                      key={attachment.name}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-600">
                        <FileIcon className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                        <span className="truncate">{attachment.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-400">
                        {formatBytes(attachment.size)}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
                  <ShieldIcon className="mt-0.5 h-3 w-3 shrink-0" />
                  Envío simulado en este entorno de demostración.
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-700">
                    <DatabaseIcon className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-black text-slate-900">
                    Registro contable
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Comprobante registrado en la base de datos contable para fines
                  de auditoría.
                </p>

                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Asiento</dt>
                    <dd className="break-all font-mono font-bold text-slate-800">
                      {receipt.accounting?.ledgerEntry ?? '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Estado</dt>
                    <dd>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircleIcon className="h-3 w-3" />
                        {receipt.accounting?.status ?? 'registrado'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Registrado</dt>
                    <dd className="text-right font-semibold text-slate-700">
                      {formatDate(receipt.accounting?.registeredAt)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                    <dt className="text-slate-500">Monto</dt>
                    <dd className="font-black text-slate-900">
                      {formatPrice(receipt.totals.total)}
                    </dd>
                  </div>
                </dl>
              </section>

              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 transition hover:text-fuchsia-600"
              >
                <ArrowLeftIcon />
                Seguir comprando
              </Link>
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Juguetes seguros para cada etapa
      </footer>
    </div>
  )
}
