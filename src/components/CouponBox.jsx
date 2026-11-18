import { useId, useState } from 'react'
import { useCart } from '../context/cartContext.js'
import { COUPONS, FEATURED_COUPON_CODES } from '../lib/coupons.js'
import { showToast, TOAST_KINDS } from '../lib/toast.js'
import { Check, Ticket, X } from './icons.jsx'

const priceFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatPrice(value) {
  return priceFormatter.format(value)
}

/**
 * Caja de código promocional compartida por el carrito y el checkout.
 *
 * El cupón vive en el contexto del carrito, así que al aplicarlo se actualizan
 * de inmediato el descuento, el envío y el total en toda la aplicación.
 */
export default function CouponBox({ className = '' }) {
  const { coupon, applyCoupon, removeCoupon, savings } = useCart()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const inputId = useId()

  function handleSubmit(event) {
    event.preventDefault()

    const result = applyCoupon(code)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setError('')
    setCode('')
    showToast({
      kind: TOAST_KINDS.COUPON,
      title: result.coupon.code,
      message: `${result.coupon.label}. Revisa tu nuevo total.`,
      href: '/carrito',
      actionLabel: 'Ver mi carrito →',
    })
  }

  if (coupon) {
    return (
      <div
        className={`rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3.5 ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Ticket className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Cupón aplicado
            </p>
            <p className="mt-0.5 truncate font-display text-base font-extrabold text-emerald-900">
              {coupon.code}
            </p>
            <p className="text-xs font-semibold text-emerald-700">
              {coupon.label}
              {savings > 0
                ? ` · Ahorras ${formatPrice(savings)}`
                : ' · Beneficio activo'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              removeCoupon()
              setError('')
            }}
            aria-label={`Quitar cupón ${coupon.code}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-3.5 ${className}`}
    >
      <label
        htmlFor={inputId}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-amber-900"
      >
        <Ticket className="h-4 w-4" /> Código promocional
      </label>

      <div className="mt-2 flex gap-2">
        <input
          id={inputId}
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            if (error) setError('')
          }}
          placeholder="Ej. NAVIDAD20"
          autoComplete="off"
          spellCheck="false"
          className="toy-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide text-slate-700 placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal"
        />
        <button
          type="submit"
          disabled={code.trim().length === 0}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-red-700 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Aplicar
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 animate-shake rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80">
          Prueba:
        </span>
        {FEATURED_COUPON_CODES.map((featuredCode) => (
          <button
            key={featuredCode}
            type="button"
            onClick={() => {
              setCode(featuredCode)
              setError('')
            }}
            title={COUPONS[featuredCode].description}
            className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-black tracking-wide text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {featuredCode}
          </button>
        ))}
      </div>
    </form>
  )
}
