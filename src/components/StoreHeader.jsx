import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/cartContext.js'
import { useFavorites } from '../context/favoritesContext.js'
import { useSnow } from '../context/snowContext.js'
import {
  SESSION_CHANGED_EVENT,
  SESSION_STORAGE_KEY,
  getSession,
  getSessionDisplayName,
  logoutUser,
} from '../services/authService.js'
import AuthModal from './AuthModal.jsx'
import { ChristmasLights } from './ChristmasDecor.jsx'
import {
  ChristmasTree,
  Gift,
  Heart,
  HeartFilled,
  Snowflake,
  SnowflakeOff,
  TeddyBear,
} from './icons.jsx'

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

function PackageIcon({ className = 'h-4 w-4' }) {
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
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}

function UserIcon({ className = 'h-4 w-4' }) {
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
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function MenuIcon({ open }) {
  return open ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  )
}

function LogoutIcon({ className = 'h-4 w-4' }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
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
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-500 text-amber-100 shadow-md shadow-red-900/30 ring-2 ring-amber-300 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <ChristmasTree className="h-6 w-6" />
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-red-600 shadow-sm ring-2 ring-amber-300"
        >
          <Gift className="h-3 w-3" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap font-festive text-lg font-bold leading-none tracking-wide text-red-800 sm:text-xl">
          Mi Juguetería
        </span>
        <span className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-wide text-emerald-700 sm:text-[10px]">
          <Snowflake className="h-3 w-3" />
          Especial Navidad
          <Snowflake className="h-3 w-3" />
        </span>
      </span>
    </Link>
  )
}

const linkBase =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70'

/**
 * Encabezado compartido por catálogo, detalle y carrito.
 *
 * Incluye el menú móvil, el estado reactivo de la sesión y los modales de
 * acceso. El contador del carrito se lee del contexto, por lo que se actualiza
 * al instante en todas las páginas.
 */
