/**
 * Código QR simulado, generado localmente sin dependencias.
 *
 * No codifica información real: dibuja los tres cuadrados de localización de
 * un QR y rellena el resto con un patrón determinista derivado de `value`.
 * Así el mismo comprobante siempre muestra el mismo código, incluso al
 * imprimirlo, y no se realiza ninguna petición externa.
 */

const QR_SIZE = 25

function finderValue(x, y) {
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

function hashSeed(value) {
  const text = String(value ?? '')
  let hash = 2166136261

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function mulberry32(seed) {
  let state = seed >>> 0

  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export default function SimulatedQr({
  value = '',
  className = 'h-40 w-40',
  tone = '#14532d',
  label = 'Código QR simulado',
}) {
  const random = mulberry32(hashSeed(value))
  const cells = []

  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      const finder = finderValue(x, y)
      const on = finder === null ? random() > 0.5 : finder

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
      aria-label={label}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <rect width={QR_SIZE} height={QR_SIZE} fill="#ffffff" />
      <g fill={tone}>{cells}</g>
    </svg>
  )
}
