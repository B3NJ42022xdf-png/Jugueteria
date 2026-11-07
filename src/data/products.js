/**
 * Catálogo de juguetes de demostración.
 *
 * Las imágenes se generan como SVG (data URI) para que el catálogo funcione
 * sin depender de servicios externos ni de archivos binarios. Cada producto
 * tiene una imagen principal, nombre, precio, puntuación y metadatos para los
 * filtros (categoría, edad recomendada, marca y popularidad).
 */

export function createToyImage(emoji, from, to) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${from}" />
          <stop offset="1" stop-color="${to}" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)" />
      <circle cx="340" cy="52" r="72" fill="#ffffff" opacity="0.16" />
      <circle cx="58" cy="262" r="96" fill="#ffffff" opacity="0.12" />
      <path d="M0 300 L400 205 L400 300 Z" fill="#ffffff" opacity="0.1" />
      <text x="200" y="196" font-size="128" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const PRODUCTS = [
  {
    id: 'lego-castillo-medieval',
    name: 'Castillo Medieval LEGO',
    category: 'Legos',
    brand: 'LEGO',
    age: '6-8',
    price: 189900,
    rating: 4.8,
    reviews: 1240,
    popularity: 98,
    badge: 'Favorito',
    tags: ['lego', 'construcción', 'bloques', 'castillo', 'medieval', 'caballeros'],
    image: createToyImage('🏰', '#7c3aed', '#db2777'),
  },
  {
    id: 'lego-bloques-creativos',
    name: 'Caja de Bloques Creativos',
    category: 'Legos',
    brand: 'LEGO',
    age: '3-5',
    price: 89900,
    rating: 4.6,
    reviews: 860,
    popularity: 88,
    tags: ['lego', 'bloques', 'construcción', 'creatividad', 'colores'],
    image: createToyImage('🧱', '#f59e0b', '#ef4444'),
  },
  {
    id: 'muneca-ariana-vestidos',
    name: 'Muñeca Ariana con Vestidos',
    category: 'Muñecos',
    brand: 'Barbie',
    age: '3-5',
    price: 74900,
    rating: 4.5,
    reviews: 540,
    popularity: 82,
    tags: ['muñeca', 'moda', 'vestidos', 'princesa', 'niña'],
    image: createToyImage('👧', '#ec4899', '#f472b6'),
  },
  {
    id: 'muñecos-safari',
    name: 'Set de Muñecos Safari',
    category: 'Muñecos',
    brand: 'Playmobil',
    age: '3-5',
    price: 129900,
    rating: 4.7,
    reviews: 430,
    popularity: 76,
    tags: ['muñecos', 'safari', 'animales', 'león', 'explorador'],
    image: createToyImage('🦁', '#ca8a04', '#65a30d'),
  },
  {
    id: 'oso-peluche-gigante',
    name: 'Oso de Peluche Gigante',
    category: 'Peluches',
    brand: 'Mattel',
    age: '0-2',
    price: 99900,
    rating: 4.9,
    reviews: 2100,
    popularity: 99,
    badge: 'Más vendido',
    tags: ['peluche', 'oso', 'suave', 'bebé', 'abrazos', 'gigante'],
    image: createToyImage('🧸', '#b45309', '#f59e0b'),
  },
  {
    id: 'conejo-peluche-rosado',
    name: 'Conejo de Peluche Rosado',
    category: 'Peluches',
    brand: 'Fisher-Price',
    age: '0-2',
    price: 49900,
    rating: 4.4,
    reviews: 380,
    popularity: 65,
    tags: ['peluche', 'conejo', 'suave', 'bebé', 'rosa'],
    image: createToyImage('🐰', '#f9a8d4', '#fb7185'),
  },
  {
    id: 'auto-carreras-turbo',
    name: 'Auto de Carreras Turbo',
    category: 'Vehículos',
    brand: 'Hot Wheels',
    age: '6-8',
    price: 39900,
    rating: 4.6,
    reviews: 1500,
    popularity: 90,
    tags: ['auto', 'carro', 'carreras', 'velocidad', 'hot wheels'],
    image: createToyImage('🏎️', '#ef4444', '#f97316'),
  },
  {
    id: 'camion-bomberos',
    name: 'Camión de Bomberos con Luces',
    category: 'Vehículos',
    brand: 'Playmobil',
    age: '3-5',
    price: 119900,
    rating: 4.7,
    reviews: 620,
    popularity: 79,
    tags: ['camión', 'bomberos', 'rescate', 'vehículo', 'luces', 'sirena'],
    image: createToyImage('🚒', '#dc2626', '#0ea5e9'),
  },
  {
    id: 'rompecabezas-sistema-solar',
    name: 'Rompecabezas del Sistema Solar',
    category: 'Didácticos',
    brand: 'Ravensburger',
    age: '9-12',
    price: 69900,
    rating: 4.8,
    reviews: 310,
    popularity: 84,
    badge: 'Nuevo',
    tags: ['rompecabezas', 'puzzle', 'sistema solar', 'ciencia', 'espacio', 'educativo'],
    image: createToyImage('🪐', '#312e81', '#6366f1'),
  },
  {
    id: 'kit-ciencias-volcan',
    name: 'Kit de Ciencias Volcán',
    category: 'Didácticos',
    brand: 'Hasbro',
    age: '9-12',
    price: 84900,
    rating: 4.5,
    reviews: 275,
    popularity: 72,
    tags: ['ciencia', 'experimento', 'volcán', 'educativo', 'stem'],
    image: createToyImage('🌋', '#7c2d12', '#ea580c'),
  },
  {
    id: 'monopolio-junior',
    name: 'Monopolio Junior',
    category: 'Juegos de mesa',
    brand: 'Hasbro',
    age: '6-8',
    price: 79900,
    rating: 4.7,
    reviews: 1900,
    popularity: 95,
    badge: 'Top ventas',
    tags: ['mesa', 'monopolio', 'familia', 'dinero', 'juego', 'estrategia'],
    image: createToyImage('🎲', '#059669', '#10b981'),
  },
  {
    id: 'ajedrez-madera',
    name: 'Ajedrez de Madera Clásico',
    category: 'Juegos de mesa',
    brand: 'Ravensburger',
    age: '9-12',
    price: 59900,
    rating: 4.6,
    reviews: 240,
    popularity: 58,
    tags: ['ajedrez', 'mesa', 'estrategia', 'madera', 'clásico'],
    image: createToyImage('♟️', '#44403c', '#a8a29e'),
  },
  {
    id: 'patineta-espacial',
    name: 'Patineta Espacial',
    category: 'Aire libre',
    brand: 'Micro',
    age: '6-8',
    price: 109900,
    rating: 4.4,
    reviews: 520,
    popularity: 70,
    tags: ['patineta', 'scooter', 'aire libre', 'movilidad', 'ruedas'],
    image: createToyImage('🛹', '#0891b2', '#22d3ee'),
  },
  {
    id: 'cohete-de-agua',
    name: 'Cohete de Agua Recargable',
    category: 'Aire libre',
    brand: 'Nerf',
    age: '9-12',
    price: 34900,
    rating: 4.3,
    reviews: 760,
    popularity: 61,
    tags: ['cohete', 'agua', 'verano', 'aire libre', 'juego', 'exterior'],
    image: createToyImage('🚀', '#1d4ed8', '#38bdf8'),
  },
  {
    id: 'sonajero-arcoiris',
    name: 'Sonajero Arcoíris',
    category: 'Bebés',
    brand: 'Fisher-Price',
    age: '0-2',
    price: 29900,
    rating: 4.7,
    reviews: 980,
    popularity: 86,
    tags: ['bebé', 'sonajero', 'estimulación', 'colores', 'sonido'],
    image: createToyImage('🌈', '#fbbf24', '#fb7185'),
  },
  {
    id: 'alfombra-actividades',
    name: 'Alfombra de Actividades',
    category: 'Bebés',
    brand: 'Fisher-Price',
    age: '0-2',
    price: 64900,
    rating: 4.5,
    reviews: 410,
    popularity: 60,
    tags: ['bebé', 'alfombra', 'gimnasio', 'estimulación', 'texturas'],
    image: createToyImage('🐣', '#fde047', '#4ade80'),
  },
]

export const CATEGORIES = [...new Set(PRODUCTS.map((product) => product.category))].sort(
  (a, b) => a.localeCompare(b, 'es'),
)

export const BRANDS = [...new Set(PRODUCTS.map((product) => product.brand))].sort(
  (a, b) => a.localeCompare(b, 'es'),
)

export const AGE_GROUPS = [
  { value: '0-2', label: '0 a 2 años' },
  { value: '3-5', label: '3 a 5 años' },
  { value: '6-8', label: '6 a 8 años' },
  { value: '9-12', label: '9 a 12 años' },
]

export const PRICE_MIN = 0
export const PRICE_STEP = 5000
export const PRICE_MAX = Math.ceil(Math.max(...PRODUCTS.map((product) => product.price)) / 10000) * 10000
