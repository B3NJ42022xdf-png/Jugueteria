import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AdminAvailability from '../components/AdminAvailability.jsx'
import AdminOrders from '../components/AdminOrders.jsx'
import AdminPerformance from '../components/AdminPerformance.jsx'
import AdminReviews from '../components/AdminReviews.jsx'
import StoreHeader from '../components/StoreHeader.jsx'
import { getSession } from '../services/authService.js'
import { formatBytes, optimizeImageFile } from '../services/imageService.js'
import {
  AGES,
  LOW_STOCK_THRESHOLD,
  createProduct,
  getCatalogMeta,
  listProducts,
  setProductActive,
  updateProduct,
  updateProductStock,
} from '../services/productService.js'

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('es-CO')

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024

const EMPTY_FORM = {
  name: '',
  brand: '',
  category: '',
  age: '3-5',
  price: '',
  stock: '0',
  image: '',
  description: '',
}

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'low', label: 'Stock bajo' },
]

function formatPrice(value) {
  return priceFormatter.format(Math.round(Number(value) || 0))
}

function stockTone(stock) {
  if (stock === 0) return 'bg-rose-50 text-rose-700 ring-rose-200'
  if (stock < LOW_STOCK_THRESHOLD) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
}

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function ShieldIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function PlusIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function AlertIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function EditIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function PowerIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v9" />
      <path d="M6.4 6.4a8 8 0 1 0 11.2 0" />
    </svg>
  )
}

function UploadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  )
}

function XIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  )
}

function LockIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Guardia de acceso                                                   */
/* ------------------------------------------------------------------ */
function AccessDenied({ email }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />
      <main className="grid flex-1 place-items-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-700">
            <LockIcon className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            Acceso restringido
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            El panel de administración solo está disponible para usuarios con
            rol Administrador. La sesión actual (
            <span className="break-all font-semibold text-slate-700">{email}</span>
            ) es de cliente.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              to="/perfil"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              Ir a mi perfil
            </Link>
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Formulario de alta / edición                                        */
/* ------------------------------------------------------------------ */

function ProductForm({ form, categories, brands, onChange, onClose, onSubmit, error }) {
  const editing = Boolean(form.editingId)
  const values = form.values
  const [imageNote, setImageNote] = useState('')
  const [optimizingImage, setOptimizingImage] = useState(false)

  async function handleImage(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      onChange({ error: 'Selecciona un archivo de imagen válido.' })
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      onChange({ error: 'La imagen no puede superar 1,5 MB.' })
      return
    }

    setOptimizingImage(true)
    setImageNote('')

    try {
      const optimized = await optimizeImageFile(file)
      onChange({ patch: { image: optimized.dataUrl }, error: '' })
      setImageNote(
        optimized.optimized
          ? `WebP ${optimized.width}×${optimized.height} · ${formatBytes(
              optimized.bytesBefore,
            )} → ${formatBytes(optimized.bytesAfter)} (−${optimized.savedPercent}%)`
          : `Imagen conservada · ${formatBytes(optimized.bytesAfter)} (ya era vectorial o no era más liviana en WebP)`,
      )
    } catch (readError) {
      onChange({
        error:
          readError instanceof Error
            ? readError.message
            : 'No pudimos leer la imagen.',
      })
    } finally {
      setOptimizingImage(false)
    }

    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-form-title"
          className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-violet-600">
                Panel de administración
              </p>
              <h2
                id="product-form-title"
                className="text-xl font-black tracking-tight text-slate-900"
              >
                {editing ? 'Editar juguete' : 'Registrar nuevo juguete'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar formulario"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-600">
                  Nombre del juguete *
                </span>
                <input
                  type="text"
                  required
                  value={values.name}
                  onChange={(event) =>
                    onChange({ values: { ...values, name: event.target.value } })
                  }
                  placeholder="Ej. Tren de madera magnético"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold text-slate-600">Marca *</span>
                <input
                  type="text"
                  required
                  list="admin-brands"
                  value={values.brand}
                  onChange={(event) =>
                    onChange({ values: { ...values, brand: event.target.value } })
                  }
                  placeholder="Ej. Hape"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <datalist id="admin-brands">
                  {brands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="text-[11px] font-bold text-slate-600">
                  Categoría *
                </span>
                <input
                  type="text"
                  required
                  list="admin-categories"
                  value={values.category}
                  onChange={(event) =>
                    onChange({
                      values: { ...values, category: event.target.value },
                    })
                  }
                  placeholder="Ej. Didácticos"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <datalist id="admin-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="text-[11px] font-bold text-slate-600">
                  Edad recomendada
                </span>
                <select
                  value={values.age}
                  onChange={(event) =>
                    onChange({ values: { ...values, age: event.target.value } })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                >
                  {AGES.map((age) => (
                    <option key={age} value={age}>
                      {age.replace('-', ' a ')} años
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[11px] font-bold text-slate-600">
                  Precio (COP) *
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={values.price}
                  onChange={(event) =>
                    onChange({ values: { ...values, price: event.target.value } })
                  }
                  placeholder="89900"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold text-slate-600">
                  Stock disponible *
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={values.stock}
                  onChange={(event) =>
                    onChange({ values: { ...values, stock: event.target.value } })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-600">
                  Imagen promocional
                </span>
                <div className="mt-1.5 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  {values.image ? (
                    <img
                      src={values.image}
                      alt="Vista previa del juguete"
                      width="96"
                      height="96"
                      decoding="async"
                      className="h-24 w-24 shrink-0 rounded-2xl border border-slate-200 bg-white object-cover"
                    />
                  ) : (
                    <span className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-4xl">
                      🧸
                    </span>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-violet-700 focus-within:ring-4 focus-within:ring-violet-200">
                        <UploadIcon />
                        {optimizingImage
                          ? 'Optimizando…'
                          : values.image
                            ? 'Reemplazar imagen'
                            : 'Cargar imagen'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImage}
                          disabled={optimizingImage}
                          className="sr-only"
                        />
                      </label>

                      {values.image && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange({ patch: { image: '' } })
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                      JPG, PNG, WebP o SVG · máximo 1,5 MB. Las fotos JPG/PNG se
                      redimensionan a 1200 px y se convierten a WebP para reducir
                      su peso sin perder calidad visible.
                    </p>
                    {imageNote && (
                      <p className="mt-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        ⚡ {imageNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold text-slate-600">
                  Descripción <span className="font-medium text-slate-400">(opcional)</span>
                </span>
                <textarea
                  rows={3}
                  maxLength={400}
                  value={values.description}
                  onChange={(event) =>
                    onChange({
                      values: { ...values, description: event.target.value },
                    })
                  }
                  placeholder="Materiales, contenido y beneficios del juguete."
                  className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300"
              >
                {editing ? 'Guardar cambios' : 'Registrar juguete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

function AdminPanel({ session }) {
  const [products, setProducts] = useState(() =>
    listProducts({ includeInactive: true }),
  )
  const [tab, setTab] = useState('inventory')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [pendingDeactivate, setPendingDeactivate] = useState(null)

  const meta = getCatalogMeta()

  const lowStock = products.filter(
    (product) => product.active && product.stock < LOW_STOCK_THRESHOLD,
  )
  const activeCount = products.filter((product) => product.active).length
  const inactiveCount = products.length - activeCount
  const inventoryValue = products
    .filter((product) => product.active)
    .reduce((total, product) => total + product.price * product.stock, 0)

  const visibleProducts = products.filter((product) => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(term)
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && product.active) ||
      (filter === 'inactive' && !product.active) ||
      (filter === 'low' && product.active && product.stock < LOW_STOCK_THRESHOLD)

    return matchesSearch && matchesFilter
  })

  function refresh() {
    setProducts(listProducts({ includeInactive: true }))
  }

  function openCreate() {
    setForm({ editingId: null, values: { ...EMPTY_FORM } })
    setFormError('')
  }

  function openEdit(product) {
    setForm({
      editingId: product.id,
      values: {
        name: product.name,
        brand: product.brand,
        category: product.category,
        age: product.age,
        price: String(product.price),
        stock: String(product.stock),
        image: product.image,
        description: product.description ?? '',
      },
    })
    setFormError('')
  }

  function handleSave(event) {
    event.preventDefault()
    setFormError('')

    try {
      const payload = {
        ...form.values,
        price: Number(form.values.price),
        stock: Number(form.values.stock),
      }

      if (form.editingId) {
        const updated = updateProduct(form.editingId, payload)
        setNotice(
          `Actualizamos "${updated.name}": precio ${formatPrice(
            updated.price,
          )} y ${updated.stock} unidades en stock.`,
        )
      } else {
        const created = createProduct(payload)
        setNotice(
          `Registramos "${created.name}" con ${created.stock} unidades en stock.`,
        )
      }

      refresh()
      setForm(null)
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'No pudimos guardar el juguete.',
      )
    }
  }

  function changeStock(product, delta) {
    const next = Math.max(0, product.stock + delta)

    try {
      updateProductStock(product.id, next)
      refresh()
      setNotice(
        next < LOW_STOCK_THRESHOLD
          ? `Stock de "${product.name}" actualizado a ${next} unidades. ¡Queda por debajo de ${LOW_STOCK_THRESHOLD}!`
          : `Stock de "${product.name}" actualizado a ${next} unidades.`,
      )
    } catch (stockError) {
      setNotice(
        stockError instanceof Error
          ? stockError.message
          : 'No pudimos actualizar el stock.',
      )
    }
  }

  function toggleActive(product) {
    try {
      const updated = setProductActive(product.id, !product.active)
      setNotice(
        updated.active
          ? `Reactivamos "${updated.name}". Ya vuelve a aparecer en el catálogo.`
          : `Dimos de baja "${updated.name}". Se conserva en el sistema y puede reactivarse.`,
      )
      setPendingDeactivate(null)
      refresh()
    } catch (toggleError) {
      setNotice(
        toggleError instanceof Error
          ? toggleError.message
          : 'No pudimos actualizar el estado.',
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <StoreHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <nav
            aria-label="Ruta de navegación"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm"
          >
            <Link to="/catalogo" className="font-semibold transition hover:text-violet-700">
              Catálogo
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700" aria-current="page">
              Administración
            </span>
          </nav>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-slate-900 via-violet-700 to-fuchsia-500" />
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-900 text-white">
                  <ShieldIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-600">
                    Módulo exclusivo · Rol Administrador
                  </p>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                    Panel de administración
                  </h1>
                  <p className="text-xs text-slate-500">
                    Catálogo, inventario, logística de pedidos y moderación de
                    opiniones de la juguetería.
                  </p>
                </div>
              </div>

              {tab === 'inventory' && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nuevo juguete
                </button>
              )}
            </div>
          </section>

          <nav
            aria-label="Secciones de administración"
            className="mt-4 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
          >
            <button
              type="button"
              onClick={() => setTab('inventory')}
              aria-pressed={tab === 'inventory'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                tab === 'inventory'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              🧸 Inventario
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              aria-pressed={tab === 'orders'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                tab === 'orders'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              📦 Pedidos y envíos
            </button>
            <button
              type="button"
              onClick={() => setTab('reviews')}
              aria-pressed={tab === 'reviews'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                tab === 'reviews'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              ⭐ Opiniones
            </button>
            <button
              type="button"
              onClick={() => setTab('performance')}
              aria-pressed={tab === 'performance'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                tab === 'performance'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              ⚡ Rendimiento
            </button>
            <button
              type="button"
              onClick={() => setTab('availability')}
              aria-pressed={tab === 'availability'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                tab === 'availability'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              🛡️ Disponibilidad
            </button>
          </nav>

          {tab === 'orders' ? (
            <div className="mt-4">
              <AdminOrders session={session} />
            </div>
          ) : tab === 'reviews' ? (
            <div className="mt-4">
              <AdminReviews />
            </div>
          ) : tab === 'performance' ? (
            <div className="mt-4">
              <AdminPerformance />
            </div>
          ) : tab === 'availability' ? (
            <div className="mt-4">
              <AdminAvailability />
            </div>
          ) : (
            <>
              <section aria-label="Resumen del inventario" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Activos
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Inactivos
              </p>
              <p className="mt-1 text-2xl font-black text-slate-500">{inactiveCount}</p>
            </div>
            <div className={`rounded-2xl border p-4 shadow-sm ${lowStock.length > 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className={`text-[10px] font-black uppercase tracking-wide ${lowStock.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                Stock bajo
              </p>
              <p className={`mt-1 text-2xl font-black ${lowStock.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {lowStock.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Valor inventario
              </p>
              <p className="mt-1 truncate text-lg font-black text-slate-900">
                {formatPrice(inventoryValue)}
              </p>
            </div>
          </section>

          {lowStock.length > 0 ? (
            <section
              role="alert"
              aria-labelledby="low-stock-title"
              className="mt-4 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-700">
                  <AlertIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 id="low-stock-title" className="text-sm font-black text-rose-800">
                    Alerta de stock: {lowStock.length}{' '}
                    {lowStock.length === 1 ? 'juguete' : 'juguetes'} con menos de{' '}
                    {LOW_STOCK_THRESHOLD} unidades
                  </h2>
                  <p className="mt-0.5 text-xs text-rose-600">
                    Repón el inventario para no perder ventas.
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-2">
                    {lowStock.map((product) => (
                      <li
                        key={product.id}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px]"
                      >
                        <span className="max-w-[180px] truncate font-bold text-slate-700">
                          {product.name}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 font-black ring-1 ${stockTone(product.stock)}`}>
                          {product.stock === 0 ? 'Agotado' : `${product.stock} u.`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : (
            <p className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              Inventario saludable: todos los juguetes activos tienen{' '}
              {LOW_STOCK_THRESHOLD} unidades o más.
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mt-4 flex items-start gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-semibold text-violet-700"
            >
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </p>
          )}

          <section aria-labelledby="inventario-title" className="mt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 id="inventario-title" className="text-xl font-black tracking-tight text-slate-900">
                  Inventario de juguetes
                </h2>
                <p className="text-xs text-slate-500">
                  {visibleProducts.length} de {products.length} productos ·{' '}
                  {numberFormatter.format(activeCount)} activos
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, marca o categoría"
                    aria-label="Buscar juguetes en el inventario"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:w-72"
                  />
                </div>

                <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Filtrar inventario">
                  {FILTERS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFilter(option.value)}
                      aria-pressed={filter === option.value}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                        filter === option.value
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {visibleProducts.map((product) => (
                <li key={product.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                    <img
                      src={product.image}
                      alt=""
                      width="64"
                      height="64"
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 shrink-0 rounded-2xl border border-slate-100 bg-slate-50 object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-black text-slate-900">{product.name}</p>
                        {!product.active && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-500">
                            Inactivo
                          </span>
                        )}
                        {product.stock < LOW_STOCK_THRESHOLD && product.active && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-rose-600 ring-1 ring-rose-200">
                            Stock bajo
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {product.brand} · {product.category} · {product.age.replace('-', ' a ')} años
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                        {product.id}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Precio
                      </p>
                      <p className="text-base font-black tabular-nums text-slate-900">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        Stock
                      </span>
                      <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => changeStock(product, -1)}
                          disabled={product.stock === 0}
                          aria-label={`Reducir stock de ${product.name}`}
                          className="grid h-8 w-8 place-items-center text-base font-black text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className={`min-w-12 px-2 py-1 text-center text-xs font-black ring-1 ring-inset ${stockTone(product.stock)}`}>
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeStock(product, 1)}
                          aria-label={`Aumentar stock de ${product.name}`}
                          className="grid h-8 w-8 place-items-center text-base font-black text-slate-500 transition hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>
                      {product.stock < LOW_STOCK_THRESHOLD && (
                        <span className="text-[10px] font-semibold text-rose-500">
                          &lt; {LOW_STOCK_THRESHOLD} unidades
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        <EditIcon />
                        Editar
                      </button>

                      {pendingDeactivate === product.id ? (
                        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1">
                          <span className="text-[10px] font-bold text-rose-700">
                            ¿Dar de baja?
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleActive(product)}
                            className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-black text-white transition hover:bg-rose-700"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeactivate(null)}
                            className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[10px] font-bold text-rose-700 transition hover:bg-rose-100"
                          >
                            Cancelar
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            product.active
                              ? setPendingDeactivate(product.id)
                              : toggleActive(product)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-black transition ${
                            product.active
                              ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <PowerIcon />
                          {product.active ? 'Dar de baja' : 'Reactivar'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {visibleProducts.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <span className="text-4xl" aria-hidden="true">
                  🔎
                </span>
                <h3 className="mt-3 text-base font-black text-slate-900">
                  No encontramos juguetes
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Prueba con otra búsqueda o cambia el filtro del inventario.
                </p>
              </div>
            )}
          </section>

          <p className="mt-6 flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
            <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            Los cambios se guardan de inmediato en este dispositivo y se
            reflejan en el catálogo público. La baja es lógica: el juguete no se
            elimina y puede reactivarse. En producción, estas acciones deben
            validarse en el servidor con el rol del usuario.
          </p>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Mi Juguetería · Panel de administración
      </footer>

      {form && (
        <ProductForm
          form={form}
          categories={meta.categories}
          brands={meta.brands}
          error={formError}
          onChange={({ values, patch, error }) => {
            if (values || patch) {
              setForm((current) => ({
                ...current,
                values: { ...current.values, ...(values ?? patch) },
              }))
            }
            if (error !== undefined) setFormError(error)
          }}
          onClose={() => {
            setForm(null)
            setFormError('')
          }}
          onSubmit={handleSave}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Entrada protegida                                                   */
/* ------------------------------------------------------------------ */

export default function Admin() {
  const [session] = useState(() => getSession())

  if (!session) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />
  }

  if (session.role !== 'admin') {
    return <AccessDenied email={session.email} />
  }

  return <AdminPanel session={session} />
}
