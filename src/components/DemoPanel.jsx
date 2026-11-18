import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/cartContext.js'
import { storeDemoCheckoutPrefill } from '../lib/demoMode.js'
import { showToast, TOAST_KINDS } from '../lib/toast.js'
import { listProducts } from '../services/productService.js'
import ContestBanner from './ContestBanner.jsx'
import { Bolt, GraduationCap, Star, Ticket, X } from './icons.jsx'

const priceFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PREFERRED_DEMO_PRODUCT_ID = 'santa-peluche-gigante'

function formatPrice(value) {
  return priceFormatter.format(value)
}

/** Elige un juguete con stock para que la demo nunca falle por inventario. */
function pickDemoProduct() {
  const products = listProducts()
  const preferred = products.find(
    (product) => product.id === PREFERRED_DEMO_PRODUCT_ID && product.stock > 0,
  )

  return preferred ?? products.find((product) => product.stock > 0) ?? null
}

function DemoAction({ icon: ActionIcon, title, hint, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-amber-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-red-700 ring-1 ring-amber-200 transition group-hover:bg-red-700 group-hover:text-white">
        <ActionIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-extrabold leading-snug text-toy-ink">
          {title}
        </span>
        <span className="block text-[10px] font-semibold leading-snug text-slate-500">
          {hint}
        </span>
      </span>
      {badge && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
          {badge}
        </span>
      )}
    </button>
  )
}

/**
 * Modo Demostración / Panel del Jurado.
 *
 * Botón flotante discreto que abre acciones de presentación:
 *  1. Compra rápida: agrega un producto si el carrito está vacío, navega al
 *     checkout y lo prellena con datos de prueba realistas.
 *  2. Cupón navideño: aplica NAVIDAD20 al carrito.
 *  3. Estado del concurso: muestra el banner con la cuenta regresiva oficial.
 *
 * No se muestra en el panel de administración para no mezclar la demo con la
 * gestión real de la tienda.
 */
export default function DemoPanel() {
  const { itemCount, subtotal, coupon, addItem, applyCoupon } = useCart()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [contestOpen, setContestOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleQuickPurchase() {
    setOpen(false)

    try {
      let addedProduct = null

      if (itemCount === 0) {
        const product = pickDemoProduct()

        if (!product) {
          throw new Error('No hay juguetes disponibles para la demostración.')
        }

        await addItem(product.id, 1)
        addedProduct = product
      }

      storeDemoCheckoutPrefill()
      navigate('/checkout')
      window.scrollTo({ top: 0, behavior: 'smooth' })

      showToast({
        kind: TOAST_KINDS.SUCCESS,
        title: 'Compra rápida lista',
        message: addedProduct
          ? `Agregamos ${addedProduct.name} y cargamos datos de prueba. Revisa y confirma.`
          : 'Cargamos datos de prueba en el checkout. Revisa y confirma.',
        image: addedProduct
          ? (addedProduct.imageUrl ?? addedProduct.image)
          : '',
        href: '/checkout',
        actionLabel: 'Ir al checkout →',
      })
    } catch (error) {
      showToast({
        kind: TOAST_KINDS.ERROR,
        title: 'No pudimos preparar la demo',
        message:
          error instanceof Error
            ? error.message
            : 'Inténtalo de nuevo en unos segundos.',
      })
    }
  }

  function handleApplyCoupon() {
    setOpen(false)

    if (coupon?.code === 'NAVIDAD20') {
      showToast({
        kind: TOAST_KINDS.INFO,
        title: 'Cupón ya aplicado',
        message: 'NAVIDAD20 sigue activo en tu carrito.',
        href: '/carrito',
        actionLabel: 'Ver carrito →',
      })
      return
    }

    const result = applyCoupon('NAVIDAD20')

    if (!result.ok) {
      showToast({
        kind: TOAST_KINDS.ERROR,
        title: 'No se pudo aplicar el cupón',
        message: result.message,
      })
      return
    }

    showToast({
      kind: TOAST_KINDS.COUPON,
      title: 'NAVIDAD20 aplicado',
      message:
        itemCount > 0
          ? `20% de descuento: ahorras ${formatPrice(subtotal * 0.2)}.`
          : 'Agrega juguetes para que el descuento se refleje en el total.',
      href: '/carrito',
      actionLabel: 'Ver carrito →',
    })
  }

  function handleContestStatus() {
    setOpen(false)
    setContestOpen(true)
  }

  if (pathname.startsWith('/admin')) return null

  return (
    <>
      <div
        ref={wrapperRef}
        className="fixed bottom-4 left-4 z-[80] sm:bottom-5 sm:left-5"
      >
        {open && (
          <div
            id="demo-jury-menu"
            role="group"
            aria-label="Acciones del Panel del Jurado"
            className="absolute bottom-14 left-0 w-72 max-w-[calc(100vw-2rem)] animate-pop-in rounded-2xl border-[3px] border-amber-200 bg-[#fffaf2] p-2 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-start gap-2 px-2 pb-2 pt-1">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-200 text-red-800">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-extrabold leading-tight text-toy-ink">
                  Panel del Jurado
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Modo demostración
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar Panel del Jurado"
                className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-slate-400 transition hover:bg-amber-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <DemoAction
                icon={Bolt}
                title="Simular Compra Rápida"
                hint="Checkout con datos de prueba listos"
                onClick={handleQuickPurchase}
              />
              <DemoAction
                icon={Ticket}
                title="Aplicar Cupón Navideño"
                hint="NAVIDAD20 · 20% de descuento"
                badge={coupon?.code === 'NAVIDAD20' ? 'Activo' : null}
                onClick={handleApplyCoupon}
              />
              <DemoAction
                icon={Star}
                title="Estado del Concurso"
                hint="Cuenta regresiva 24 y 25 de diciembre"
                onClick={handleContestStatus}
              />
            </div>

            <p className="px-2 pb-1 pt-2 text-[9px] font-semibold leading-snug text-slate-400">
              Solo para la presentación · Los datos de pago son ficticios y no
              se envían a ningún servidor.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="demo-jury-menu"
          aria-label={
            open
              ? 'Cerrar Modo Demostración / Panel del Jurado'
              : 'Abrir Modo Demostración / Panel del Jurado'
          }
          title="Modo Demostración / Panel del Jurado"
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-red-900 opacity-80 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.65)] ring-2 ring-white/70 transition hover:-translate-y-0.5 hover:opacity-100 focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-4 focus-visible:ring-amber-300/60"
        >
          <GraduationCap className="h-5 w-5" />
        </button>
      </div>

      {contestOpen && (
        <ContestBanner onClose={() => setContestOpen(false)} />
      )}
    </>
  )
}
