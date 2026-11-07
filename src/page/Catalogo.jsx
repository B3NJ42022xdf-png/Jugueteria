import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import StoreHeader from '../components/StoreHeader.jsx'
import { filterAndSortProducts } from '../lib/catalog.js'
import { AGE_GROUPS, PRICE_MIN, PRICE_STEP } from '../data/products.js'
import {
  getCatalogSnapshot,
  loadCatalog,
} from '../services/catalogApi.js'
import { measureSync } from '../services/performanceService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatPrice(value) {
  return priceFormatter.format(value)
}

function toggleInList(setState, value) {
  setState((previous) =>
    previous.includes(value)
      ? previous.filter((item) => item !== value)
      : [...previous, value],
  )
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function FilterIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  )
}

function XIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas de la interfaz                                               */
/* ------------------------------------------------------------------ */

function FilterSection({ title, children }) {
  return (
    <div className="border-t border-slate-100 pt-5">
      <h3 className="mb-3 text-sm font-black text-slate-900">{title}</h3>
      {children}
    </div>
  )
}

function FiltersPanel({
  categories,
  brands,
  priceMax,
  selectedCategories,
  selectedBrands,
  ageFilter,
  minPrice,
  maxPrice,
  activeFilterCount,
  onToggleCategory,
  onToggleBrand,
  onAgeChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-slate-900">Filtros</h2>
          {activeFilterCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-100 px-1.5 text-[11px] font-black text-violet-700">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-bold text-violet-700 underline-offset-4 transition hover:text-fuchsia-600 hover:underline"
        >
          Limpiar
        </button>
      </div>

      <FilterSection title="Categoría">
        <div className="space-y-0.5">
          {categories.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-600 transition hover:text-slate-900"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => onToggleCategory(category)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-violet-600"
              />
              {category}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Edad recomendada">
        <label htmlFor="age-filter" className="sr-only">
          Edad recomendada
        </label>
        <select
          id="age-filter"
          value={ageFilter}
          onChange={(event) => onAgeChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        >
          <option value="all">Todas las edades</option>
          {AGE_GROUPS.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
      </FilterSection>

      <FilterSection title="Marca">
        <div className="space-y-0.5">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-600 transition hover:text-slate-900"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => onToggleBrand(brand)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-violet-600"
              />
              {brand}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rango de precio">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
              <label htmlFor="price-min">Precio mínimo</label>
              <span className="font-black text-slate-800">{formatPrice(minPrice)}</span>
            </div>
            <input
              id="price-min"
              type="range"
              min={PRICE_MIN}
              max={priceMax}
              step={PRICE_STEP}
              value={minPrice}
              onChange={(event) => onMinPriceChange(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer accent-violet-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
              <label htmlFor="price-max">Precio máximo</label>
              <span className="font-black text-slate-800">{formatPrice(maxPrice)}</span>
            </div>
            <input
              id="price-max"
              type="range"
              min={PRICE_MIN}
              max={priceMax}
              step={PRICE_STEP}
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer accent-violet-600"
            />
          </div>
        </div>
      </FilterSection>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Página de catálogo                                                  */
/* ------------------------------------------------------------------ */

function CatalogoContent({ catalog }) {
  const products = catalog.products
  const meta = catalog.meta

  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [ageFilter, setAgeFilter] = useState('all')
  const [minPrice, setMinPrice] = useState(PRICE_MIN)
  const [maxPrice, setMaxPrice] = useState(meta.priceMax)
  const [sort, setSort] = useState('popularity')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    (ageFilter !== 'all' ? 1 : 0) +
    (minPrice !== PRICE_MIN || maxPrice !== meta.priceMax ? 1 : 0)

  const filteredProducts = useMemo(
    () =>
      measureSync('search', 'Búsqueda y filtros del catálogo', () =>
        filterAndSortProducts(products, {
          search: deferredSearch,
          categories: selectedCategories,
          brands: selectedBrands,
          age: ageFilter,
          minPrice,
          maxPrice,
          sort,
        }),
      ),
    [products, deferredSearch, selectedCategories, selectedBrands, ageFilter, minPrice, maxPrice, sort],
  )

  function handleMinPriceChange(value) {
    setMinPrice(Math.min(value, maxPrice))
  }

  function handleMaxPriceChange(value) {
    setMaxPrice(Math.max(value, minPrice))
  }

  function clearFilters() {
    setSearch('')
    setSelectedCategories([])
    setSelectedBrands([])
    setAgeFilter('all')
    setMinPrice(PRICE_MIN)
    setMaxPrice(meta.priceMax)
    setSort('popularity')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-fuchsia-600 to-rose-500 px-6 py-8 text-white shadow-xl shadow-fuchsia-900/20 sm:px-10 sm:py-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10" />

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur">
                Catálogo de juguetes
              </span>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Encuentra el juguete ideal
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                Busca por nombre o etiqueta y filtra por categoría, edad recomendada, marca y
                rango de precio.
              </p>

              <div className="relative mt-5">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Busca: lego, peluche, safari, ciencia…"
                  aria-label="Buscar juguetes por nombre o etiqueta"
                  className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-12 text-base text-slate-900 shadow-xl shadow-violet-950/10 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/60"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <XIcon />
                  </button>
                )}
              </div>

              <p className="mt-2.5 text-xs text-white/70">
                Búsqueda en tiempo real por nombre o etiqueta.
              </p>
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside
              id="panel-filtros"
              className={`${filtersOpen ? 'block' : 'hidden'} lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1`}
            >
              <FiltersPanel
                categories={meta.categories}
                brands={meta.brands}
                priceMax={meta.priceMax}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                ageFilter={ageFilter}
                minPrice={minPrice}
                maxPrice={maxPrice}
                activeFilterCount={activeFilterCount}
                onToggleCategory={(category) => toggleInList(setSelectedCategories, category)}
                onToggleBrand={(brand) => toggleInList(setSelectedBrands, brand)}
                onAgeChange={setAgeFilter}
                onMinPriceChange={handleMinPriceChange}
                onMaxPriceChange={handleMaxPriceChange}
                onClear={clearFilters}
              />
            </aside>

            <section aria-labelledby="resultados-title">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="resultados-title" className="text-lg font-black tracking-tight text-slate-900">
                    Juguetes
                  </h2>
                  <p className="text-sm text-slate-500" aria-live="polite">
                    {filteredProducts.length}{' '}
                    {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    aria-controls="panel-filtros"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                  >
                    <FilterIcon className="h-4 w-4" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-100 px-1.5 text-[11px] font-black text-violet-700">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <label htmlFor="sort" className="sr-only">
                    Ordenar juguetes
                  </label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="popularity">Más populares</option>
                    <option value="price-asc">Precio: menor a mayor</option>
                    <option value="price-desc">Precio: mayor a menor</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={index < 3}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                  <div
                    className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-100 text-5xl"
                    aria-hidden="true"
                  >
                    🧸
                  </div>
                  <div
                    className="mx-auto -mt-3 grid h-11 w-11 place-items-center rounded-full bg-white text-violet-600 shadow-md ring-1 ring-violet-100"
                    aria-hidden="true"
                  >
                    <SearchIcon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">
                    No encontramos ese juguete
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                    Parece que la búsqueda no coincide con nada de nuestro catálogo. Prueba con
                    otra palabra o ajusta los filtros de categoría, edad, marca y precio.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Juguetes seguros para cada etapa
      </footer>
    </div>
  )
}

function CatalogLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />
      <main className="flex-1" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-56 animate-pulse rounded-3xl bg-gradient-to-br from-violet-200 via-fuchsia-200 to-rose-200" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden h-96 animate-pulse rounded-3xl bg-white lg:block" />
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Cargando catálogo…
              </p>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                    <div className="space-y-2 p-4">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                      <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Catalogo() {
  const [catalog, setCatalog] = useState(() => getCatalogSnapshot())

  useEffect(() => {
    let active = true

    function apply(data) {
      if (active) setCatalog(data)
    }

    // Primera carga: promesa asíncrona (memoria → sessionStorage → datos).
    loadCatalog().then(apply).catch(() => {})

    // Si el administrador cambia productos, stock u opiniones, recargamos.
    function handleCatalogChange() {
      loadCatalog().then(apply).catch(() => {})
    }

    window.addEventListener('jugueteria:catalog-updated', handleCatalogChange)

    return () => {
      active = false
      window.removeEventListener(
        'jugueteria:catalog-updated',
        handleCatalogChange,
      )
    }
  }, [])

  if (!catalog) return <CatalogLoading />

  return <CatalogoContent key={catalog.loadedAt} catalog={catalog} />
}

export default Catalogo
