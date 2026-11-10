import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import FloatingToys from '../components/FloatingToys.jsx'
import ToyConfetti from '../components/ToyConfetti.jsx'
import { SantaScene } from '../components/ChristmasDecor.jsx'
import { DEMO_ADMIN, loginUser } from '../services/authService.js'

function SparkleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z" />
    </svg>
  )
}

function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const registered = Boolean(location.state?.registered)
  const expired = Boolean(location.state?.expired)

  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle')
  const redirectTimer = useRef(null)

  const submitting = status === 'submitting'
  const success = status === 'success'

  useEffect(
    () => () => {
      window.clearTimeout(redirectTimer.current)
    },
    [],
  )

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || success) return

    setStatus('submitting')
    setError('')

    try {
      const session = await loginUser({ email, password })
      setStatus('success')

      const destination =
        location.state?.from ?? (session.role === 'admin' ? '/admin' : '/perfil')

      redirectTimer.current = window.setTimeout(() => {
        navigate(destination, { replace: true })
      }, 1100)
    } catch (loginError) {
      setStatus('idle')
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'No pudimos iniciar sesión. Intenta de nuevo.',
      )
    }
  }

  return (
    <div className="toy-dots relative flex min-h-dvh items-center justify-center overflow-hidden bg-toy-cream px-4 py-8 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-blob bg-red-300/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 animate-blob bg-emerald-300/30 blur-3xl [animation-delay:2s]"
      />
      <FloatingToys />

      <main className="relative w-full max-w-4xl">
        <div className="relative grid animate-pop-in overflow-hidden rounded-[36px] border-[3px] border-amber-200 bg-white shadow-[0_30px_70px_-30px_rgba(127,29,29,0.5)] lg:grid-cols-[1.02fr_1fr]">
          {/* Panel decorativo */}
          <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#7f1d1d] via-[#b91c1c] to-[#14532d] p-8 text-white lg:flex lg:flex-col">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 animate-blob bg-amber-300/25"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 animate-blob bg-emerald-300/20 [animation-delay:1.2s]"
            />
            <div aria-hidden="true" className="christmas-stripes absolute inset-x-0 top-0 h-1.5" />

            <Link
              to="/catalogo"
              className="relative flex items-center gap-3"
              aria-label="Mi Juguetería, ir al catálogo"
            >
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl ring-2 ring-amber-300/60 backdrop-blur">
                🎄
                <span className="absolute -right-1.5 -top-2 text-base">🎅</span>
              </span>
              <span>
                <span className="block font-festive text-2xl font-bold leading-none tracking-wide">
                  Mi Juguetería
                </span>
                <span className="mt-1 block text-xs font-semibold text-amber-100/90">
                  Especial Navidad · Diciembre
                </span>
              </span>
            </Link>

            <div className="relative mt-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-red-900">
                <SparkleIcon className="h-3.5 w-3.5" />
                Qué bueno verte
              </span>
              <h2 className="mt-4 font-festive text-4xl font-bold leading-[1.05] tracking-wide">
                La Navidad
                <br />
                te está
                <br />
                esperando
              </h2>
              <p className="mt-3 max-w-xs text-sm font-semibold leading-relaxed text-amber-50/90">
                Entra para seguir armando tu lista de regalos y juguetes
                favoritos.
              </p>

              <SantaScene compact className="mt-6" />

              <ul className="relative mt-6 space-y-2.5 text-sm font-bold">
                {['Compra segura', 'Regalos guardados', 'Pedidos siempre a la vista'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/25 text-xs ring-1 ring-white/30">
                        ✓
                      </span>
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </aside>

          {/* Formulario */}
          <section className="relative p-6 sm:p-8">
            <Link
              to="/catalogo"
              className="mb-6 flex items-center gap-2.5 lg:hidden"
              aria-label="Mi Juguetería, ir al catálogo"
            >
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-500 text-2xl shadow-md shadow-red-900/30 ring-2 ring-amber-200">
                🎄
                <span className="absolute -right-1.5 -top-2 text-sm">🎅</span>
              </span>
              <span>
                <span className="block font-festive text-xl font-bold leading-none text-red-800">
                  Mi Juguetería
                </span>
                <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  Especial Navidad
                </span>
              </span>
            </Link>

            <h1 className="animate-slide-up font-festive text-3xl font-bold tracking-wide text-red-800">
              Inicia sesión
            </h1>
            <p className="mt-1 animate-slide-up text-sm font-semibold text-slate-600 stagger-1">
              Entra para seguir armando tu lista de regalos navideños.
            </p>

            {registered && (
              <div
                role="status"
                className="mt-5 animate-bounce-in rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"
              >
                🎉 ¡Tu registro fue exitoso! Ya puedes iniciar sesión con{' '}
                <span className="break-all">{location.state?.email}</span>.
              </div>
            )}

            {expired && (
              <div
                role="status"
                className="mt-5 animate-bounce-in rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800"
              >
                Tu sesión se cerró automáticamente tras 30 minutos de inactividad.
                Vuelve a iniciar sesión para continuar.
              </div>
            )}

            {error && (
              <div
                key={error}
                role="alert"
                className="mt-5 animate-shake rounded-2xl border-2 border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
              aria-busy={submitting}
            >
              <div className="animate-slide-up stagger-2">
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-sm font-extrabold text-slate-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ana@correo.com"
                  className="toy-input w-full rounded-2xl px-4 py-3 text-base text-toy-ink placeholder:text-slate-400"
                />
              </div>

              <div className="animate-slide-up stagger-3">
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-extrabold text-slate-700"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tu contraseña"
                    className="toy-input w-full rounded-2xl py-3 pl-4 pr-20 text-base text-toy-ink placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-xs font-extrabold text-toy-coral transition hover:text-toy-orange"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || success}
                className="christmas-btn animate-slide-up stagger-4 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
              >
                {submitting ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Entrando…
                  </>
                ) : (
                  '🎄 Entrar a la Navidad'
                )}
              </button>
            </form>

            <div className="mt-5 animate-slide-up rounded-2xl border-2 border-dashed border-amber-200 bg-red-50/60 p-3 stagger-5">
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                Acceso de administrador (demo)
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {DEMO_ADMIN.email} · {DEMO_ADMIN.password}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_ADMIN.email)
                  setPassword(DEMO_ADMIN.password)
                  setError('')
                }}
                className="mt-1.5 text-[11px] font-black text-red-700 underline-offset-2 transition hover:text-red-500 hover:underline"
              >
                Usar credenciales de administrador
              </button>
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-slate-600">
              ¿No tienes cuenta?{' '}
              <Link
                to="/registro"
                className="font-extrabold text-red-700 underline-offset-4 transition hover:text-red-500 hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </section>

          {/* Celebración al iniciar sesión */}
          {success && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-30 grid animate-fade-in place-items-center overflow-hidden rounded-[36px] bg-[#fffaf2]/95 backdrop-blur-sm"
            >
              <ToyConfetti />
              <div className="animate-bounce-in px-6 text-center">
                <div className="text-6xl" aria-hidden="true">
                  🎅
                </div>
                <p className="mt-3 font-festive text-3xl font-bold text-red-800">
                  ¡Ho, ho, ho! Bienvenido
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Preparando tus regalos de Navidad…
                </p>
                <span className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-2 w-2 rounded-full bg-red-600"
                      style={{
                        animation: `toyDot 1s ease-in-out ${dot * 0.15}s infinite`,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-sm font-semibold text-slate-500">
          <Link
            to="/catalogo"
            className="font-extrabold text-red-700 underline-offset-4 transition hover:text-red-500 hover:underline"
          >
            ← Volver al catálogo navideño
          </Link>
        </p>
      </main>
    </div>
  )
}

export default Login
