import { Link } from 'react-router-dom'
import { useCart } from '../context/cartContext.js'
import { getSession } from '../services/authService.js'
import { ChristmasLights } from './ChristmasDecor.jsx'

function CartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function StoreBrand() {
  return (
    <Link
      to="/catalogo"
      className="group flex shrink-0 items-center gap-2.5"
      aria-label="Mi Juguetería, ir al catálogo"
    >
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-500 text-2xl shadow-md shadow-red-900/30 ring-2 ring-amber-300 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        🎄
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-2 text-base drop-shadow-sm"
        >
          🎅
        </span>
      </span>
      <span>
        <span className="block whitespace-nowrap font-festive text-xl font-bold leading-none tracking-wide text-red-800">
          Mi Juguetería
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          <span aria-hidden="true">❄</span>
          Especial Navidad
          <span aria-hidden="true">❄</span>
        </span>
      </span>
    </Link>
  )
}

/**
 * Encabezado compartido por catálogo, detalle y carrito.
 * El contador se lee del contexto, por lo que se actualiza al instante.
 */
export default function StoreHeader() {
  const { itemCount } = useCart()
  const session = getSession()

  return (
    <header className="sticky top-0 z-30">
      <div aria-hidden="true" className="christmas-stripes h-2 w-full" />

      <div className="border-b-2 border-red-900/15 bg-[#fffaf2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <StoreBrand />

          <nav
            className="flex items-center gap-1.5 sm:gap-2"
            aria-label="Navegación principal"
          >
            <Link
              to="/catalogo"
              className="hidden items-center rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:-rotate-2 hover:bg-red-50 hover:text-red-700 md:inline-flex"
            >
              Catálogo
            </Link>

            <span
              aria-hidden="true"
              className="hidden items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-sm lg:inline-flex"
            >
              🎁 Regalos de diciembre
            </span>

            {session ? (
              <>
                {session.role === 'admin' && (
                  <Link
                    to="/admin"
                    aria-label="Panel de administración"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:px-3"
                  >
                    <ShieldIcon />
                    <span className="hidden sm:inline">Panel admin</span>
                  </Link>
                )}
                <Link
                  to="/perfil"
                  className="inline-flex items-center rounded-full bg-white px-3 py-2 text-sm font-bold text-red-700 ring-2 ring-red-100 transition hover:-translate-y-0.5 hover:ring-amber-300"
                >
                  Mi perfil
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden items-center rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:-rotate-2 hover:bg-red-50 hover:text-red-700 sm:inline-flex"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="christmas-btn whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
                >
                  Crear cuenta
                </Link>
              </>
            )}

            <Link
              to="/carrito"
              aria-label={`Mi carrito, ${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}`}
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-red-700 ring-2 ring-red-100 transition hover:-translate-y-0.5 hover:ring-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              <CartIcon className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-bounce-in place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        <ChristmasLights
          count={26}
          className="h-4 border-t border-amber-200/60 bg-gradient-to-r from-red-800/5 via-transparent to-emerald-800/5 px-2"
        />
      </div>
    </header>
  )
}
