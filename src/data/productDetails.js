/**
 * Información ampliada de cada juguete: descripción, especificaciones,
 * materiales, advertencias de seguridad, stock inicial y galería.
 *
 * Se mantiene separada de `products.js` para que el catálogo siga siendo
 * liviano y esta información pueda venir luego de un endpoint de detalle.
 */

import { createToyImage } from './products.js'
import {
  authorColor,
  displayAuthorName,
  formatReviewDate,
  listProductReviews,
} from '../services/reviewService.js'

export const PRODUCT_STOCK = {
  'lego-castillo-medieval': 12,
  'lego-bloques-creativos': 8,
  'muneca-ariana-vestidos': 3,
  'figuras-aventura': 6,
  'oso-peluche-gigante': 9,
  'peluche-suave-dormir': 5,
  'auto-carreras-turbo': 24,
  'tren-carga-madera': 4,
  'rompecabezas-sistema-solar': 7,
  'kit-ciencias-volcan': 2,
  'monopolio-junior': 15,
  'ajedrez-madera': 0,
  'patineta-espacial': 5,
  'cohete-de-agua': 10,
  'sonajero-arcoiris': 18,
  'alfombra-actividades': 3,
}

const DESCRIPTIONS = {
  'lego-castillo-medieval':
    'Construye un reino medieval con torres, puente levadizo y caballeros. El set incluye instrucciones ilustradas paso a paso y piezas compatibles con otras líneas de construcción.',
  'lego-bloques-creativos':
    'Una caja llena de colores y formas para dar rienda suelta a la imaginación. Ideal para los primeros proyectos de construcción y para inventar historias sin límites.',
  'muneca-ariana-vestidos':
    'Muñeca articulada con vestidos intercambiables y accesorios de moda. Su cabello se puede peinar y sus manos están diseñadas para sujetar cada accesorio.',
  'figuras-aventura':
    'Set de figuras articuladas con accesorios de aventura, mochila y vehículo de exploración. Las piezas tienen el tamaño justo para manos pequeñas.',
  'oso-peluche-gigante':
    'Peluche extra suave y abrazable, con relleno de fibra siliconada y costuras reforzadas. Un compañero ideal para dormir, jugar y acompañar cada aventura.',
  'peluche-suave-dormir':
    'Peluche de tacto extra suave con mantita incorporada y detalles bordados. Su tamaño compacto lo hace perfecto para dormir y llevar de paseo.',
  'auto-carreras-turbo':
    'Auto de carreras con diseño aerodinámico, ruedas de alta velocidad y chasis resistente a impactos. Compatible con pistas y accesorios de la misma línea.',
  'tren-carga-madera':
    'Tren de carga de madera natural con locomotora, vagones y vías encajables. Estimula la motricidad fina y la imaginación mientras se construyen recorridos.',
  'rompecabezas-sistema-solar':
    'Rompecabezas de 500 piezas con una ilustración detallada del sistema solar. Fomenta la concentración y el aprendizaje mientras se arma.',
  'kit-ciencias-volcan':
    'Kit para crear una erupción volcánica y aprender sobre reacciones químicas. Incluye materiales y una guía con experimentos paso a paso.',
  'monopolio-junior':
    'Versión junior del clásico juego de mesa, con reglas simplificadas y personajes conocidos. Ideal para compartir tardes en familia.',
  'ajedrez-madera':
    'Juego de ajedrez de madera con tablero plegable y piezas talladas. Un clásico para entrenar la estrategia y la concentración.',
  'patineta-espacial':
    'Patineta de tres ruedas con base antideslizante y freno trasero. Ruedas silenciosas y manubrio ajustable para acompañar el crecimiento.',
  'cohete-de-agua':
    'Cohete recargable que despega con agua y aire. No requiere baterías y es ideal para jugar al aire libre durante horas.',
  'sonajero-arcoiris':
    'Torre apilable de anillos de colores con base oscilante. Estimula la coordinación, la motricidad fina y el reconocimiento de colores desde los primeros meses.',
  'alfombra-actividades':
    'Alfombra de actividades con arco, juguetes colgantes y texturas. Acompaña el juego boca abajo y la exploración del bebé.',
}

