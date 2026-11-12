import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import CartToast from './components/CartToast.jsx'
import Snowfall from './components/Snowfall.jsx'
import Catalogo from './page/Catalogo'

/**
 * El catálogo se carga de inmediato (es la ruta de entrada), mientras que las
 * páginas pesadas (admin, perfil, detalle) se descargan solo cuando el usuario
 * las visita. Esto reduce el JavaScript inicial y mejora el LCP.
 */
const Admin = lazy(() => import('./page/Admin'))
const CalificarProducto = lazy(() => import('./page/CalificarProducto'))
const Carrito = lazy(() => import('./page/Carrito'))
const Checkout = lazy(() => import('./page/Checkout'))
const Login = lazy(() => import('./page/Login'))
const OrdenDetalle = lazy(() => import('./page/OrdenDetalle'))
const Perfil = lazy(() => import('./page/Perfil'))
const ProductoDetalle = lazy(() => import('./page/ProductoDetalle'))
const Registro = lazy(() => import('./page/Registro'))

const ROUTE_TITLES = [
  { prefix: '/producto/', title: 'Detalle del juguete' },
  { prefix: '/calificar/', title: 'Calificar producto' },
  { prefix: '/orden/', title: 'Detalle del pedido' },
  { prefix: '/catalogo', title: 'Catálogo de juguetes' },
  { prefix: '/carrito', title: 'Mi carrito' },
  { prefix: '/checkout', title: 'Resumen de pago' },
  { prefix: '/perfil', title: 'Mi perfil' },
  { prefix: '/admin', title: 'Panel de administración' },
  { prefix: '/registro', title: 'Crear cuenta' },
  { prefix: '/login', title: 'Iniciar sesión' },
]

function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const match = ROUTE_TITLES.find((item) => pathname.startsWith(item.prefix))
    document.title = match
      ? `${match.title} | Mi Juguetería`
      : 'Mi Juguetería | Juguetes que despiertan sonrisas'
  }, [pathname])

  return null
}

function RouteFallback() {
  return (
    <div
      className="toy-dots grid min-h-screen place-items-center bg-toy-cream text-toy-ink"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 animate-bounce-in place-items-center rounded-3xl bg-gradient-to-br from-red-600 via-red-500 to-amber-400 text-3xl shadow-lg shadow-red-900/30">
          🎄
        </span>
        <p className="mt-4 font-display text-base font-bold text-slate-600">
          Preparando la Navidad…
        </p>
        <span className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2 w-2 rounded-full bg-red-500"
              style={{
                animation: `toyDot 1s ease-in-out ${dot * 0.15}s infinite`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className="animate-route-fade">
      <Routes>
        <Route path="/" element={<Navigate to="/catalogo" replace />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/producto/:id" element={<ProductoDetalle />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orden/:id" element={<OrdenDetalle />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/calificar/:orderId/:productId"
          element={<CalificarProducto />}
        />
        <Route path="/productos" element={<Navigate to="/catalogo" replace />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/catalogo" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouteMeta />
      <Snowfall />
      <CartToast />
      <AnimatedRoutes />
    </Suspense>
  )
}

export default App
