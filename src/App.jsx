import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Catalogo from './page/Catalogo'

/**
 * El catálogo se carga de inmediato (es la ruta de entrada), mientras que las
 * páginas pesadas (admin, perfil, detalle) se descargan solo cuando el usuario
 * las visita. Esto reduce el JavaScript inicial y mejora el LCP.
 */
const Admin = lazy(() => import('./page/Admin'))
const CalificarProducto = lazy(() => import('./page/CalificarProducto'))
const Carrito = lazy(() => import('./page/Carrito'))
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
      className="grid min-h-screen place-items-center bg-slate-50 text-slate-900"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="text-center">
        <span className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-2xl shadow-lg shadow-fuchsia-500/25">
          🧸
        </span>
        <p className="mt-3 text-sm font-bold text-slate-600">
          Cargando página…
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouteMeta />
      <Routes>
        <Route path="/" element={<Navigate to="/catalogo" replace />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/producto/:id" element={<ProductoDetalle />} />
        <Route path="/carrito" element={<Carrito />} />
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
    </Suspense>
  )
}

export default App