const GALLERY_EXTRAS = {
  'lego-castillo-medieval': [
    createToyImage('🛡️', '#4c1d95', '#8b5cf6'),
    createToyImage('👑', '#f59e0b', '#db2777'),
  ],
  'lego-bloques-creativos': [
    createToyImage('🎨', '#0ea5e9', '#f59e0b'),
    createToyImage('🏗️', '#ef4444', '#f97316'),
  ],
  'muneca-ariana-vestidos': [
    createToyImage('👗', '#a21caf', '#f472b6'),
    createToyImage('🎀', '#ec4899', '#fb7185'),
  ],
  'figuras-aventura': [
    createToyImage('🧭', '#166534', '#84cc16'),
    createToyImage('🗺️', '#b45309', '#fbbf24'),
  ],
  'oso-peluche-gigante': [
    createToyImage('🤗', '#b45309', '#fbbf24'),
    createToyImage('🎁', '#f59e0b', '#ef4444'),
  ],
  'peluche-suave-dormir': [
    createToyImage('🌙', '#f9a8d4', '#c084fc'),
    createToyImage('🧸', '#fb7185', '#f59e0b'),
  ],
  'auto-carreras-turbo': [
    createToyImage('🏁', '#111827', '#ef4444'),
    createToyImage('🔧', '#374151', '#f97316'),
  ],
  'tren-carga-madera': [
    createToyImage('🚂', '#92400e', '#f59e0b'),
    createToyImage('🛤️', '#065f46', '#84cc16'),
  ],
  'rompecabezas-sistema-solar': [
    createToyImage('🌞', '#f59e0b', '#6366f1'),
    createToyImage('🔭', '#1e1b4b', '#8b5cf6'),
  ],
  'kit-ciencias-volcan': [
    createToyImage('🧪', '#0f766e', '#84cc16'),
    createToyImage('🌍', '#7c2d12', '#22c55e'),
  ],
  'monopolio-junior': [
    createToyImage('💰', '#047857', '#facc15'),
    createToyImage('🏠', '#065f46', '#34d399'),
  ],
  'ajedrez-madera': [
    createToyImage('♜', '#292524', '#78716c'),
    createToyImage('🏆', '#a16207', '#facc15'),
  ],
  'patineta-espacial': [
    createToyImage('🛴', '#0e7490', '#38bdf8'),
    createToyImage('⚙️', '#155e75', '#22d3ee'),
  ],
  'cohete-de-agua': [
    createToyImage('💦', '#0369a1', '#38bdf8'),
    createToyImage('🌤️', '#1d4ed8', '#93c5fd'),
  ],
  'sonajero-arcoiris': [
    createToyImage('🎵', '#f59e0b', '#a855f7'),
    createToyImage('👶', '#fb7185', '#fde047'),
  ],
  'alfombra-actividades': [
    createToyImage('🎈', '#22c55e', '#facc15'),
    createToyImage('🧩', '#fde047', '#38bdf8'),
  ],
}

