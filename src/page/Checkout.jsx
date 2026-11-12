import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader.jsx'
import { useCart } from '../context/cartContext.js'
import {
  calculateShipping,
  FREE_SHIPPING_FROM,
} from '../lib/cartTotals.js'
import { getSession } from '../services/authService.js'
import {
  downloadReceiptPdf,
  downloadReceiptXml,
  issueReceipt,
} from '../services/receiptService.js'
import { validateCartStock } from '../services/storeService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(value) {
  return priceFormatter.format(value)
}

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function formatCardNumber(value) {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function ArrowLeftIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
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

function AlertIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.3 3.6 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
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

function CardIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </svg>
  )
}

function WalletIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10 18h4" />
    </svg>
  )
}

function CashIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10v4" />
      <path d="M18 10v4" />
    </svg>
  )
}

function PrintIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  )
}

function DownloadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* QR simulado para Yape / Plin                                        */
/* ------------------------------------------------------------------ */

const QR_SIZE = 25

function qrFinderValue(x, y) {
  const boxes = [
    [0, 0],
    [QR_SIZE - 7, 0],
    [0, QR_SIZE - 7],
  ]

  for (const [boxX, boxY] of boxes) {
    if (x >= boxX && x < boxX + 7 && y >= boxY && y < boxY + 7) {
      const dx = x - boxX
      const dy = y - boxY
      const border = dx === 0 || dx === 6 || dy === 0 || dy === 6
      const center = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
      return border || center
    }
  }

  return null
}

