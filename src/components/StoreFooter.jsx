import { useState } from 'react'
import { Link } from 'react-router-dom'
import { STORE_CONTACT } from '../data/storeContact.js'
import { copyText } from '../lib/clipboard.js'
import { showToast, TOAST_KINDS } from '../lib/toast.js'
import ContactModal from './ContactModal.jsx'
import StoreLocationModal from './StoreLocationModal.jsx'
import {
  ChristmasTree,
  Clock,
  Copy,
  CreditCard,
  Gift,
  Heart,
  Mail,
  MapPin,
  Shield,
  Snowflake,
  Truck,
  WhatsApp,
} from './icons.jsx'

const CUSTOMER_LINKS = [
  { label: 'Preguntas frecuentes', href: '#atencion-cliente' },
  { label: 'Envíos y entregas', href: '#atencion-cliente' },
  { label: 'Cambios y devoluciones', href: '#atencion-cliente' },
  { label: 'Libro de reclamaciones', href: '#atencion-cliente' },
]

const PAYMENT_METHODS = [
  {
    label: 'Yape',
    detail: 'Pago con QR',
    className: 'bg-violet-600 text-white ring-violet-300',
  },
  {
    label: 'Plin',
    detail: 'Billetera digital',
    className: 'bg-sky-600 text-white ring-sky-300',
  },
  {
    label: 'Visa',
    detail: 'Crédito y débito',
    className: 'bg-blue-700 text-white ring-blue-300',
  },
  {
    label: 'Mastercard',
    detail: 'Crédito y débito',
    className: 'bg-red-600 text-white ring-red-300',
  },
]

const interactiveClass =
  'inline-flex min-h-8 cursor-pointer gap-1.5 rounded-lg px-1 py-0.5 transition hover:bg-white/10 hover:text-amber-200 hover:underline hover:underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300'

async function copyWithToast(value, messages) {
  const copied = await copyText(value)

  showToast(
    copied
      ? {
          kind: TOAST_KINDS.SUCCESS,
          title: messages.successTitle,
          message: messages.successMessage,
        }
      : {
          kind: TOAST_KINDS.ERROR,
          title: 'No pudimos copiar',
          message: messages.errorMessage,
        },
  )
}

function CopyButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-amber-100/70 ring-1 ring-white/20 transition hover:bg-white/15 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  )
}

/**
 * Footer navideño completo.
 *
 * Se reutiliza en todas las páginas de la tienda. Los datos de contacto son
 * interactivos: el teléfono abre WhatsApp Web, el correo abre el formulario
 * "Contáctanos" y la dirección abre el mapa de la tienda física. Los botones
 * pequeños copian cada dato sin salir de la web.
 */
