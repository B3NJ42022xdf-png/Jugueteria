/**
 * Motor de recomendación del "Buscador de Regalos Mágico".
 *
 * Es una función pura: recibe el catálogo y las respuestas del quiz y devuelve
 * los tres juguetes con mejor puntaje. La edad y el interés suman más que la
 * popularidad, y el presupuesto penaliza los productos que se pasan del límite
 * sin excluirlos del todo (así siempre hay alternativas si el catálogo es
 * pequeño).
 */

export const GIFT_AGE_OPTIONS = [
  { value: '0-2', label: '0 a 2 años', hint: 'Primeros juegos' },
  { value: '3-5', label: '3 a 5 años', hint: 'Explorar y crear' },
  { value: '6-8', label: '6 a 8 años', hint: 'Construir y jugar' },
  { value: '9-12', label: '+9 años', hint: 'Retos y aventuras' },
]

export const GIFT_INTEREST_OPTIONS = [
  { value: 'Peluches', label: 'Peluches', hint: 'Abrazos y ternura' },
  { value: 'Legos', label: 'Construcción / Legos', hint: 'Bloques y creatividad' },
  { value: 'Navidad', label: 'Navidad', hint: 'Magia de diciembre' },
  { value: 'Juegos de Mesa', label: 'Juegos de mesa', hint: 'Diversión en familia' },
  { value: 'Vehículos', label: 'Vehículos', hint: 'Ruedas y velocidad' },
  { value: 'Científicos', label: 'Científicos', hint: 'Experimentos' },
  { value: 'Aire Libre', label: 'Aire libre', hint: 'Movimiento' },
  { value: 'Muñecos', label: 'Muñecos', hint: 'Historias y roles' },
  { value: 'Bebés', label: 'Bebés', hint: 'Primeras etapas' },
]

export const GIFT_BUDGET_OPTIONS = [
  { value: 100, label: 'Hasta S/ 100', hint: 'Regalos accesibles' },
  { value: 150, label: 'Hasta S/ 150', hint: 'Un poco más de magia' },
  { value: null, label: 'Sin límite', hint: 'Sorprende sin medida' },
]

function scoreProduct(product, { age, interest, maxBudget }) {
  let score = (Number(product.popularity) || 0) * 0.6
  score += (Number(product.rating) || 0) * 6

  if (product.ageRange === age) score += 90
  if (product.category === interest) score += 80

  if (maxBudget != null) {
    if (product.price <= maxBudget) {
      // Premia usar bien el presupuesto sin castigar los regalos pequeños.
      score += 35
    } else {
      score -= 400 + (product.price - maxBudget)
    }
  }

  if (product.stock === 0) score -= 500

  return score
}

/**
 * @param {Array} products Catálogo completo.
 * @param {{age: string, interest: string, maxBudget: number|null}} answers
 * @returns {Array<{product: object, overBudget: boolean}>}
 */
export function recommendGifts(products, { age, interest, maxBudget } = {}) {
  if (!Array.isArray(products) || products.length === 0) return []

  return products
    .map((product) => ({
      product,
      score: scoreProduct(product, { age, interest, maxBudget }),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (a.product.price ?? 0) - (b.product.price ?? 0)
    })
    .slice(0, 3)
    .map(({ product }) => ({
      product,
      overBudget: maxBudget != null && product.price > maxBudget,
    }))
}
