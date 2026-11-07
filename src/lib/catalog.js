/**
 * Lógica pura de búsqueda, filtrado y ordenamiento del catálogo.
 * Al vivir fuera del componente se puede probar de forma aislada y reutilizar
 * cuando los productos vengan de una API.
 */

/** Normaliza acentos y mayúsculas para que "muneco" encuentre "Muñeco". */
export function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function filterAndSortProducts(
  products,
  {
    search = '',
    categories = [],
    brands = [],
    age = 'all',
    minPrice = 0,
    maxPrice = Number.POSITIVE_INFINITY,
    sort = 'popularity',
  } = {},
) {
  const term = normalizeText(search)

  const matches = products.filter((product) => {
    const searchableText = normalizeText(
      [product.name, product.category, product.brand, ...product.tags].join(' '),
    )

    const matchesSearch = term === '' || searchableText.includes(term)
    const matchesCategory = categories.length === 0 || categories.includes(product.category)
    const matchesBrand = brands.length === 0 || brands.includes(product.brand)
    const matchesAge = age === 'all' || product.age === age
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice

    return matchesSearch && matchesCategory && matchesBrand && matchesAge && matchesPrice
  })

  return matches.sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    return b.popularity - a.popularity || b.rating - a.rating
  })
}
