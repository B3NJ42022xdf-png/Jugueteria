import { PEXELS } from '../data/products.js'
import { Snowflake } from './icons.jsx'

/**
 * Fotos reales (recortadas a círculo) que flotan de fondo en las pantallas de
 * acceso y registro. Se usan imágenes de Pexels para mantener el mismo estilo
 * fotográfico del catálogo, en lugar de emojis sueltos.
 */
const PHOTOS = [
  {
    id: '1556679',
    alt: 'Peluche de Papá Noel',
    className: 'left-[4%] top-[12%] h-20 w-20 animate-ho-ho',
  },
  {
    id: '35139323',
    alt: 'Árbol de Navidad decorado',
    className: 'right-[7%] top-[16%] h-20 w-20 animate-float stagger-2',
  },
  {
    id: '14646244',
    alt: 'Duende navideño',
    className: 'left-[10%] bottom-[16%] h-16 w-16 animate-swing stagger-3',
  },
  {
    id: '19500352',
    alt: 'Regalos de Navidad',
    className: 'right-[12%] bottom-[10%] h-20 w-20 animate-float stagger-4',
  },
  {
    id: '13464196',
    alt: 'Adorno de reno',
    className: 'left-[28%] top-[6%] h-14 w-14 animate-float-slow stagger-5',
  },
  {
    id: '35074032',
    alt: 'Muñeco de nieve de peluche',
    className: 'right-[26%] bottom-[26%] h-14 w-14 animate-float-tilt stagger-6',
  },
  {
    id: '11138010',
    alt: 'Trineo navideño',
    className: 'right-[6%] top-[46%] h-14 w-14 animate-sleigh stagger-8',
  },
]

/**
 * Decoración flotante de fondo para las pantallas de acceso y registro.
 * Se oculta en pantallas pequeñas para no tapar los formularios.
 */
export default function FloatingToys({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 hidden overflow-hidden sm:block ${className}`}
    >
      {PHOTOS.map((photo) => (
        <span
          key={photo.id}
          className={`absolute block select-none overflow-hidden rounded-full bg-white opacity-80 shadow-md ring-2 ring-white/70 ${photo.className}`}
        >
          <img
            src={PEXELS(photo.id)}
            alt=""
            loading="lazy"
            decoding="async"
            width="160"
            height="160"
            className="h-full w-full object-cover"
          />
        </span>
      ))}

      <Snowflake className="absolute left-[20%] top-[44%] h-6 w-6 animate-twinkle text-sky-300 opacity-70 stagger-7" />
    </div>
  )
}
