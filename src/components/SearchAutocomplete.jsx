import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { normalizeText } from '../lib/catalog.js'

const MAX_SUGGESTIONS = 6

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function XIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

/**
 * Buscador del catálogo con autocompletado.
 *
 * Mientras el usuario escribe se filtran los productos en tiempo real (el
 * término se eleva al catálogo, que ya aplica `filterAndSortProducts`) y, además,
 * se muestra una lista flotante con las coincidencias más populares. La lista
 * se puede recorrer con las flechas y elegir con Enter.
 */
export default function SearchAutocomplete({
  products,
  value,
  onChange,
  placeholder = 'Busca: Papá Noel, regalos, árbol, elfos…',
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listId = useId()
  const term = normalizeText(value)

  const suggestions = useMemo(() => {
    if (term.length < 2) return []

    return products
      .map((product) => {
        const name = normalizeText(product.name)
        const haystack = normalizeText(
          [
            product.name,
            product.category,
            product.brand,
            ...(product.tags ?? []),
          ].join(' '),
        )

        // 0 = el nombre empieza con el término, 1 = lo contiene, 2 = coincide
        // en categoría, marca o etiquetas.
        const score = name.startsWith(term) ? 0 : name.includes(term) ? 1 : 2

        return { product, haystack, score }
      })
      .filter(({ haystack }) => haystack.includes(term))
      .sort(
        (a, b) =>
          a.score - b.score ||
          (b.product.popularity ?? 0) - (a.product.popularity ?? 0),
      )
      .slice(0, MAX_SUGGESTIONS)
      .map(({ product }) => product)
  }, [products, term])

  const showList = open && suggestions.length > 0
  const anchorRef = useRef(null)
  const listRef = useRef(null)
  const [listStyle, setListStyle] = useState(null)

  // La lista se dibuja en un portal con posición fija: así no la recorta el
  // `overflow-hidden` del banner ni queda debajo de otros elementos. Medimos el
  // input al abrir (nunca dentro de un efecto) para calcular la posición.
  function measureAnchor() {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return null

    const available = window.innerHeight - rect.bottom - 16

    return {
      position: 'fixed',
      top: rect.bottom + 8,
      left: Math.max(8, rect.left),
      width: Math.min(rect.width, window.innerWidth - 16),
      maxHeight: Math.max(160, Math.min(304, available)),
      zIndex: 80,
    }
  }

  function openList() {
    const style = measureAnchor()
    if (style) setListStyle(style)
    setOpen(true)
  }

  // Si la página se desplaza o cambia de tamaño, cerramos para no dejar la
  // lista flotando lejos del buscador.
  useEffect(() => {
    if (!showList) return undefined

    const dismiss = (event) => {
      // Desplazarse dentro de la propia lista no debe cerrarla.
      if (listRef.current?.contains(event.target)) return
      setOpen(false)
      setActiveIndex(-1)
    }

    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)

    return () => {
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [showList])

  function closeList() {
    setOpen(false)
    setActiveIndex(-1)
  }

  function selectProduct(product) {
    onChange(product.name)
    closeList()
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!showList) {
        openList()
        return
      }
      setActiveIndex((index) => (index + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      if (!showList) return
      event.preventDefault()
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      )
      return
    }

    if (event.key === 'Enter') {
      if (showList && activeIndex >= 0) {
        event.preventDefault()
        selectProduct(suggestions[activeIndex])
      } else {
        closeList()
      }
      return
    }

    if (event.key === 'Escape') {
      closeList()
    }
  }

  return (
    <div
      ref={anchorRef}
      className="relative"
      onBlur={(event) => {
        // Solo cerramos si el foco sale del buscador y de la lista.
        if (!event.currentTarget.contains(event.relatedTarget)) closeList()
      }}
    >
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-red-700" />

      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          openList()
          setActiveIndex(-1)
        }}
        onFocus={openList}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Buscar juguetes por nombre o etiqueta"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && activeIndex >= 0
            ? `${listId}-option-${activeIndex}`
            : undefined
        }
        autoComplete="off"
        className="w-full rounded-2xl border-[3px] border-amber-200 bg-white py-4 pl-12 pr-12 text-base font-semibold text-slate-900 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)] outline-none placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-300/40"
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            closeList()
          }}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:rotate-90 hover:bg-red-50 hover:text-red-700"
        >
          <XIcon />
        </button>
      )}

      {showList &&
        listStyle &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Sugerencias de búsqueda"
            style={listStyle}
            className="overflow-y-auto rounded-2xl border-[3px] border-amber-200 bg-white p-1.5 shadow-[0_24px_50px_-20px_rgba(127,29,29,0.45)]"
          >
          <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Sugerencias
          </p>

          {suggestions.map((product, index) => {
            const isActive = index === activeIndex

            return (
              <button
                key={product.id}
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectProduct(product)}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                  isActive ? 'bg-red-50' : 'hover:bg-red-50'
                }`}
              >
                <img
                  src={product.imageUrl ?? product.image}
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-amber-100"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-toy-ink">
                    {product.name}
                  </span>
                  <span className="block truncate text-[11px] font-semibold text-slate-500">
                    {product.category} · {product.brand}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-extrabold tabular-nums text-red-700">
                  {priceFormatter.format(product.price)}
                </span>
              </button>
            )
          })}

          <p className="px-3 py-1.5 text-center text-[11px] font-semibold text-slate-400">
            {suggestions.length}{' '}
            {suggestions.length === 1 ? 'sugerencia' : 'sugerencias'} · usa las
            flechas y Enter
          </p>
          </div>,
          document.body,
        )}
    </div>
  )
}