export default function StoreHeader() {
  const { itemCount } = useCart()
  const { count: favoriteCount } = useFavorites()
  const { snowEnabled, toggleSnow } = useSnow()
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(() => getSession())
  const [authRequest, setAuthRequest] = useState(null)
  const [menuOpenPath, setMenuOpenPath] = useState(null)

  const displayName = session ? getSessionDisplayName(session) : ''
  const firstName = displayName.split(/\s+/)[0] ?? ''
  const initial = (displayName || session?.email || 'C').charAt(0).toUpperCase()

  // El menú se considera abierto solo mientras sigamos en la ruta donde se
  // abrió. Así se cierra solo al navegar, sin efectos que sincronicen estado.
  const menuOpen = menuOpenPath === location.pathname

  const closeMenu = useCallback(() => setMenuOpenPath(null), [])

  const openAuth = useCallback((mode) => {
    setMenuOpenPath(null)
    setAuthRequest((current) => ({
      mode,
      id: (current?.id ?? 0) + 1,
    }))
  }, [])

  const closeAuth = useCallback(() => setAuthRequest(null), [])

  const handleAuthenticated = useCallback(() => {
    setSession(getSession())
  }, [])

  useEffect(() => {
    function syncSession() {
      setSession(getSession())
    }

    function handleStorage(event) {
      if (event.key && event.key !== SESSION_STORAGE_KEY) return
      syncSession()
    }

    window.addEventListener(SESSION_CHANGED_EVENT, syncSession)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, syncSession)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') setMenuOpenPath(null)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  function handleLogout() {
    logoutUser()
    setSession(null)
    setMenuOpenPath(null)
    navigate('/catalogo')
  }

  return (
    <header className="sticky top-0 z-30">
      <div aria-hidden="true" className="christmas-stripes h-2 w-full" />

      <div className="border-b-2 border-red-900/15 bg-[#fffaf2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 lg:px-8">
          <StoreBrand />

          <nav
            className="hidden items-center gap-1.5 md:flex"
            aria-label="Navegación principal"
          >
            <Link
              to="/catalogo"
              className={`${linkBase} text-slate-600 hover:-rotate-2 hover:bg-red-50 hover:text-red-700`}
            >
              Catálogo
            </Link>

            <span
              aria-hidden="true"
              className="hidden items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-sm lg:inline-flex"
            >
              <Gift className="h-3.5 w-3.5" /> Regalos de diciembre
            </span>

            {session ? (
              <>
                {session.role === 'admin' && (
                  <Link
                    to="/admin"
                    aria-label="Panel de administración"
                    className={`${linkBase} bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800`}
                  >
                    <ShieldIcon />
                    <span className="hidden xl:inline">Panel admin</span>
                  </Link>
                )}

                <Link
                  to="/mis-pedidos"
                  className={`${linkBase} text-slate-600 hover:-rotate-2 hover:bg-red-50 hover:text-red-700`}
                >
                  <PackageIcon />
                  <span>Mis pedidos</span>
                </Link>

                <Link
                  to="/perfil"
                  aria-label={`Mi perfil, ${displayName}`}
                  className={`${linkBase} bg-white text-red-700 ring-2 ring-red-100 hover:-translate-y-0.5 hover:ring-amber-300`}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-[11px] font-black text-white"
                  >
                    {initial}
                  </span>
                  <span className="hidden max-w-[9rem] truncate lg:inline">
                    Hola, {firstName}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className={`${linkBase} text-slate-600 hover:-rotate-2 hover:bg-red-50 hover:text-red-700`}
                >
                  <UserIcon />
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="christmas-btn inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
                >
                  Crear cuenta
                </button>
              </>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/favoritos"
              aria-label={`Mis favoritos, ${favoriteCount} ${favoriteCount === 1 ? 'juguete guardado' : 'juguetes guardados'}`}
              title="Mis favoritos"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-rose-600 ring-2 ring-rose-100 transition hover:-translate-y-0.5 hover:ring-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              {favoriteCount > 0 ? (
                <HeartFilled className="h-5 w-5" />
              ) : (
                <Heart className="h-5 w-5" />
              )}
              {favoriteCount > 0 && (
                <span
                  key={favoriteCount}
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-cart-bump place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white"
                >
                  {favoriteCount > 99 ? '99+' : favoriteCount}
                </span>
              )}
            </Link>

            <Link
              to="/carrito"
              aria-label={`Mi carrito, ${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}`}
              title="Mi carrito"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-red-700 ring-2 ring-red-100 transition hover:-translate-y-0.5 hover:ring-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              <CartIcon className="h-5 w-5" />
              {itemCount > 0 && (
                <span
                  key={itemCount}
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-cart-bump place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleSnow}
              aria-pressed={snowEnabled}
              aria-label={
                snowEnabled
                  ? 'Desactivar la nieve animada'
                  : 'Activar la nieve animada'
              }
              title={snowEnabled ? 'Desactivar nieve' : 'Activar nieve'}
              className={`hidden h-10 w-10 place-items-center rounded-full bg-white ring-2 transition hover:-translate-y-0.5 hover:ring-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 sm:grid ${
                snowEnabled
                  ? 'text-sky-600 ring-sky-100'
                  : 'text-slate-400 ring-slate-100'
              }`}
            >
              {snowEnabled ? (
                <Snowflake className="h-5 w-5" />
              ) : (
                <SnowflakeOff className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setMenuOpenPath(menuOpen ? null : location.pathname)
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-red-700 ring-2 ring-red-100 transition hover:-translate-y-0.5 hover:ring-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 md:hidden"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="border-t-2 border-amber-100 bg-[#fffaf2] px-3 pb-4 pt-3 md:hidden"
          >
            <nav aria-label="Navegación móvil" className="mx-auto max-w-7xl space-y-1.5">
              <Link
                to="/catalogo"
                onClick={closeMenu}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
              >
                <TeddyBear className="h-4 w-4" /> Catálogo de juguetes
              </Link>

              <Link
                to="/favoritos"
                onClick={closeMenu}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
              >
                <Heart className="h-4 w-4" />
                Mis favoritos
                {favoriteCount > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
                    {favoriteCount > 99 ? '99+' : favoriteCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={toggleSnow}
                aria-pressed={snowEnabled}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
              >
                {snowEnabled ? (
                  <Snowflake className="h-4 w-4 text-sky-600" />
                ) : (
                  <SnowflakeOff className="h-4 w-4 text-slate-400" />
                )}
                Nieve animada
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    snowEnabled
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {snowEnabled ? 'Activada' : 'Desactivada'}
                </span>
              </button>

              {session ? (
                <>
                  <div className="rounded-2xl border-2 border-amber-100 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                      Sesión iniciada
                    </p>
                    <p className="mt-0.5 truncate font-display text-base font-extrabold text-toy-ink">
                      {displayName}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {session.email}
                    </p>
                  </div>

                  <Link
                    to="/mis-pedidos"
                    onClick={closeMenu}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <PackageIcon className="h-4 w-4" />
                    Mis pedidos
                  </Link>

                  <Link
                    to="/perfil"
                    onClick={closeMenu}
                    className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <UserIcon className="h-4 w-4" />
                    Mi perfil
                  </Link>

                  {session.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={closeMenu}
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                    >
                      <ShieldIcon className="h-4 w-4" />
                      Panel de administración
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogoutIcon />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <UserIcon />
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="christmas-btn flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
                  >
                    Crear cuenta
                  </button>
                </>
              )}
            </nav>
          </div>
        )}

        <ChristmasLights
          count={26}
          className="h-4 border-t border-amber-200/60 bg-gradient-to-r from-red-800/5 via-transparent to-emerald-800/5 px-2"
        />
      </div>

      <AuthModal
        key={authRequest?.id ?? 'closed'}
        open={Boolean(authRequest)}
        initialMode={authRequest?.mode ?? 'login'}
        onClose={closeAuth}
        onAuthenticated={handleAuthenticated}
      />
    </header>
  )
}
