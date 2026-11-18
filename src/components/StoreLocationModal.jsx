import { STORE_CONTACT } from '../data/storeContact.js'
import { copyText } from '../lib/clipboard.js'
import { showToast, TOAST_KINDS } from '../lib/toast.js'
import ModalShell from './ModalShell.jsx'
import { Clock, Copy, ExternalLink, MapPin, Store } from './icons.jsx'

/**
 * Modal "Nuestra Tienda Física".
 *
 * Muestra un mapa embebido de Google Maps, la dirección exacta, referencias
 * para llegar y los horarios navideños. No abre aplicaciones externas: el
 * enlace a Google Maps es opcional y se abre en otra pestaña.
 */
export default function StoreLocationModal({ onClose }) {
  async function handleCopyAddress() {
    const copied = await copyText(STORE_CONTACT.address)

    showToast(
      copied
        ? {
            kind: TOAST_KINDS.SUCCESS,
            title: 'Dirección copiada',
            message: `${STORE_CONTACT.address} está en tu portapapeles.`,
          }
        : {
            kind: TOAST_KINDS.ERROR,
            title: 'No pudimos copiar',
            message: 'Selecciona la dirección y cópiala manualmente.',
          },
    )
  }

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="tienda-titulo"
      describedBy="tienda-descripcion"
      closeLabel="Cerrar información de la tienda"
      maxWidth="max-w-2xl"
    >
      <div className="pr-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-900">
          <Store className="h-3.5 w-3.5" /> Visítanos
        </span>
        <h2
          id="tienda-titulo"
          className="mt-3 font-festive text-3xl font-bold leading-none tracking-wide text-red-800"
        >
          Nuestra Tienda Física
        </h2>
        <p
          id="tienda-descripcion"
          className="mt-2 text-sm font-semibold leading-relaxed text-slate-600"
        >
          Ven a conocer los juguetes en persona, probar los favoritos de Papá
          Noel y recoger tu pedido web sin costo de envío.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border-2 border-amber-200 bg-amber-50 shadow-sm">
        <iframe
          title="Mapa de Mi Juguetería en Lima, Perú"
          src={STORE_CONTACT.mapsEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-64 w-full border-0 sm:h-72"
        />
      </div>

      <div className="mt-4 rounded-2xl border-2 border-amber-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          Dirección exacta
        </p>
        <p className="mt-0.5 font-display text-lg font-extrabold leading-tight text-toy-ink">
          {STORE_CONTACT.address}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={STORE_CONTACT.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70"
          >
            Abrir en Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={handleCopyAddress}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-amber-300 bg-white px-4 py-2 text-xs font-extrabold text-red-800 transition hover:-translate-y-0.5 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar dirección
          </button>
        </div>
      </div>

      <section className="mt-4" aria-labelledby="tienda-como-llegar">
        <h3
          id="tienda-como-llegar"
          className="flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-red-800"
        >
          <MapPin className="h-4 w-4" /> Cómo llegar
        </h3>
        <ul className="mt-2 space-y-1.5">
          {STORE_CONTACT.references.map((reference) => (
            <li
              key={reference}
              className="flex items-start gap-2 rounded-xl bg-amber-50/70 px-3 py-2 text-xs font-semibold leading-relaxed text-slate-600 ring-1 ring-amber-100"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-700" />
              <span>{reference}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4" aria-labelledby="tienda-horarios">
        <h3
          id="tienda-horarios"
          className="flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-red-800"
        >
          <Clock className="h-4 w-4" /> Horarios navideños
        </h3>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {STORE_CONTACT.hours.map((item) => (
            <li
              key={item.day}
              className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-amber-100"
            >
              <span>{item.day}</span>
              <span className="shrink-0 font-black text-red-700">
                {item.time}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
        Si vienes a recoger un pedido web, muestra tu código de orden en caja.
        El recojo en tienda no tiene costo de envío.
      </p>
    </ModalShell>
  )
}