const CATEGORY_INFO = {
  Legos: {
    highlights: [
      'Piezas compatibles con otras líneas de construcción',
      'Instrucciones ilustradas paso a paso',
      'Estimula la creatividad y la motricidad fina',
    ],
    specs: [
      { label: 'Piezas', value: 'Más de 500 bloques y accesorios' },
      { label: 'Dimensiones del empaque', value: '38 × 28 × 8 cm' },
      { label: 'Peso aproximado', value: '1,1 kg' },
    ],
    materials:
      'Plástico ABS de alta resistencia, libre de BPA y ftalatos. Pigmentos no tóxicos y bordes redondeados para un uso seguro.',
    safety: [
      'Contiene piezas pequeñas. Riesgo de asfixia.',
      'No apto para menores de 3 años sin supervisión de un adulto.',
      'Retira el embalaje y las bolsas antes de usar.',
    ],
  },
  Muñecos: {
    highlights: [
      'Articulaciones móviles para posar y jugar',
      'Accesorios intercambiables',
      'Diseño resistente al juego diario',
    ],
    specs: [
      { label: 'Altura', value: '30 cm' },
      { label: 'Contenido', value: 'Figura y accesorios intercambiables' },
      { label: 'Dimensiones del empaque', value: '24 × 12 × 32 cm' },
      { label: 'Peso aproximado', value: '450 g' },
    ],
    materials:
      'Vinilo libre de ftalatos, tela de poliéster y detalles pintados a mano con tintas no tóxicas.',
    safety: [
      'Contiene piezas pequeñas que pueden desprenderse.',
      'Recomendado para mayores de 3 años.',
      'Supervisa el juego con niños menores de 6 años.',
    ],
  },
  Peluches: {
    highlights: [
      'Textura extra suave',
      'Relleno hipoalergénico',
      'Costuras reforzadas para el uso diario',
    ],
    specs: [
      { label: 'Altura', value: '45 cm' },
      { label: 'Relleno', value: 'Fibra siliconada' },
      { label: 'Lavado', value: 'A mano o a máquina en frío' },
      { label: 'Peso aproximado', value: '700 g' },
    ],
    materials:
      'Poliéster hipoalergénico, relleno de fibra siliconada y ojos bordados sin piezas sueltas.',
    safety: [
      'Retira etiquetas y precintos antes de entregar al bebé.',
      'No apto para menores de 3 años sin supervisión.',
      'Lava el peluche antes del primer uso.',
    ],
  },
  Vehículos: {
    highlights: [
      'Ruedas de rodamiento suave',
      'Estructura resistente a impactos',
      'Detalles realistas',
    ],
    specs: [
      { label: 'Escala', value: '1:24' },
      { label: 'Dimensiones', value: '22 × 10 × 9 cm' },
      { label: 'Baterías', value: 'No requiere' },
      { label: 'Peso aproximado', value: '350 g' },
    ],
    materials:
      'Plástico ABS y partes metálicas pintadas con recubrimiento no tóxico.',
    safety: [
      'Contiene piezas pequeñas. No apto para menores de 3 años.',
      'No usar cerca de escaleras o superficies mojadas.',
      'Verifica que las ruedas estén bien sujetas antes de jugar.',
    ],
  },
  Científicos: {
    highlights: [
      'Aprendizaje basado en el juego',
      'Materiales duraderos',
      'Guía de actividades incluida',
    ],
    specs: [
      { label: 'Contenido', value: 'Piezas y guía ilustrada' },
      { label: 'Dimensiones del empaque', value: '30 × 25 × 8 cm' },
      { label: 'Nivel', value: 'Educativo' },
      { label: 'Peso aproximado', value: '600 g' },
    ],
    materials:
      'Cartón rígido reciclable, plástico ABS libre de BPA y papel certificado.',
    safety: [
      'Contiene piezas pequeñas. No apto para menores de 3 años.',
      'Algunos experimentos requieren supervisión de un adulto.',
      'Sigue las instrucciones y usa únicamente los elementos incluidos.',
    ],
  },
  'Juegos de Mesa': {
    highlights: [
      'Para toda la familia',
      'Reglas fáciles de aprender',
      'Partidas de 30 a 60 minutos',
    ],
    specs: [
      { label: 'Jugadores', value: '2 a 6' },
      { label: 'Duración', value: '30 a 60 minutos' },
      { label: 'Contenido', value: 'Tablero, fichas y reglamento' },
      { label: 'Peso aproximado', value: '800 g' },
    ],
    materials:
      'Cartón prensado, madera de haya y fichas de plástico reciclable.',
    safety: [
      'Contiene piezas pequeñas. No apto para menores de 3 años.',
      'Mantén las piezas fuera del alcance de las mascotas.',
      'No ingieras las fichas.',
    ],
  },
  'Aire Libre': {
    highlights: [
      'Ideal para jugar al aire libre',
      'Materiales resistentes al uso',
      'Fácil de transportar',
    ],
    specs: [
      { label: 'Dimensiones', value: '60 × 20 × 15 cm' },
      { label: 'Peso máximo soportado', value: '50 kg' },
      { label: 'Uso', value: 'Exterior' },
      { label: 'Peso aproximado', value: '2,2 kg' },
    ],
    materials:
      'Aluminio reforzado, polipropileno resistente a los rayos UV y ruedas de poliuretano.',
    safety: [
      'Usa casco y protección cuando corresponda.',
      'No apto para menores de 3 años.',
      'No usar en superficies mojadas o con tráfico.',
    ],
  },
  Bebés: {
    highlights: [
      'Materiales seguros para bebés',
      'Colores y texturas estimulantes',
      'Fácil de limpiar',
    ],
    specs: [
      { label: 'Edad', value: '0 a 2 años' },
      { label: 'Dimensiones', value: '30 × 20 × 10 cm' },
      { label: 'Lavado', value: 'Superficie húmeda' },
      { label: 'Peso aproximado', value: '300 g' },
    ],
    materials:
      'Plástico libre de BPA, tela de algodón y relleno de poliéster hipoalergénico.',
    safety: [
      'Uso bajo supervisión de un adulto.',
      'Retira el embalaje antes de usar.',
      'No dejes al bebé solo durante el juego.',
    ],
  },
}

const DEFAULT_INFO = {
  highlights: [
    'Diseño pensado para el juego seguro',
    'Materiales resistentes y duraderos',
    'Recomendado para la edad indicada',
  ],
  specs: [
    { label: 'Dimensiones del empaque', value: '30 × 25 × 10 cm' },
    { label: 'Peso aproximado', value: '700 g' },
  ],
  materials: 'Materiales no tóxicos y resistentes al uso diario.',
  safety: [
    'Uso bajo supervisión de un adulto.',
    'Retira el embalaje antes de usar.',
  ],
}