export default function StoreFooter() {
  const year = new Date().getFullYear()
  const [contactOpen, setContactOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)

  function handleCopyPhone() {
    copyWithToast(STORE_CONTACT.phoneDisplay, {
      successTitle: 'Número copiado',
      successMessage: `${STORE_CONTACT.phoneDisplay} está en tu portapapeles.`,
      errorMessage: 'Selecciona el número y cópialo manualmente.',
    })
  }

  function handleCopyEmail() {
    copyWithToast(STORE_CONTACT.email, {
      successTitle: 'Correo copiado',
      successMessage: `${STORE_CONTACT.email} está en tu portapapeles.`,
      errorMessage: 'Selecciona el correo y cópialo manualmente.',
    })
  }

  return (
    <>
      <footer className="relative mt-8 overflow-hidden border-t-2 border-red-900/10 bg-gradient-to-br from-[#5b1414] via-[#7f1d1d] to-[#14532d] text-white">
        <div aria-hidden="true" className="christmas-stripes h-1.5 w-full" />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Marca */}
            <div>
              <Link
                to="/catalogo"
                className="group inline-flex items-center gap-2.5"
                aria-label="Mi Juguetería, ir al catálogo"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-amber-100 shadow-md ring-2 ring-amber-300 transition-transform duration-300 group-hover:-rotate-6">
                  <ChristmasTree className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-festive text-xl font-bold leading-none tracking-wide text-amber-200">
                    Mi Juguetería
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-100/80">
                    <Snowflake className="h-3 w-3" /> Especial Navidad
                  </span>
                </span>
              </Link>

              <p className="mt-4 max-w-xs text-sm font-semibold leading-relaxed text-amber-50/85">
                Juguetes seguros y llenos de magia para cada etapa. Ayudamos a
                elegir el regalo perfecto para esta Navidad.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-100 ring-1 ring-white/15">
                  <Shield className="h-3.5 w-3.5" /> Compra protegida
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-100 ring-1 ring-white/15">
                  <Truck className="h-3.5 w-3.5" /> Envíos a todo el Perú
                </span>
              </div>
            </div>

            {/* Atención al cliente */}
            <nav id="atencion-cliente" aria-labelledby="footer-atencion-title">
              <h2
                id="footer-atencion-title"
                className="flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-amber-300"
              >
                <Gift className="h-4 w-4" /> Atención al Cliente
              </h2>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-amber-50/85">
                {CUSTOMER_LINKS.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="transition hover:text-amber-200 hover:underline hover:underline-offset-2"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    to="/mis-pedidos"
                    className="transition hover:text-amber-200 hover:underline hover:underline-offset-2"
                  >
                    Rastrear mi pedido
                  </Link>
                </li>
                <li>
                  <Link
                    to="/favoritos"
                    className="inline-flex items-center gap-1 transition hover:text-amber-200 hover:underline hover:underline-offset-2"
                  >
                    <Heart className="h-3.5 w-3.5" /> Mi lista de deseos
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Métodos de pago */}
            <section aria-labelledby="footer-pagos-title">
              <h2
                id="footer-pagos-title"
                className="flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-amber-300"
              >
                <CreditCard className="h-4 w-4" /> Métodos de Pago
              </h2>

              <ul className="mt-3 grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <li
                    key={method.label}
                    className={`rounded-xl px-2.5 py-2 shadow-sm ring-2 ${method.className}`}
                  >
                    <span className="block text-xs font-black leading-tight">
                      {method.label}
                    </span>
                    <span className="block text-[9px] font-semibold opacity-85">
                      {method.detail}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-2 rounded-xl bg-white/10 px-2.5 py-2 text-[11px] font-semibold leading-snug text-amber-50/85 ring-1 ring-white/10">
                También aceptamos pago contra entrega en Lima Metropolitana.
              </p>
            </section>

            {/* Horarios y contacto */}
            <section aria-labelledby="footer-horarios-title">
              <h2
                id="footer-horarios-title"
                className="flex items-center gap-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-amber-300"
              >
                <Clock className="h-4 w-4" /> Horarios Navideños
              </h2>

              <ul className="mt-3 space-y-1.5 text-xs font-semibold text-amber-50/85">
                {STORE_CONTACT.hours.map((item) => (
                  <li
                    key={item.day}
                    className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 last:border-0"
                  >
                    <span>{item.day}</span>
                    <span className="shrink-0 font-black text-amber-200">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>

              <ul className="mt-4 space-y-2 text-xs font-semibold text-amber-50/85">
                <li>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={STORE_CONTACT.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Escribir por WhatsApp al ${STORE_CONTACT.phoneDisplay} (se abre en una pestaña nueva)`}
                      className={`${interactiveClass} items-center`}
                    >
                      <WhatsApp className="h-4 w-4 shrink-0 text-emerald-300" />
                      {STORE_CONTACT.phoneDisplay}
                    </a>
                    <CopyButton
                      label="Copiar número de WhatsApp"
                      onClick={handleCopyPhone}
                    />
                  </div>
                </li>

                <li>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setContactOpen(true)}
                      aria-haspopup="dialog"
                      className={`${interactiveClass} items-center`}
                    >
                      <Mail className="h-4 w-4 shrink-0 text-amber-300" />
                      {STORE_CONTACT.email}
                    </button>
                    <CopyButton
                      label="Copiar correo electrónico"
                      onClick={handleCopyEmail}
                    />
                  </div>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={() => setLocationOpen(true)}
                    aria-haspopup="dialog"
                    className={`${interactiveClass} items-start text-left`}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    {STORE_CONTACT.address}
                  </button>
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-5 text-[11px] font-semibold text-amber-50/70 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} Mi Juguetería S.A.C. · Todos los derechos reservados.
            </p>
            <p className="inline-flex items-center gap-1.5">
              Hecho con <Heart className="h-3.5 w-3.5 text-rose-300" /> y magia
              navideña en Perú
            </p>
          </div>
        </div>
      </footer>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      {locationOpen && (
        <StoreLocationModal onClose={() => setLocationOpen(false)} />
      )}
    </>
  )
}
