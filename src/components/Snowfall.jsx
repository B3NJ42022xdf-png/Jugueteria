import { useMemo } from 'react'

/**
 * Generador pseudoaleatorio determinista. Los copos deben conservar su
 * posición entre renders, por eso no usamos Math.random() durante el render.
 */
function seededRandom(seed) {
  const value = Math.sin(seed * 91.7) * 43758.5453
  return value - Math.floor(value)
}

const FLAKES = 58
const GLYPHS = ['❄', '❅', '❆', '•']

/**
 * Nieve animada global. Es un overlay fijo que no captura clics y queda por
 * encima del contenido para dar la sensación de que está nevando en toda la
 * tienda. Con `prefers-reduced-motion` las animaciones globales se desactivan
 * y los copos desaparecen solos.
 */
export default function Snowfall({ className = '' }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: FLAKES }, (_, index) => {
        const seed = index + 1
        const size = 8 + seededRandom(seed + 3) * 14
        return {
          id: index,
          left: seededRandom(seed) * 100,
          delay: -seededRandom(seed + 7) * 18,
          duration: 9 + seededRandom(seed + 13) * 12,
          drift: (seededRandom(seed + 17) - 0.5) * 140,
          spin: 180 + seededRandom(seed + 23) * 540,
          opacity: 0.45 + seededRandom(seed + 29) * 0.5,
          size,
          glyph: GLYPHS[index % GLYPHS.length],
          // Los copos grandes se ocultan en móvil para no saturar la pantalla.
          hideOnMobile: index % 3 === 0,
        }
      }),
    [],
  )

  return (
    <div className={`snow-layer ${className}`} aria-hidden="true">
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className={`snow-flake select-none ${
            flake.hideOnMobile ? 'hidden sm:block' : ''
          }`}
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            '--snow-drift': `${flake.drift}px`,
            '--snow-spin': `${flake.spin}deg`,
            '--snow-opacity': flake.opacity,
          }}
        >
          {flake.glyph}
        </span>
      ))}
    </div>
  )
}
