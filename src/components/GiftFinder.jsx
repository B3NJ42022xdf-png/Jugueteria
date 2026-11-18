import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../context/cartContext.js'
import {
  GIFT_AGE_OPTIONS,
  GIFT_BUDGET_OPTIONS,
  GIFT_INTEREST_OPTIONS,
  recommendGifts,
} from '../lib/giftFinder.js'
import { showToast, TOAST_KINDS } from '../lib/toast.js'
import {
  Bolt,
  Check,
  ChristmasTree,
  Gift,
  Heart,
  Puzzle,
  Sparkles,
  Star,
  TeddyBear,
  Ticket,
  Truck,
  X,
} from './icons.jsx'

const priceFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatPrice(value) {
  return priceFormatter.format(value)
}

const INTEREST_ICONS = {
  Peluches: TeddyBear,
  Legos: Puzzle,
  Navidad: ChristmasTree,
  'Juegos de Mesa': Star,
  'Vehículos': Truck,
  Científicos: Bolt,
  'Aire Libre': Sparkles,
  Muñecos: Heart,
  Bebés: Gift,
}

const BUDGET_ICONS = [Ticket, Gift, Sparkles]

const STEP_LABELS = ['Edad', 'Interés', 'Presupuesto']

function OptionButton({ selected, onClick, label, hint, icon: OptionIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex min-h-24 flex-col items-start gap-1.5 rounded-2xl border-2 p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70 ${
        selected
          ? 'border-red-600 bg-red-50 shadow-[0_8px_20px_-12px_rgba(185,28,28,0.65)]'
          : 'border-amber-200 bg-white hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50'
      }`}
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl ring-2 transition ${
          selected
            ? 'bg-red-700 text-white ring-red-200'
            : 'bg-amber-50 text-red-700 ring-amber-100 group-hover:bg-white'
        }`}
      >
        <OptionIcon className="h-5 w-5" />
      </span>
      <span className="font-display text-sm font-extrabold leading-tight text-toy-ink">
        {label}
      </span>
      <span className="text-[11px] font-semibold leading-snug text-slate-500">
        {hint}
      </span>
    </button>
  )
}

/**
 * Modal del "Buscador de Regalos Mágico".
 *
 * Tres pasos (edad, interés y presupuesto) y una pantalla final con los tres
 * juguetes recomendados. Cada recomendación se puede agregar al carrito sin
 * salir del modal.
 */
