import { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ */
/* Cuenta regresiva a Navidad                                          */
/* ------------------------------------------------------------------ */

const pad = (value) => String(value).padStart(2, '0')

function getCountdown() {
  const now = new Date()
  const year = now.getFullYear()
  const christmas = new Date(year, 11, 25, 0, 0, 0)

  // Si ya pasó la Navidad de este año, contamos para la del año siguiente.
  const target =
    now > new Date(year, 11, 25, 23, 59, 59)
      ? new Date(year + 1, 11, 25, 0, 0, 0)
      : christmas

  const isChristmasDay = now.getMonth() === 11 && now.getDate() === 25
  const diff = Math.max(0, target.getTime() - now.getTime())

  return {
    isChristmasDay,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  }
}

export function ChristmasCountdown({ className = '' }) {
  const [time, setTime] = useState(null)

  useEffect(() => {
    const tick = () => setTime(getCountdown())
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const units = time
    ? [
        { label: 'Días', value: pad(time.days) },
        { label: 'Horas', value: pad(time.hours) },
        { label: 'Min', value: pad(time.minutes) },
        { label: 'Seg', value: pad(time.seconds) },
      ]
    : [
        { label: 'Días', value: '--' },
        { label: 'Horas', value: '--' },
        { label: 'Min', value: '--' },
        { label: 'Seg', value: '--' },
      ]

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-3 py-2 backdrop-blur-sm ${className}`}
      aria-label="Cuenta regresiva para Navidad"
    >
      <span className="mr-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-200">
        <span aria-hidden="true">🎄</span>
        {time?.isChristmasDay ? '¡Es Navidad!' : 'Faltan para Navidad'}
      </span>

      {units.map((unit) => (
        <span
          key={unit.label}
          className="flex min-w-[46px] flex-col items-center rounded-xl bg-white/95 px-2 py-1 text-center shadow-sm"
        >
          <span className="font-display text-lg font-extrabold leading-none text-red-700 tabular-nums">
            {unit.value}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
            {unit.label}
          </span>
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Escena de Papá Noel con sus elfos                                   */
/* ------------------------------------------------------------------ */

export function SantaScene({ className = '', compact = false }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative select-none ${className}`}
    >
      <div className="relative flex items-end justify-center gap-1 sm:gap-2">
        <span className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-3 py-1 font-festive text-sm font-bold text-red-700 shadow-lg ring-2 ring-amber-300 sm:text-base">
          ¡Ho, ho, ho!
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
        </span>

        <span className="animate-ho-ho text-5xl drop-shadow-md sm:text-6xl">
          🎅
        </span>

        <span className="animate-swing text-3xl drop-shadow-sm sm:text-4xl">
          🧝
        </span>
        <span className="animate-ho-ho text-4xl drop-shadow-sm [animation-delay:0.6s] sm:text-5xl">
          🎁
        </span>
        <span className="animate-swing text-3xl drop-shadow-sm [animation-delay:0.9s] sm:text-4xl">
          🧝‍♀️
        </span>

        {!compact && (
          <span className="animate-float text-4xl drop-shadow-sm sm:text-5xl">
            🦌
          </span>
        )}
      </div>

      {!compact && (
        <div className="mt-2 flex items-center justify-center gap-3 text-2xl">
          <span className="animate-twinkle">✨</span>
          <span className="animate-float-slow text-xl">🛷</span>
          <span className="animate-twinkle [animation-delay:0.5s]">✨</span>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Guirnalda de luces                                                  */
/* ------------------------------------------------------------------ */

const LIGHT_COLORS = [
  '#f2b705',
  '#dc2626',
  '#22c55e',
  '#3b82f6',
  '#f2b705',
  '#dc2626',
]

export function ChristmasLights({ count = 18, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none flex items-center justify-center gap-2 overflow-hidden ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className="animate-twinkle block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: LIGHT_COLORS[index % LIGHT_COLORS.length],
            boxShadow: `0 0 8px ${LIGHT_COLORS[index % LIGHT_COLORS.length]}`,
            animationDelay: `${(index % 6) * 0.18}s`,
          }}
        />
      ))}
    </div>
  )
}
