const TOYS = [
  { emoji: '🎅', className: 'left-[4%] top-[12%] text-5xl animate-ho-ho' },
  { emoji: '🎄', className: 'right-[7%] top-[16%] text-5xl animate-float stagger-2' },
  { emoji: '🧝', className: 'left-[10%] bottom-[16%] text-4xl animate-swing stagger-3' },
  { emoji: '🎁', className: 'right-[12%] bottom-[10%] text-5xl animate-float stagger-4' },
  { emoji: '🦌', className: 'left-[28%] top-[6%] text-3xl animate-float-slow stagger-5' },
  { emoji: '⛄', className: 'right-[26%] bottom-[26%] text-3xl animate-float-tilt stagger-6' },
  { emoji: '❄️', className: 'left-[20%] top-[44%] text-2xl animate-twinkle stagger-7' },
  { emoji: '🛷', className: 'right-[6%] top-[46%] text-3xl animate-sleigh stagger-8' },
]

/**
 * Decoración flotante de fondo para las pantallas de acceso y registro:
 * Papá Noel, elfos, regalos y motivos navideños.
 * Se oculta en pantallas pequeñas para no tapar los formularios.
 */
export default function FloatingToys({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 hidden overflow-hidden sm:block ${className}`}
    >
      {TOYS.map((toy) => (
        <span
          key={toy.emoji}
          className={`absolute select-none opacity-80 drop-shadow-sm ${toy.className}`}
        >
          {toy.emoji}
        </span>
      ))}
    </div>
  )
}