export default function GiftFinder({ open, onClose, products = [] }) {
  const { addItem } = useCart()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({
    age: '',
    interest: '',
    maxBudget: null,
  })
  const [budgetChosen, setBudgetChosen] = useState(false)
  const [addedIds, setAddedIds] = useState([])
  const [addingId, setAddingId] = useState(null)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector('button, [href], input, select')?.focus()
    }, 60)

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const recommendations = useMemo(
    () => (step === 4 ? recommendGifts(products, answers) : []),
    [step, products, answers],
  )

  const selectedAge = GIFT_AGE_OPTIONS.find(
    (option) => option.value === answers.age,
  )
  const selectedInterest = GIFT_INTEREST_OPTIONS.find(
    (option) => option.value === answers.interest,
  )

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  function chooseAge(value) {
    setAnswers((current) => ({ ...current, age: value }))
  }

  function chooseInterest(value) {
    setAnswers((current) => ({ ...current, interest: value }))
  }

  function chooseBudget(value) {
    setAnswers((current) => ({ ...current, maxBudget: value }))
    setBudgetChosen(true)
  }

  function goNext() {
    if (step === 1 && !answers.age) return
    if (step === 2 && !answers.interest) return
    setStep((current) => Math.min(3, current + 1))
  }

  function showResults() {
    if (!budgetChosen) return
    setStep(4)
  }

  function restart() {
    setStep(1)
    setAnswers({ age: '', interest: '', maxBudget: null })
    setBudgetChosen(false)
    setAddedIds([])
    setError('')
  }

  async function handleAdd(product) {
    if (addingId) return

    setAddingId(product.id)
    setError('')

    try {
      await addItem(product.id, 1)
      setAddedIds((current) =>
        current.includes(product.id) ? current : [...current, product.id],
      )
      showToast({
        kind: TOAST_KINDS.CART,
        title: product.name,
        message: 'Recomendación agregada a tu carrito.',
        image: product.imageUrl ?? product.image,
        href: '/carrito',
        actionLabel: 'Ver carrito →',
      })
    } catch {
      setError('No pudimos agregar este juguete. Intenta de nuevo.')
    } finally {
      setAddingId(null)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/65 px-3 py-6 backdrop-blur-sm"
      onMouseDown={handleBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-finder-title"
        aria-describedby="gift-finder-description"
        className="relative my-auto w-full max-w-3xl animate-pop-in overflow-hidden rounded-[30px] border-[3px] border-amber-200 bg-[#fffaf2] shadow-[0_30px_80px_-24px_rgba(15,23,42,0.7)]"
      >
        <div aria-hidden="true" className="christmas-stripes h-2 w-full" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar buscador de regalos"
          className="absolute right-3 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-amber-100 transition hover:bg-white hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[calc(100dvh-3rem)] overflow-y-auto px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
          <div className="pr-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-900">
              <Sparkles className="h-3.5 w-3.5" /> Asistente navideño
            </span>
            <h2
              id="gift-finder-title"
              className="mt-2 font-festive text-3xl font-bold leading-none tracking-wide text-red-800 sm:text-4xl"
            >
              Buscador de Regalos Mágico
            </h2>
            <p
              id="gift-finder-description"
              className="mt-2 text-sm font-semibold leading-relaxed text-slate-600"
            >
              Responde tres preguntas y te mostramos los 3 juguetes que mejor
              encajan con la edad, el interés y el presupuesto.
            </p>
          </div>

          <ol className="mt-5 flex items-center gap-2" aria-label="Progreso del asistente">
            {STEP_LABELS.map((label, index) => {
              const number = index + 1
              const done = step > number || step === 4
              const active = step === number

              return (
                <li key={label} className="flex flex-1 items-center gap-2">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black transition ${
                      done
                        ? 'bg-emerald-600 text-white'
                        : active
                          ? 'bg-red-700 text-white ring-4 ring-red-100'
                          : 'bg-white text-slate-400 ring-2 ring-amber-200'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : number}
                  </span>
                  <span
                    className={`hidden text-[10px] font-black uppercase tracking-wide sm:block ${
                      active || done ? 'text-red-800' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                  {number < 3 && (
                    <span
                      aria-hidden="true"
                      className={`h-1 flex-1 rounded-full ${
                        done ? 'bg-emerald-300' : 'bg-amber-200'
                      }`}
                    />
                  )}
                </li>
              )
            })}
          </ol>

          <div className="mt-6">
            {step === 1 && (
              <section aria-labelledby="gift-step-age">
                <h3
                  id="gift-step-age"
                  className="font-display text-lg font-extrabold text-toy-ink"
                >
                  ¿Qué edad tiene el niño o la niña?
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {GIFT_AGE_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={answers.age === option.value}
                      onClick={() => chooseAge(option.value)}
                      label={option.label}
                      hint={option.hint}
                      icon={Gift}
                    />
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="gift-step-interest">
                <h3
                  id="gift-step-interest"
                  className="font-display text-lg font-extrabold text-toy-ink"
                >
                  ¿Qué le gusta más?
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {GIFT_INTEREST_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      selected={answers.interest === option.value}
                      onClick={() => chooseInterest(option.value)}
                      label={option.label}
                      hint={option.hint}
                      icon={INTEREST_ICONS[option.value] ?? Gift}
                    />
                  ))}
                </div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="gift-step-budget">
                <h3
                  id="gift-step-budget"
                  className="font-display text-lg font-extrabold text-toy-ink"
                >
                  ¿Cuál es tu presupuesto máximo?
                </h3>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  {GIFT_BUDGET_OPTIONS.map((option, index) => {
                    const Icon = BUDGET_ICONS[index] ?? Ticket

                    return (
                      <OptionButton
                        key={option.label}
                        selected={
                          budgetChosen && answers.maxBudget === option.value
                        }
                        onClick={() => chooseBudget(option.value)}
                        label={option.label}
                        hint={option.hint}
                        icon={Icon}
                      />
                    )
                  })}
                </div>
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                  Los precios están en soles peruanos (S/) e incluyen IGV.
                </p>
              </section>
            )}

            {step === 4 && (
              <section aria-labelledby="gift-step-results">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3
                      id="gift-step-results"
                      className="font-display text-lg font-extrabold text-toy-ink"
                    >
                      Tus 3 regalos recomendados
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {selectedAge?.label} · {selectedInterest?.label} ·{' '}
                      {answers.maxBudget == null
                        ? 'Sin límite de presupuesto'
                        : `Hasta ${formatPrice(answers.maxBudget)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={restart}
                    className="text-xs font-extrabold text-red-700 underline-offset-4 transition hover:text-red-500 hover:underline"
                  >
                    Volver a empezar
                  </button>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-3 animate-shake rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                  >
                    {error}
                  </p>
                )}

                {recommendations.length === 0 ? (
                  <p className="mt-4 rounded-2xl border-2 border-dashed border-amber-200 bg-white p-5 text-center text-sm font-semibold text-slate-500">
                    No encontramos juguetes con esos criterios. Prueba con otro
                    interés o presupuesto.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {recommendations.map(({ product, overBudget }) => {
                      const added = addedIds.includes(product.id)
                      const adding = addingId === product.id

                      return (
                        <li
                          key={product.id}
                          className="flex flex-col gap-3 rounded-2xl border-2 border-amber-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
                        >
                          <img
                            src={product.imageUrl ?? product.image}
                            alt={product.name}
                            width="96"
                            height="96"
                            loading="lazy"
                            decoding="async"
                            className="h-20 w-20 shrink-0 rounded-xl object-cover ring-2 ring-amber-100"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-wide text-red-700">
                              {product.category} · {product.ageRange} años
                            </p>
                            <p className="truncate font-display text-base font-extrabold text-toy-ink">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-sm font-black tabular-nums text-slate-800">
                              {formatPrice(product.price)}
                            </p>
                            {overBudget && (
                              <p className="mt-1 text-[10px] font-bold text-amber-700">
                                Supera tu presupuesto por{' '}
                                {formatPrice(product.price - answers.maxBudget)}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdd(product)}
                            disabled={adding || added}
                            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70 ${
                              added
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-700 text-white shadow-sm hover:bg-red-800 disabled:cursor-wait disabled:opacity-70'
                            }`}
                          >
                            {added ? (
                              <>
                                <Check className="h-4 w-4" /> ¡Agregado!
                              </>
                            ) : adding ? (
                              'Agregando…'
                            ) : (
                              <>
                                <Gift className="h-4 w-4" /> Agregar
                              </>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/70 pt-4">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1 || step === 4}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-amber-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:invisible"
            >
              ← Atrás
            </button>

            {step < 3 && (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  (step === 1 && !answers.age) ||
                  (step === 2 && !answers.interest)
                }
                className="christmas-btn inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar →
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={showResults}
                disabled={!budgetChosen}
                className="christmas-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" /> Ver mis 3 regalos
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={onClose}
                className="christmas-btn inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
              >
                Seguir comprando
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
