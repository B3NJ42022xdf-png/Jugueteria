import { useMemo } from 'react'

const CONFETTI_COLORS = [
  '#dc2626',
  '#14532d',
  '#f2b705',
  '#f8fbff',
  '#b91c1c',
  '#22c55e',
  '#fbbf24',
]

/**
 * Generador pseudoaleatorio determinista: mismo valor en cada render para
 * que las piezas del confeti no salten cuando React vuelve a renderizar.
 */
function seededRandom(seed) {
  const value = Math.sin(seed * 127.1) * 43758.5453
  return value - Math.floor(value)
}

/**
 * Lluvia de confeti para celebrar el registro y el inicio de sesión.
 * Es puramente decorativo (`aria-hidden`) y no bloquea clics.
 * Con `prefers-reduced-motion` las animaciones globales se desactivan,
 * por lo que las piezas quedan invisibles sin necesidad de código extra.
 */
export default function ToyConfetti({ count = 46, className = '' }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: seededRandom(index + 1) * 100,
        delay: seededRandom(index + 11) * 0.8,
        duration: 2.2 + seededRandom(index + 21) * 1.8,
        drift: (seededRandom(index + 31) - 0.5) * 200,
        spin: 360 + seededRandom(index + 41) * 720,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        size: 6 + seededRandom(index + 51) * 8,
        round: seededRandom(index + 61) > 0.55,
      })),
    [count],
  )

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.round ? piece.size : piece.size * 1.7}px`,
            backgroundColor: piece.color,
            borderRadius: piece.round ? '9999px' : '3px',
            opacity: 0,
            animation: `toyConfettiFall ${piece.duration}s linear ${piece.delay}s forwards`,
            '--confetti-drift': `${piece.drift}px`,
            '--confetti-spin': `${piece.spin}deg`,
          }}
        />
      ))}
    </div>
  )
}