export function getProductDetail(product) {
  const info = CATEGORY_INFO[product.category] ?? DEFAULT_INFO
  const galleryExtras = GALLERY_EXTRAS[product.id] ?? []

  return {
    ...product,
    description:
      product.description?.trim() ||
      DESCRIPTIONS[product.id] ||
      `${product.name} de ${product.brand} está diseñado para jugar, aprender y crear buenos recuerdos.`,
    highlights: info.highlights,
    specs: [
      { label: 'Marca', value: product.brand },
      { label: 'Categoría', value: product.category },
      { label: 'Edad recomendada', value: `${(product.ageRange ?? product.age).replace('-', ' a ')} años` },
      { label: 'Referencia', value: product.id.toUpperCase() },
      ...info.specs,
    ],
    materials: info.materials,
    safety: info.safety,
    stock: product.stock ?? PRODUCT_STOCK[product.id] ?? 0,
    gallery: [product.imageUrl ?? product.image, ...galleryExtras],
  }
}

/* ------------------------------------------------------------------ */
/* Comentarios y puntuaciones                                          */
/* ------------------------------------------------------------------ */

const REVIEW_AUTHORS = [
  { name: 'Mariana G.', color: 'bg-violet-100 text-violet-700' },
  { name: 'Andrés R.', color: 'bg-sky-100 text-sky-700' },
  { name: 'Carolina P.', color: 'bg-rose-100 text-rose-700' },
  { name: 'Julián M.', color: 'bg-amber-100 text-amber-700' },
  { name: 'Sofía L.', color: 'bg-emerald-100 text-emerald-700' },
]

const REVIEW_DATES = ['Hace 2 días', 'Hace 5 días', 'Hace 2 semanas', 'Hace 1 mes']

const REVIEW_COMMENTS = [
  (product) =>
    `Compré el ${product.name} para mi hijo y quedó fascinado. La calidad se siente resistente y llegó muy bien empacado.`,
  (product) =>
    `Es tal como se ve en las fotos. El ${product.name} cumple con la edad recomendada y ha resistido varias semanas de juego.`,
  () =>
    'Muy buena relación calidad-precio. El único detalle es que el instructivo podría ser más claro, pero el producto es excelente.',
  () =>
    'Se lo regalé a mi sobrina y no lo suelta. El envío llegó antes de lo esperado y todo en perfecto estado.',
]

export function getProductReviews(product) {
  // Distribución estimada de las valoraciones históricas del catálogo.
  const basePercent = (rating) => {
    const five = Math.min(90, Math.max(50, Math.round(((rating - 3.2) / 1.8) * 100)))
    const four = Math.round((100 - five) * 0.55)
    const three = Math.round((100 - five - four) * 0.5)
    const two = Math.round((100 - five - four - three) * 0.5)
    const one = Math.max(0, 100 - five - four - three - two)
    return { 5: five, 4: four, 3: three, 2: two, 1: one }
  }

  const baseRating = Number(product.baseRating ?? product.rating) || 0
  const baseReviews = Math.max(
    0,
    Math.floor(Number(product.baseReviews ?? product.reviews) || 0),
  )
  const published = listProductReviews(product.id)
  const total = baseReviews + published.length

  // Conteo por estrella: históricas + opiniones verificadas publicadas.
  const percents = basePercent(baseRating)
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  if (baseReviews > 0) {
    ;[1, 2, 3, 4, 5].forEach((star) => {
      starCounts[star] += (percents[star] / 100) * baseReviews
    })
  }

  published.forEach((review) => {
    starCounts[review.stars] += 1
  })

  const average =
    total > 0
      ? Math.round(
          ([1, 2, 3, 4, 5].reduce(
            (sum, star) => sum + star * starCounts[star],
            0,
          ) /
            total) *
            10,
        ) / 10
      : 0

  const shift = [...product.id].reduce((totalValue, char) => totalValue + char.charCodeAt(0), 0)

  const sampleItems =
    baseReviews > 0
      ? [0, 1, 2, 3].map((index) => {
          const author = REVIEW_AUTHORS[(shift + index) % REVIEW_AUTHORS.length]
          const comment = REVIEW_COMMENTS[(shift + index) % REVIEW_COMMENTS.length]

          return {
            id: `${product.id}-review-${index}`,
            author: author.name,
            color: author.color,
            date: REVIEW_DATES[index],
            rating: index < 2 ? 5 : 4,
            verified: index !== 2,
            comment: comment(product),
            isReal: false,
          }
        })
      : []

  // Las opiniones reales van primero y siempre son de compra verificada.
  const realItems = published.map((review) => ({
    id: review.id,
    author: displayAuthorName(review.customerName),
    color: authorColor(review.customerName),
    date: formatReviewDate(review.updatedAt),
    rating: review.stars,
    verified: true,
    comment: review.comment,
    isReal: true,
  }))

  return {
    average,
    total,
    realCount: published.length,
    breakdown: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      percent:
        total > 0 ? Math.round((starCounts[stars] / total) * 100) : 0,
    })),
    items: [...realItems, ...sampleItems],
  }
}
