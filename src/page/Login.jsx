import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { DEMO_ADMIN, loginUser } from '../services/authService.js'

function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const registered = Boolean(location.state?.registered)
  const expired = Boolean(location.state?.expired)

  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setSubmitting(true)
    setError('')

    try {
      const session = await loginUser({ email, password })
      navigate(
        location.state?.from ??
          (session.role === 'admin' ? '/admin' : '/perfil'),
        { replace: true },
      )
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'No pudimos iniciar sesión. Intenta de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-sky-100 px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />

      <main className="relative w-full max-w-md">
        <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-violet-900/10 backdrop-blur sm:p-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Mi Juguetería, ir al inicio">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-2xl shadow-lg shadow-fuchsia-500/30">
              🧸
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight text-slate-900">Mi Juguetería</span>
              <span className="block text-xs font-medium text-slate-500">Juguetes que despiertan sonrisas</span>
            </span>
          </Link>

          <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900">Inicia sesión</h1>
          <p className="mt-1 text-sm text-slate-600">
            Entra para continuar comprando de forma segura.
          </p>

          {registered && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"
            >
              ¡Tu registro fue exitoso! Ya puedes iniciar sesión con{' '}
              <span className="break-all">{location.state?.email}</span>.
            </div>
          )}

          {expired && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800"
            >
              Tu sesión se cerró automáticamente tras 30 minutos de inactividad.
              Vuelve a iniciar sesión para continuar.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold text-slate-700">
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-slate-700">
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
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-xs font-bold text-slate-500 transition hover:text-violet-600"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-fuchsia-500/25 transition hover:from-violet-700 hover:to-fuchsia-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
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
              className="mt-1.5 text-[11px] font-black text-violet-700 underline-offset-2 transition hover:text-fuchsia-600 hover:underline"
            >
              Usar credenciales de administrador
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="font-bold text-violet-700 underline-offset-4 transition hover:text-fuchsia-600 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
