import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import StoreHeader from '../components/StoreHeader.jsx'
import {
  ChristmasCountdown,
  ChristmasLights,
  SantaScene,
} from '../components/ChristmasDecor.jsx'
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

const QUICK_SEARCHES = ['Navidad', 'Papá Noel', 'Regalos', 'Árbol']

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
    <div className="border-t-2 border-dashed border-[#ffe3c2] pt-5">
      <h3 className="mb-3 font-display text-sm font-extrabold text-toy-ink">
        {title}
      </h3>
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
    <div className="rounded-[28px] border-[3px] border-[#ffe3c2] bg-white p-5 shadow-[0_16px_36px_-26px_rgba(120,70,30,0.45)]">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-extrabold text-toy-ink">
            Filtros
          </h2>
          {activeFilterCount > 0 && (
            <span className="grid h-5 min-w-5 animate-bounce-in place-items-center rounded-full bg-toy-coral px-1.5 text-[11px] font-black text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-extrabold text-toy-coral underline-offset-4 transition hover:text-toy-orange hover:underline"
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
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-toy-coral"
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
          className="toy-input w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700"
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
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-toy-coral"
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
              className="mt-2 w-full cursor-pointer accent-toy-coral"
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
              className="mt-2 w-full cursor-pointer accent-toy-coral"
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

  function showChristmasProducts() {
    setSearch('')
    setSelectedCategories(['Navidad'])
    setSelectedBrands([])
    setAgeFilter('all')
    setMinPrice(PRICE_MIN)
    setMaxPrice(meta.priceMax)
    setSort('popularity')
    window.setTimeout(() => {
      document
        .getElementById('resultados-title')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <div className="toy-dots flex min-h-screen flex-col bg-toy-cream text-toy-ink">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[36px] border-[3px] border-amber-300 bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#14532d] px-6 py-10 text-white shadow-[0_30px_70px_-34px_rgba(127,29,29,0.75)] sm:px-10 sm:py-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-300/20 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-emerald-400/20 blur-2xl"
            />
            <ChristmasLights
              count={32}
              className="absolute inset-x-0 top-0 h-6 px-3 opacity-90"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-14 animate-twinkle text-3xl sm:left-6"
            >
              ⭐
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-8 right-6 hidden animate-twinkle text-3xl [animation-delay:0.7s] sm:block"
            >
              ✨
            </span>

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
              <div className="max-w-2xl animate-slide-up">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-red-900 shadow-sm ring-2 ring-amber-200/60">
                  🎄 Especial Navidad · Diciembre
                </span>
                <h1 className="christmas-glow-text mt-3 font-festive text-4xl font-bold leading-[1.05] tracking-wide text-white sm:text-6xl">
                  La Navidad llegó a{' '}
                  <span className="text-amber-300">Mi Juguetería</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-amber-50/90 sm:text-base">
                  Papá Noel y sus elfos ya están preparando los regalos. Descubre
                  juguetes, decoración y sorpresas de diciembre para toda la
                  familia.
                </p>

                <ChristmasCountdown className="mt-5" />

                <div className="relative mt-6 animate-slide-up stagger-2">
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-700" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Busca: Papá Noel, regalos, árbol, elfos…"
                    aria-label="Buscar juguetes por nombre o etiqueta"
                    className="w-full rounded-2xl border-[3px] border-amber-200 bg-white py-4 pl-12 pr-12 text-base font-semibold text-slate-900 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)] outline-none placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-300/40"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:rotate-90 hover:bg-red-50 hover:text-red-700"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 animate-slide-up stagger-3">
                  <span className="text-xs font-bold text-amber-100/80">
                    Prueba con:
                  </span>
                  {QUICK_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setSearch(term)}
                      className="rounded-full border-2 border-white/30 bg-white/10 px-3 py-1 text-xs font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:text-red-800"
                    >
                      {term}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 animate-slide-up stagger-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={showChristmasProducts}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-red-900 shadow-[0_5px_0_#b7791f] transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/70"
                  >
                    🎁 Ver juguetes de Navidad
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    ❄️ Ver todo el catálogo
                  </button>
                </div>
              </div>

              <div className="relative hidden flex-col items-center justify-center lg:flex">
                <SantaScene />
                <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-amber-200">
                  Papá Noel y sus elfos te esperan
                </p>
              </div>
            </div>

            <div className="relative mt-7 flex justify-center lg:hidden">
              <SantaScene compact />
            </div>
          </section>

          <div className="mt-6 grid gap-3 animate-slide-up stagger-4 sm:grid-cols-3">
            {[
              { emoji: '🎁', title: 'Regalos de diciembre', text: 'Listos para sorprender' },
              { emoji: '🚚', title: 'Envío navideño', text: 'A todo el país' },
              { emoji: '❄️', title: 'Magia garantizada', text: 'Juguetes certificados' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-xl ring-2 ring-amber-100" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-extrabold text-toy-ink">
                    {item.title}
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">
                    {item.text}
                  </span>
                </span>
              </div>
            ))}
          </div>

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
                  <h2 id="resultados-title" className="font-display text-2xl font-extrabold tracking-tight text-toy-ink">
                    Juguetes
                  </h2>
                  <p className="text-sm font-semibold text-slate-500" aria-live="polite">
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
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[#ffe3c2] bg-white px-3 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-toy-sun lg:hidden"
                  >
                    <FilterIcon className="h-4 w-4" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-toy-coral px-1.5 text-[11px] font-black text-white">
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
                    className="toy-input rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700"
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
                    <div
                      key={product.id}
                      className="animate-pop-in"
                      style={{
                        animationDelay: `${Math.min(index, 9) * 70}ms`,
                      }}
                    >
                      <ProductCard
                        product={product}
                        priority={index < 3}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="animate-pop-in rounded-[30px] border-[3px] border-dashed border-[#ffd9a8] bg-white px-6 py-14 text-center">
                  <div
                    className="mx-auto flex h-28 w-28 animate-float items-center justify-center rounded-full bg-gradient-to-br from-toy-sun/50 via-toy-orange/20 to-toy-bubble/20 text-5xl"
                    aria-hidden="true"
                  >
                    🧸
                  </div>
                  <div
                    className="mx-auto -mt-3 grid h-11 w-11 place-items-center rounded-full bg-white text-toy-coral shadow-md ring-2 ring-[#ffe3c2]"
                    aria-hidden="true"
                  >
                    <SearchIcon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-toy-ink">
                    No encontramos ese juguete
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                    Parece que la búsqueda no coincide con nada de nuestro catálogo. Prueba con
                    otra palabra o ajusta los filtros de categoría, edad, marca y precio.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="toy-btn mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toy-sun/60"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="relative mt-6 overflow-hidden border-t-2 border-red-900/10 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#14532d] py-7 text-center text-white">
        <div aria-hidden="true" className="christmas-stripes h-1.5 w-full" />
        <p className="mt-4 font-festive text-lg font-bold tracking-wide text-amber-200">
          🎄 Mi Juguetería · Especial Navidad
        </p>
        <p className="mt-1 text-xs font-semibold text-amber-50/80">
          Juguetes seguros para cada etapa · Papá Noel y sus elfos te desean
          felices fiestas
        </p>
      </footer>
    </div>
  )
}

function CatalogLoading() {
  return (
    <div className="toy-dots flex min-h-screen flex-col bg-toy-cream text-toy-ink">
      <StoreHeader />
      <main className="flex-1" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-56 animate-pulse rounded-[36px] bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#14532d]" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="hidden h-96 animate-pulse rounded-[28px] bg-white lg:block" />
            <div>
              <p className="font-display text-sm font-bold text-slate-500">
                Cargando catálogo…
              </p>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[28px] border-[3px] border-[#ffe3c2] bg-white"
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
