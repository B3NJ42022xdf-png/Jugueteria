import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChristmasTree, Star, X } from './icons.jsx'

const BANNER_DURATION = 20000

/** Fecha oficial del concurso: 24 de diciembre a las 00:00, hora local. */
function getEventTarget(now = new Date()) {
  const year = now.getFullYear()
  const end = new Date(year, 11, 25, 23, 59, 59)

  return now > end
    ? new Date(year + 1, 11, 24, 0, 0, 0)
    : new Date(year, 11, 24, 0, 0, 0)
}

function getRemaining() {
  const now = new Date()
  const target = getEventTarget(now)
  const diff = Math.max(0, target.getTime() - now.getTime())

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    live: diff === 0,
    eventYear: target.getFullYear(),
  }
}

const pad = (value) => String(value).padStart(2, '0')

/**
 * Banner temporal con la cuenta regresiva oficial del concurso.
 *
 * Aparece en la parte superior, actualiza el conteo cada segundo y se oculta
 * solo a los 20 segundos o cuando el usuario lo cierra. El conteo es
 * `aria-hidden` para no saturar al lector de pantalla; el texto fijo anuncia
 * las fechas del evento.
 */
export default function ContestBanner({ onClose }) {
  const [remaining, setRemaining] = useState(() => getRemaining())
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(getRemaining())
    }, 1000)

    const timer = window.setTimeout(() => {
      onCloseRef.current?.()
    }, BANNER_DURATION)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timer)
    }
  }, [])

  const units = [
    { label: 'Días', value: remaining.days },
    { label: 'Horas', value: remaining.hours },
    { label: 'Min', value: remaining.minutes },
    { label: 'Seg', value: remaining.seconds },
  ]

  return createPortal(
    <div
      role="region"
      aria-label="Estado del concurso"
      className="animate-banner-drop fixed inset-x-0 top-0 z-[95] overflow-hidden border-b-4 border-amber-300 bg-gradient-to-r from-[#5b1414] via-[#b91c1c] to-[#14532d] text-white shadow-[0_16px_40px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-6">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-300 text-red-900 ring-2 ring-white/30">
          <Star className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-200">
            <ChristmasTree className="h-3 w-3" /> Concurso Especial Navidad
          </p>
          <p className="text-xs font-extrabold leading-snug sm:text-sm">
            {remaining.live
              ? '¡El evento ya está en marcha!'
              : 'Cuenta regresiva oficial'}{' '}
            · 24 y 25 de diciembre de {remaining.eventYear}
          </p>
        </div>

        <div className="flex items-center gap-1" aria-hidden="true">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="min-w-10 rounded-lg bg-white/10 px-1.5 py-1 text-center ring-1 ring-white/15"
            >
              <span className="block font-display text-base font-extrabold leading-none tabular-nums text-amber-200">
                {pad(unit.value)}
              </span>
              <span className="mt-0.5 block text-[8px] font-black uppercase tracking-wide text-amber-50/80">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar banner del concurso"
          className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full bg-white/10 text-amber-50 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <span
        aria-hidden="true"
        className="toast-progress absolute bottom-0 left-0 h-1 bg-amber-300/90"
        style={{ animationDuration: `${BANNER_DURATION}ms` }}
      />
    </div>,
    document.body,
  )
}
