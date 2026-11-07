/**
 * Catálogo de juguetes de la tienda.
 *
 * Cada producto expone los campos "nuevos" solicitados por el catálogo
 * (`imageUrl`, `reviewsCount`, `ageRange`) y, además, los alias que ya
 * consumían otras pantallas (`image`, `reviews`, `age`). Así el detalle del
 * producto, el carrito y el panel de administración siguen funcionando sin
 * cambios mientras el catálogo usa las propiedades nuevas.
 *
 * Las imágenes son fotografías reales de juguetes alojadas en Unsplash.
 * El sufijo `?auto=format&fit=crop&w=800&q=80` las entrega optimizadas.
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

const UNSPLASH = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`

/**
 * Fuente única de juguetes del catálogo (12 productos).
 * Se mantienen los IDs originales para conservar stock, reseñas y enlaces.
 */
export const PRODUCTS = [
  {
    id: 'lego-castillo-medieval',
    name: 'Castillo Medieval LEGO',
    category: 'Legos',
    brand: 'LEGO',
    price: 189900,
    rating: 4.8,
    reviewsCount: 1240,
    ageRange: '6-8',
    badge: 'MÁS VENDEDOR',
    imageUrl: UNSPLASH('photo-1587654780291-39c9404d746b'),
    tags: ['lego', 'construcción', 'bloques', 'castillo', 'medieval', 'caballeros'],
    popularity: 98,
  },
  {
    id: 'lego-bloques-creativos',
    name: 'Caja de Bloques Creativos',
    category: 'Legos',
    brand: 'LEGO',
    price: 89900,
    rating: 4.6,
    reviewsCount: 860,
    ageRange: '3-5',
    badge: 'OFERTA',
    imageUrl: UNSPLASH('photo-1560961911-ba7ef651a56c'),
    tags: ['lego', 'bloques', 'construcción', 'creatividad', 'colores'],
    popularity: 88,
  },
  {
    id: 'monopolio-junior',
    name: 'Monopolio Junior',
    category: 'Juegos de Mesa',
    brand: 'Hasbro',
    price: 79900,
    rating: 4.7,
    reviewsCount: 1900,
    ageRange: '6-8',
    badge: 'TOP VENTAS',
    imageUrl: UNSPLASH('photo-1610890716171-6b1bb98ffd09'),
    tags: ['mesa', 'monopolio', 'familia', 'dinero', 'juego', 'estrategia'],
    popularity: 95,
  },
  {
    id: 'oso-peluche-gigante',
    name: 'Oso de Peluche Gigante',
    category: 'Peluches',
    brand: 'Mattel',
    price: 99900,
    rating: 4.9,
    reviewsCount: 2100,
    ageRange: '0-2',
    badge: 'MÁS VENDEDOR',
    imageUrl: UNSPLASH('photo-1602734846297-9299fc2d4703'),
    tags: ['peluche', 'oso', 'suave', 'bebé', 'abrazos', 'gigante'],
    popularity: 99,
  },
  {
    id: 'peluche-suave-dormir',
    name: 'Peluche Suave para Dormir',
    category: 'Peluches',
    brand: 'Fisher-Price',
    price: 49900,
    rating: 4.4,
    reviewsCount: 380,
    ageRange: '0-2',
    badge: 'OFERTA',
    imageUrl: UNSPLASH('photo-1559454403-b8fb88521f11'),
    tags: ['peluche', 'suave', 'bebé', 'dormir', 'abrazos', 'mantita'],
    popularity: 65,
  },
  {
    id: 'auto-carreras-turbo',
    name: 'Auto de Carreras Turbo',
    category: 'Vehículos',
    brand: 'Hot Wheels',
    price: 39900,
    rating: 4.6,
    reviewsCount: 1500,
    ageRange: '6-8',
    badge: 'TOP VENTAS',
    imageUrl: UNSPLASH('photo-1581235720704-06d3acfcb36f'),
    tags: ['auto', 'carro', 'carreras', 'velocidad', 'hot wheels'],
    popularity: 90,
  },
  {
    id: 'tren-carga-madera',
    name: 'Tren de Carga de Madera',
    category: 'Vehículos',
    brand: 'Brio',
    price: 119900,
    rating: 4.7,
    reviewsCount: 620,
    ageRange: '3-5',
    imageUrl: UNSPLASH('photo-1592198084033-aade902d1aae'),
    tags: ['tren', 'madera', 'vías', 'carga', 'locomotora', 'vehículo'],
    popularity: 79,
  },
  {
    id: 'muneca-ariana-vestidos',
    name: 'Muñeca Princesa Ariana',
    category: 'Muñecos',
    brand: 'Barbie',
    price: 74900,
    rating: 4.5,
    reviewsCount: 540,
    ageRange: '3-5',
    badge: 'OFERTA',
    imageUrl: UNSPLASH('photo-1566576912321-d58ddd7a6088'),
    tags: ['muñeca', 'moda', 'vestidos', 'princesa', 'niña'],
    popularity: 82,
  },
  {
    id: 'figuras-aventura',
    name: 'Set de Figuras de Aventura',
    category: 'Muñecos',
    brand: 'Playmobil',
    price: 129900,
    rating: 4.7,
    reviewsCount: 430,
    ageRange: '3-5',
    imageUrl: UNSPLASH('photo-1558060370-d644479cb6f7'),
    tags: ['muñecos', 'figuras', 'aventura', 'colección', 'acción', 'explorador'],
    popularity: 76,
  },
  {
    id: 'sonajero-arcoiris',
    name: 'Torre de Anillos Arcoíris',
    category: 'Bebés',
    brand: 'Fisher-Price',
    price: 29900,
    rating: 4.7,
    reviewsCount: 980,
    ageRange: '0-2',
    badge: 'MÁS VENDEDOR',
    imageUrl: UNSPLASH('photo-1618842676088-c4d48a6a7c9d'),
    tags: ['bebé', 'sonajero', 'anillos', 'estimulación', 'colores', 'apilable'],
    popularity: 86,
  },
  {
    id: 'patineta-espacial',
    name: 'Patineta Espacial',
    category: 'Aire Libre',
    brand: 'Micro',
    price: 109900,
    rating: 4.4,
    reviewsCount: 520,
    ageRange: '6-8',
    badge: 'TOP VENTAS',
    imageUrl: UNSPLASH('photo-1520045892732-304bc3ac5d8e'),
    tags: ['patineta', 'scooter', 'aire libre', 'movilidad', 'ruedas'],
    popularity: 70,
  },
  {
    id: 'kit-ciencias-volcan',
    name: 'Kit de Ciencias Volcán',
    category: 'Científicos',
    brand: 'Hasbro',
    price: 84900,
    rating: 4.5,
    reviewsCount: 275,
    ageRange: '9-12',
    badge: 'OFERTA',
    imageUrl: UNSPLASH('photo-1532094349884-543bc11b234d'),
    tags: ['ciencia', 'experimento', 'volcán', 'educativo', 'stem'],
    popularity: 72,
  },
].map((product) => ({
  ...product,
  // Alias de compatibilidad con las pantallas que ya consumían estos campos.
  image: product.imageUrl,
  reviews: product.reviewsCount,
  age: product.ageRange,
}))

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
export const PRICE_MAX =
  Math.ceil(Math.max(...PRODUCTS.map((product) => product.price)) / 10000) * 10000
