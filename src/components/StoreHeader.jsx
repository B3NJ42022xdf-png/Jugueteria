import { Link } from 'react-router-dom'
import { useCart } from '../context/cartContext.js'
import { getSession } from '../services/authService.js'

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
    <Link to="/catalogo" className="flex shrink-0 items-center gap-2.5" aria-label="Mi Juguetería, ir al catálogo">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xl shadow-md shadow-fuchsia-500/30">
        🧸
      </span>
      <span>
        <span className="block whitespace-nowrap text-base font-black tracking-tight text-slate-900">
          Mi Juguetería
        </span>
        <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
          Juguetes que despiertan sonrisas
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <StoreBrand />

        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Navegación principal">
          <Link
            to="/catalogo"
            className="hidden items-center rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:inline-flex"
          >
            Catálogo
          </Link>

          {session ? (
            <>
              {session.role === 'admin' && (
                <Link
                  to="/admin"
                  aria-label="Panel de administración"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-2 text-sm font-bold text-white transition hover:bg-slate-800 sm:px-3"
                >
                  <ShieldIcon />
                  <span className="hidden sm:inline">Panel admin</span>
                </Link>
              )}
              <Link
                to="/perfil"
                className="inline-flex items-center rounded-full bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100 hover:text-violet-800"
              >
                Mi perfil
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden items-center rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registro"
                className="whitespace-nowrap rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
              >
                Crear cuenta
              </Link>
            </>
          )}

          <Link
            to="/carrito"
            aria-label={`Mi carrito, ${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}`}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-fuchsia-600 px-1 text-[10px] font-black text-white shadow-sm"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  )
}