function SimulatedQr({ className = 'h-40 w-40' }) {
  const cells = []

  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      const finder = qrFinderValue(x, y)
      const on = finder ?? ((x * 13 + y * 7 + x * y) % 9 < 4)

      if (on) {
        cells.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            rx="0.12"
          />,
        )
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
      className={className}
      role="img"
      aria-label="Código QR simulado para pagar con Yape o Plin"
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect width={QR_SIZE} height={QR_SIZE} fill="#ffffff" />
      <g fill="#14532d">{cells}</g>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas de interfaz                                                  */
/* ------------------------------------------------------------------ */

const STEPS = [
  { number: 1, label: 'Datos' },
  { number: 2, label: 'Pago' },
  { number: 3, label: 'Comprobante' },
]

function StepIndicator({ step }) {
  return (
    <ol className="mt-6 flex items-center gap-2 sm:gap-3" aria-label="Pasos del checkout">
      {STEPS.map((item, index) => {
        const done = step > item.number
        const active = step === item.number

        return (
          <li key={item.number} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              aria-current={active ? 'step' : undefined}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ring-2 transition ${
                done
                  ? 'bg-emerald-600 text-white ring-emerald-200'
                  : active
                    ? 'bg-red-700 text-white ring-amber-300'
                    : 'bg-white text-slate-400 ring-amber-100'
              }`}
            >
              {done ? <CheckIcon /> : item.number}
            </span>
            <span
              className={`hidden text-xs font-black uppercase tracking-wide sm:inline ${
                active ? 'text-red-800' : done ? 'text-emerald-700' : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-1 flex-1 rounded-full ${
                  step > item.number ? 'bg-emerald-400' : 'bg-amber-100'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Feedback({ feedback }) {
  if (!feedback) return null

  return (
    <div
      role={feedback.type === 'success' ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold ${
        feedback.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : feedback.type === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-rose-200 bg-rose-50 text-rose-700'
      }`}
    >
      {feedback.type === 'success' ? (
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="min-w-0">{feedback.text}</span>
    </div>
  )
}

function OrderSummary({ items, subtotal, shipping, total, itemCount }) {
  return (
    <section
      aria-labelledby="checkout-resumen-title"
      className="toy-panel rounded-3xl p-5"
    >
      <h2
        id="checkout-resumen-title"
        className="font-display text-lg font-extrabold text-toy-ink"
      >
        Tu pedido
      </h2>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">
        {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
      </p>

      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <img
              src={item.product.imageUrl ?? item.product.image}
              alt=""
              width="48"
              height="48"
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-amber-100"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-toy-ink">
                {item.product.name}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 text-xs font-black tabular-nums text-toy-ink">
              {formatPrice(item.subtotal)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t-2 border-dashed border-amber-200 pt-4 text-sm">
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
        <div className="flex items-end justify-between gap-3 border-t border-amber-100 pt-3">
          <dt className="font-display text-base font-extrabold text-toy-ink">
            Total a pagar
          </dt>
          <dd className="font-display text-2xl font-extrabold tracking-tight text-red-700">
            {formatPrice(total)}
          </dd>
        </div>
      </dl>

      {subtotal > 0 && subtotal < FREE_SHIPPING_FROM && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
          Te faltan {formatPrice(FREE_SHIPPING_FROM - subtotal)} para el envío gratis.
        </p>
      )}

      <p className="mt-4 flex items-start gap-1.5 text-left text-[11px] leading-relaxed text-slate-400">
        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0">
          Compra protegida. Tus datos se usan solo para el envío y el comprobante.
        </span>
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Página: checkout en 3 pasos                                         */
/* ------------------------------------------------------------------ */

export default function Checkout() {
  const { items, itemCount, subtotal, completePurchase } = useCart()
  const [session] = useState(() => getSession())

  const [step, setStep] = useState(1)
  const [receiptType, setReceiptType] = useState('boleta')
  const [fullName, setFullName] = useState(
    () => session?.fullName ?? session?.name ?? '',
  )
  const [documentId, setDocumentId] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [ruc, setRuc] = useState('')
  const [fiscalAddress, setFiscalAddress] = useState('')
  const [email, setEmail] = useState(() => session?.email ?? '')
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [purchasedItems, setPurchasedItems] = useState([])
  const [stockInfo, setStockInfo] = useState({})

  const isFactura = receiptType === 'factura'
  const shipping = calculateShipping(subtotal, itemCount)
  const total = subtotal + shipping

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

  // Revalida el stock al entrar al checkout para no confirmar sobre datos viejos.
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

  const stockProblems = Object.values(stockInfo).filter(
    (info) => info.insufficient,
  )

  function validateDetails() {
    if (isFactura) {
      if (businessName.trim().length < 3) {
        return 'Ingresa la razón social de la empresa.'
      }
      if (!/^\d{11}$/.test(digitsOnly(ruc))) {
        return 'El RUC debe tener exactamente 11 dígitos.'
      }
      if (fiscalAddress.trim().length < 8) {
        return 'Ingresa una dirección fiscal válida.'
      }
    } else {
      if (fullName.trim().length < 3) {
        return 'Ingresa tu nombre completo.'
      }
      const document = digitsOnly(documentId)
      if (document.length < 6 || document.length > 12) {
        return 'Ingresa un DNI / documento válido (6 a 12 dígitos).'
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Ingresa un correo electrónico válido.'
    }

    if (shippingAddress.trim().length < 8) {
      return 'Ingresa una dirección de envío válida.'
    }

    return null
  }

  function validatePayment() {
    if (paymentMethod !== 'card') return null

    const digits = digitsOnly(cardNumber)
    if (digits.length < 13 || digits.length > 19) {
      return 'Ingresa un número de tarjeta válido (13 a 19 dígitos).'
    }

    const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(cardExpiry.trim())
    if (!expiryMatch) {
      return 'Ingresa el vencimiento en formato MM/AA.'
    }

    const month = Number(expiryMatch[1])
    const year = 2000 + Number(expiryMatch[2])
    const now = new Date()

    if (month < 1 || month > 12) {
      return 'El mes de vencimiento no es válido.'
    }

    if (
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1)
    ) {
      return 'La tarjeta está vencida.'
    }

    if (!/^\d{3,4}$/.test(cardCvv)) {
      return 'Ingresa un CVV de 3 o 4 dígitos.'
    }

    return null
  }

  function buildPaymentLabel() {
    if (paymentMethod === 'card') {
      return `Tarjeta de crédito/débito ···· ${digitsOnly(cardNumber).slice(-4)}`
    }
    if (paymentMethod === 'wallet') {
      return 'Yape / Plin (QR)'
    }
    return 'Pago contra entrega'
  }

  function handleContinueToPayment() {
    const error = validateDetails()
    if (error) {
      setFeedback({ type: 'error', text: error })
      return
    }

    setFeedback(null)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBackToDetails() {
    setFeedback(null)
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleConfirm() {
    if (checkingOut) return

    const detailsError = validateDetails()
    if (detailsError) {
      setStep(1)
      setFeedback({ type: 'error', text: detailsError })
      return
    }

    const paymentError = validatePayment()
    if (paymentError) {
      setFeedback({ type: 'error', text: paymentError })
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
        setStep(1)
        return
      }

      const customerName = isFactura ? businessName : fullName
      const taxId = isFactura ? digitsOnly(ruc) : digitsOnly(documentId)
      const billingAddress = isFactura ? fiscalAddress : shippingAddress

      const issued = await issueReceipt({
        items,
        type: receiptType,
        customer: {
          name: customerName.trim(),
          email: email.trim(),
          taxId,
        },
        shipping,
        shippingAddress: shippingAddress.trim(),
        billingAddress: billingAddress.trim(),
        paymentMethod: buildPaymentLabel(),
      })

      // Guardamos los artículos antes de vaciar el carrito para poder mostrar
      // sus miniaturas en el comprobante de éxito.
      setPurchasedItems(items)
      setReceipt(issued)
      completePurchase(snapshot)
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

  function handlePrint() {
    window.print()
  }

  /* --------------------------- Pantalla de éxito --------------------------- */

  if (receipt) {
    return (
      <div className="toy-dots flex min-h-screen flex-col bg-toy-cream text-toy-ink">
        <StoreHeader />

        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <section className="no-print overflow-hidden rounded-[32px] border-[3px] border-amber-300 bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#14532d] px-6 py-8 text-center text-white shadow-[0_28px_60px_-30px_rgba(127,29,29,0.8)]">
              <span
                aria-hidden="true"
                className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-300 text-3xl shadow-lg"
              >
                🎄
              </span>
              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-amber-200">
                Pedido confirmado
              </p>
              <h1 className="mt-1 font-festive text-3xl font-bold tracking-wide text-white sm:text-4xl">
                ¡Gracias por tu compra navideña!
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-amber-50/90">
                Tu comprobante fue emitido y enviado a{' '}
                <span className="font-black text-white">{receipt.customer.email}</span>.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-mono text-base font-black tracking-wide text-white ring-1 ring-white/30">
                #{receipt.orderCode}
              </p>
            </section>

            <div className="no-print mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-3 text-sm font-black text-red-950 shadow-[0_5px_0_#b7791f] transition hover:-translate-y-0.5 hover:from-amber-200 hover:to-amber-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/80"
              >
                <PrintIcon />
                Imprimir / Descargar comprobante
              </button>
              <button
                type="button"
                onClick={() => downloadReceiptPdf(receipt)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-white px-5 py-3 text-sm font-extrabold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              >
                <DownloadIcon />
                Descargar PDF
              </button>
              <button
                type="button"
                onClick={() => downloadReceiptXml(receipt)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                <DownloadIcon />
                XML
              </button>
            </div>

            <article className="print-receipt toy-panel mt-6 rounded-3xl p-5 sm:p-7">
              <header className="flex flex-col gap-4 border-b-2 border-dashed border-amber-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-700 to-amber-400 text-2xl shadow-md">
                    🎁
                  </span>
                  <div>
                    <p className="font-display text-lg font-extrabold text-toy-ink">
                      Mi Juguetería S.A.S.
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Juguetería y artículos de entretenimiento
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      NIT 900.123.456-7 · Régimen común
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-700 ring-1 ring-red-200">
                    {receipt.typeLabel} electrónica
                  </span>
                  <p className="mt-2 font-mono text-lg font-black text-toy-ink">
                    #{receipt.orderCode}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Comprobante {receipt.number}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(receipt.issuedAt)}
                  </p>
                </div>
              </header>

              <section className="mt-5 grid gap-4 rounded-2xl bg-amber-50/70 p-4 ring-1 ring-amber-100 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    {isFactura ? 'Razón social' : 'Cliente'}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-toy-ink">
                    {receipt.customer.name}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {receipt.customer.taxIdLabel}: {receipt.customer.taxId || 'No informado'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Correo
                  </p>
                  <p className="mt-0.5 break-all text-sm font-semibold text-slate-700">
                    {receipt.customer.email}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Pago: {receipt.payment?.method}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Dirección de envío
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {receipt.shippingAddress || 'No informada'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    {isFactura ? 'Dirección fiscal' : 'Documento'}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {isFactura
                      ? receipt.billingAddress || 'No informada'
                      : `${receipt.customer.taxIdLabel} ${receipt.customer.taxId}`}
                  </p>
                </div>
              </section>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-100 text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="w-8 py-2 pr-2 font-black">#</th>
                      <th className="py-2 pr-3 font-black">Juguete</th>
                      <th className="py-2 pr-3 text-right font-black">Cant.</th>
                      <th className="py-2 pr-3 text-right font-black">P. unit.</th>
                      <th className="py-2 text-right font-black">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item, index) => (
                      <tr
                        key={`${item.productId}-${item.index}`}
                        className="border-b border-amber-50 last:border-0"
                      >
                        <td className="py-3 pr-2 align-top text-xs text-slate-400">
                          {item.index}
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <div className="flex items-center gap-2.5">
                            {purchasedItems[index]?.product?.imageUrl && (
                              <img
                                src={purchasedItems[index].product.imageUrl}
                                alt=""
                                width="36"
                                height="36"
                                className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-amber-100"
                              />
                            )}
                            <div>
                              <p className="font-extrabold text-toy-ink">{item.name}</p>
                              {item.brand && (
                                <p className="text-[11px] text-slate-400">{item.brand}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-right align-top tabular-nums text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="py-3 pr-3 text-right align-top tabular-nums text-slate-600">
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className="py-3 text-right align-top font-extrabold tabular-nums text-toy-ink">
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
                  <div className="flex items-end justify-between gap-3 border-t-2 border-amber-100 pt-3">
                    <dt className="font-display text-base font-extrabold text-toy-ink">
                      Total pagado
                    </dt>
                    <dd className="font-display text-xl font-extrabold tracking-tight text-red-700">
                      {formatPrice(receipt.totals.total)}
                    </dd>
                  </div>
                </dl>
              </div>

              <footer className="mt-6 border-t border-dashed border-amber-200 pt-4 text-center text-[10px] leading-relaxed text-slate-400">
                <p>Código de verificación: {receipt.verificationCode}</p>
                <p className="mt-1">
                  Comprobante electrónico generado automáticamente. Documento de
                  demostración.
                </p>
              </footer>
            </article>

            <div className="no-print mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/catalogo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
              >
                Volver al catálogo
                <ArrowRightIcon />
              </Link>
              <Link
                to={`/orden/${receipt.id}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-white px-6 py-3 text-sm font-extrabold text-red-800 transition hover:-translate-y-0.5 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
              >
                Ver detalle del pedido
              </Link>
            </div>
          </div>
        </main>

        <footer className="no-print border-t border-amber-200 bg-white py-6 text-center text-xs text-slate-400">
          Mi Juguetería · Juguetes seguros para cada etapa
        </footer>
      </div>
    )
  }

  /* --------------------------- Carrito vacío --------------------------- */

  if (items.length === 0) {
    return (
      <div className="toy-dots flex min-h-screen flex-col bg-toy-cream text-toy-ink">
        <StoreHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white text-4xl shadow-md ring-2 ring-amber-100">
              🎁
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-toy-ink sm:text-3xl">
              No hay artículos para pagar
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
              Agrega juguetes al carrito para continuar con el pago.
            </p>
            <Link
              to="/catalogo"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-red-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              Explorar juguetes
              <ArrowRightIcon />
            </Link>
          </div>
        </main>
      </div>
    )
  }

  /* --------------------------- Pasos 1 y 2 --------------------------- */

  return (
    <div className="toy-dots flex min-h-screen flex-col bg-toy-cream text-toy-ink">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav
            aria-label="Ruta de navegación"
            className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 sm:text-sm"
          >
            <Link to="/catalogo" className="transition hover:text-red-700">
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/carrito" className="transition hover:text-red-700">
              Mi carrito
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-toy-ink" aria-current="page">
              Checkout
            </span>
          </nav>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-toy-ink sm:text-3xl">
                {step === 1 ? 'Datos de envío y facturación' : 'Método de pago'}
              </h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {step === 1
                  ? 'Completa tus datos y elige cómo quieres tu comprobante.'
                  : 'Selecciona cómo prefieres pagar tu pedido navideño.'}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-red-700 ring-2 ring-amber-100">
              🎄 Compra segura
            </span>
          </div>

          <StepIndicator step={step} />

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="space-y-4">
              <Feedback feedback={feedback} />

              {stockProblems.length > 0 && (
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
                        {stockProblems.map((info) => (
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

              {step === 1 && (
                <section className="toy-panel rounded-3xl p-5 sm:p-6">
                  <h2 className="font-display text-lg font-extrabold text-toy-ink">
                    1. Tipo de comprobante
                  </h2>

                  <div
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                    role="group"
                    aria-label="Tipo de comprobante"
                  >
                    {[
                      {
                        value: 'boleta',
                        label: 'Boleta',
                        hint: 'Persona natural · DNI',
                        icon: '🧾',
                      },
                      {
                        value: 'factura',
                        label: 'Factura',
                        hint: 'Empresa · RUC 11 dígitos',
                        icon: '🏢',
                      },
                    ].map((option) => {
                      const active = receiptType === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setReceiptType(option.value)
                            setFeedback(null)
                          }}
                          aria-pressed={active}
                          className={`flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition ${
                            active
                              ? 'border-red-500 bg-red-50 ring-4 ring-red-100'
                              : 'border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/60'
                          }`}
                        >
                          <span className="text-2xl" aria-hidden="true">
                            {option.icon}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block font-display text-base font-extrabold ${
                                active ? 'text-red-800' : 'text-toy-ink'
                              }`}
                            >
                              {option.label}
                            </span>
                            <span className="block text-[11px] font-semibold text-slate-500">
                              {option.hint}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <h2 className="mt-6 font-display text-lg font-extrabold text-toy-ink">
                    2. {isFactura ? 'Datos de la empresa' : 'Tus datos'}
                  </h2>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {isFactura ? (
                      <>
                        <label className="block sm:col-span-2">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Razón social *
                          </span>
                          <input
                            type="text"
                            value={businessName}
                            onChange={(event) => setBusinessName(event.target.value)}
                            placeholder="Juguetes del Polo Norte S.A.C."
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            RUC (11 dígitos) *
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={ruc}
                            onChange={(event) =>
                              setRuc(digitsOnly(event.target.value).slice(0, 11))
                            }
                            placeholder="20123456789"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-800"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Dirección fiscal *
                          </span>
                          <input
                            type="text"
                            value={fiscalAddress}
                            onChange={(event) => setFiscalAddress(event.target.value)}
                            placeholder="Av. Navidad 123, oficina 4"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="block">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Nombre completo *
                          </span>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="María Fernanda López"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            DNI / Documento *
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={documentId}
                            onChange={(event) =>
                              setDocumentId(digitsOnly(event.target.value).slice(0, 12))
                            }
                            placeholder="70123456"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-800"
                          />
                        </label>
                      </>
                    )}

                    <label className="block sm:col-span-2">
                      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                        Correo electrónico *
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800"
                      />
                      <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                        Aquí enviaremos el comprobante en PDF y XML.
                      </span>
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                        Dirección de envío *
                      </span>
                      <input
                        type="text"
                        value={shippingAddress}
                        onChange={(event) => setShippingAddress(event.target.value)}
                        placeholder="Calle del Trineo 456, dpto. 2, Lima"
                        className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800"
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <Link
                      to="/carrito"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:-translate-y-0.5 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                    >
                      <ArrowLeftIcon />
                      Volver al carrito
                    </Link>

                    <button
                      type="button"
                      onClick={handleContinueToPayment}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-red-600 to-red-800 px-5 py-3 text-sm font-black text-white shadow-[0_5px_0_#7f1d1d] transition hover:-translate-y-0.5 hover:from-red-500 hover:to-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
                    >
                      Continuar al pago
                      <ArrowRightIcon />
                    </button>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="toy-panel rounded-3xl p-5 sm:p-6">
                  <h2 className="font-display text-lg font-extrabold text-toy-ink">
                    Elige tu método de pago
                  </h2>

                  <div className="mt-3 grid gap-3" role="radiogroup" aria-label="Método de pago">
                    {[
                      {
                        value: 'card',
                        label: 'Tarjeta de crédito / débito',
                        hint: 'Visa, Mastercard, Amex',
                        icon: <CardIcon className="h-5 w-5" />,
                      },
                      {
                        value: 'wallet',
                        label: 'Yape / Plin',
                        hint: 'Paga escaneando el QR',
                        icon: <WalletIcon className="h-5 w-5" />,
                      },
                      {
                        value: 'cash',
                        label: 'Pago contra entrega',
                        hint: 'Pagas al recibir tu pedido',
                        icon: <CashIcon className="h-5 w-5" />,
                      },
                    ].map((option) => {
                      const active = paymentMethod === option.value

                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 transition ${
                            active
                              ? 'border-red-500 bg-red-50 ring-4 ring-red-100'
                              : 'border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment-method"
                            value={option.value}
                            checked={active}
                            onChange={() => {
                              setPaymentMethod(option.value)
                              setFeedback(null)
                            }}
                            className="mt-1 h-4 w-4 accent-red-700"
                          />
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-red-700 ring-1 ring-amber-200">
                            {option.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-toy-ink">
                              {option.label}
                            </span>
                            <span className="block text-[11px] font-semibold text-slate-500">
                              {option.hint}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="mt-4 rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Número de tarjeta *
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardNumber}
                            onChange={(event) =>
                              setCardNumber(formatCardNumber(event.target.value))
                            }
                            placeholder="4111 1111 1111 1111"
                            autoComplete="off"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-800"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Vencimiento (MM/AA) *
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardExpiry}
                            onChange={(event) =>
                              setCardExpiry(formatExpiry(event.target.value))
                            }
                            placeholder="12/28"
                            autoComplete="off"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-800"
                          />
                        </label>

                        <label className="block">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            CVV *
                          </span>
                          <input
                            type="password"
                            inputMode="numeric"
                            value={cardCvv}
                            onChange={(event) =>
                              setCardCvv(digitsOnly(event.target.value).slice(0, 4))
                            }
                            placeholder="123"
                            autoComplete="off"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-800"
                          />
                        </label>

                        <label className="block sm:col-span-2">
                          <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Titular de la tarjeta
                          </span>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(event) => setCardHolder(event.target.value)}
                            placeholder="Como aparece en la tarjeta"
                            autoComplete="off"
                            className="toy-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800"
                          />
                        </label>
                      </div>

                      <p className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-slate-500">
                        <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="min-w-0">
                          Simulación segura: no guardamos el número ni el CVV de tu
                          tarjeta.
                        </span>
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-5 text-center">
                      <SimulatedQr />
                      <p className="text-sm font-extrabold text-toy-ink">
                        Escanea el QR con Yape o Plin
                      </p>
                      <p className="max-w-xs text-[11px] font-semibold text-slate-500">
                        Código simulado para esta demostración. Al confirmar, el
                        pedido quedará registrado como pagado.
                      </p>
                      <p className="font-mono text-xs font-black tracking-wider text-red-700">
                        MIJUGUETERIA-NAV-2026
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="mt-4 rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-5">
                      <p className="flex items-center gap-2 text-sm font-extrabold text-toy-ink">
                        <TruckIcon className="h-5 w-5 text-red-700" />
                        Pagas cuando recibas tu pedido
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        Ten listo el monto exacto de {formatPrice(total)}. El
                        repartidor navideño te entregará tu comprobante impreso.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={handleBackToDetails}
                      disabled={checkingOut}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:-translate-y-0.5 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ArrowLeftIcon />
                      Volver a datos
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={checkingOut}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-[0_5px_0_#065f46] transition hover:-translate-y-0.5 hover:from-emerald-400 hover:to-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-wait disabled:opacity-70"
                    >
                      {checkingOut ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Emitiendo comprobante…
                        </>
                      ) : (
                        <>
                          Confirmar pago · {formatPrice(total)}
                          <ArrowRightIcon />
                        </>
                      )}
                    </button>
                  </div>
                </section>
              )}
            </div>

            <aside className="lg:sticky lg:top-24">
              <OrderSummary
                items={items}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                itemCount={itemCount}
              />
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-amber-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Juguetes seguros para cada etapa
      </footer>
    </div>
  )
}
