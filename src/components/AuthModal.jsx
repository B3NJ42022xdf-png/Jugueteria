import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DEMO_ADMIN,
  DuplicateEmailError,
  loginUser,
  registerUser,
} from '../services/authService.js'
import {
  normalizeEmail,
  validateRegistrationForm,
} from '../lib/validators.js'
import { PEXELS } from '../data/products.js'
import { ChristmasTree, Gift } from './icons.jsx'

const EMPTY_LOGIN = { email: '', password: '' }
const EMPTY_REGISTER = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
}

function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2.1 12.3a1 1 0 0 1 0-.6 10.7 10.7 0 0 1 19.8 0 1 1 0 0 1 0 .6 10.7 10.7 0 0 1-19.8 0Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7" />
      <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Modal de acceso y registro.
 *
 * Se monta desde la cabecera para que "Iniciar sesión" y "Crear cuenta"
 * funcionen sin abandonar el catálogo. Al autenticarse, `loginUser` emite el
 * evento global de sesión y la cabecera se actualiza sola.
 */
export default function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}) {
  const [mode, setMode] = useState(initialMode)
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN)
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState('idle')
  const [showPassword, setShowPassword] = useState(false)
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)
  const closeTimerRef = useRef(null)
  const onCloseRef = useRef(onClose)

  const submitting = status === 'submitting'
  const success = status === 'success'

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 60)

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(
    () => () => {
      window.clearTimeout(closeTimerRef.current)
    },
    [],
  )

  if (!open) return null

  function switchMode(nextMode) {
    setMode(nextMode)
    setErrors({})
    setFeedback('')
    setStatus('idle')
    setShowPassword(false)
  }

  function finish(session) {
    setStatus('success')
    onAuthenticated?.(session)
    closeTimerRef.current = window.setTimeout(() => onClose(), 850)
  }

  async function handleLogin(event) {
    event.preventDefault()

    if (submitting || success) return

    const nextErrors = {}

    if (!normalizeEmail(loginForm.email)) {
      nextErrors.email = 'Ingresa tu correo electrónico.'
    }
    if (!loginForm.password) {
      nextErrors.password = 'Ingresa tu contraseña.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setFeedback('')
    setStatus('submitting')

    try {
      const session = await loginUser({
        email: loginForm.email,
        password: loginForm.password,
      })
      finish(session)
    } catch (error) {
      setStatus('idle')
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No pudimos iniciar sesión. Intenta de nuevo.',
      )
    }
  }

  async function handleRegister(event) {
    event.preventDefault()

    if (submitting || success) return

    const nextErrors = validateRegistrationForm(registerForm)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      const firstField = Object.keys(nextErrors)[0]
      document.getElementById(`auth-${firstField}`)?.focus()
      return
    }

    setErrors({})
    setFeedback('')
    setStatus('submitting')

    try {
      await registerUser({
        fullName: registerForm.fullName,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      })

      // La cuenta se creó: iniciamos sesión automáticamente para que el
      // cliente pueda seguir comprando sin escribir la contraseña otra vez.
      const session = await loginUser({
        email: registerForm.email,
        password: registerForm.password,
      })
      finish(session)
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        setStatus('idle')
        setErrors({ email: 'Este correo ya está registrado. Inicia sesión.' })
        return
      }

      setStatus('idle')
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No pudimos crear tu cuenta. Intenta de nuevo.',
      )
    }
  }

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={handleBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
        className="relative my-auto w-full max-w-md animate-pop-in overflow-hidden rounded-[30px] border-[3px] border-amber-200 bg-[#fffaf2] shadow-[0_30px_80px_-24px_rgba(15,23,42,0.7)]"
      >
        <div aria-hidden="true" className="christmas-stripes h-2 w-full" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de acceso"
          className="absolute right-3 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm ring-1 ring-amber-100 transition hover:bg-white hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70"
        >
          <CloseIcon />
        </button>

        <div className="max-h-[calc(100dvh-3rem)] overflow-y-auto px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
          <div className="pr-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-900">
              <ChristmasTree className="h-3.5 w-3.5" /> Especial Navidad
            </span>
            <h2 id="auth-modal-title" className="mt-3 font-festive text-3xl font-bold leading-none tracking-wide text-red-800">
              {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </h2>
            <p id="auth-modal-description" className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
              {mode === 'login'
                ? 'Entra para ver tus pedidos y seguir armando tu lista de regalos.'
                : 'Solo necesitamos cuatro datos para empezar la Navidad.'}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Tipo de acceso"
            className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-amber-100/70 p-1"
          >
            {[
              { value: 'login', label: 'Iniciar sesión' },
              { value: 'register', label: 'Crear cuenta' },
            ].map((tab) => {
              const active = mode === tab.value

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchMode(tab.value)}
                  className={`min-h-10 rounded-xl px-3 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/70 ${
                    active
                      ? 'bg-white text-red-700 shadow-sm'
                      : 'text-slate-600 hover:bg-white/60 hover:text-red-700'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {success ? (
            <div role="status" aria-live="polite" className="mt-6 animate-bounce-in rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
              <span className="mx-auto block h-16 w-16 overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white" aria-hidden="true">
                <img
                  src={PEXELS('1556679')}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="128"
                  height="128"
                  className="h-full w-full object-cover"
                />
              </span>
              <p className="mt-2 font-display text-lg font-extrabold text-emerald-800">
                ¡Ho, ho, ho! Bienvenido
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Tu sesión quedó guardada en este dispositivo.
              </p>
            </div>
          ) : (
            <>
              {feedback && (
                <div role="alert" className="mt-4 animate-shake rounded-2xl border-2 border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                  {feedback}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="mt-5 space-y-4" aria-busy={submitting}>
                  <Field id="auth-login-email" label="Correo electrónico" error={errors.email}>
                    <input
                      ref={firstFieldRef}
                      id="auth-login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={loginForm.email}
                      onChange={(event) => {
                        setLoginForm((current) => ({ ...current, email: event.target.value }))
                        setErrors((current) => ({ ...current, email: undefined }))
                      }}
                      placeholder="ana@correo.com"
                      aria-invalid={errors.email ? 'true' : undefined}
                      aria-describedby={errors.email ? 'auth-login-email-error' : undefined}
                      className="toy-input min-h-12 w-full rounded-2xl px-4 py-3 text-base text-toy-ink placeholder:text-slate-400"
                    />
                  </Field>

                  <Field id="auth-login-password" label="Contraseña" error={errors.password}>
                    <div className="relative">
                      <input
                        id="auth-login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={loginForm.password}
                        onChange={(event) => {
                          setLoginForm((current) => ({ ...current, password: event.target.value }))
                          setErrors((current) => ({ ...current, password: undefined }))
                        }}
                        placeholder="Tu contraseña"
                        aria-invalid={errors.password ? 'true' : undefined}
                        aria-describedby={errors.password ? 'auth-login-password-error' : undefined}
                        className="toy-input min-h-12 w-full rounded-2xl py-3 pl-4 pr-12 text-base text-toy-ink placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-red-700"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </Field>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="christmas-btn flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 disabled:cursor-wait disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Spinner />
                        Entrando…
                      </>
                    ) : (
                      <>
                        <ChristmasTree className="h-5 w-5" />
                        Entrar a la Navidad
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="mt-5 space-y-4" aria-busy={submitting}>
                  <Field id="auth-fullName" label="Nombre completo" error={errors.fullName}>
                    <input
                      ref={firstFieldRef}
                      id="auth-fullName"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={80}
                      value={registerForm.fullName}
                      onChange={(event) => {
                        setRegisterForm((current) => ({ ...current, fullName: event.target.value }))
                        setErrors((current) => ({ ...current, fullName: undefined }))
                      }}
                      placeholder="Ana María Pérez"
                      aria-invalid={errors.fullName ? 'true' : undefined}
                      aria-describedby={errors.fullName ? 'auth-fullName-error' : undefined}
                      className="toy-input min-h-12 w-full rounded-2xl px-4 py-3 text-base text-toy-ink placeholder:text-slate-400"
                    />
                  </Field>

                  <Field id="auth-email" label="Correo electrónico" error={errors.email}>
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={120}
                      value={registerForm.email}
                      onChange={(event) => {
                        setRegisterForm((current) => ({ ...current, email: event.target.value }))
                        setErrors((current) => ({ ...current, email: undefined }))
                      }}
                      placeholder="ana@correo.com"
                      aria-invalid={errors.email ? 'true' : undefined}
                      aria-describedby={errors.email ? 'auth-email-error' : undefined}
                      className="toy-input min-h-12 w-full rounded-2xl px-4 py-3 text-base text-toy-ink placeholder:text-slate-400"
                    />
                  </Field>

                  <Field id="auth-phone" label="Teléfono" error={errors.phone}>
                    <input
                      id="auth-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      maxLength={25}
                      value={registerForm.phone}
                      onChange={(event) => {
                        setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                        setErrors((current) => ({ ...current, phone: undefined }))
                      }}
                      placeholder="+57 300 123 4567"
                      aria-invalid={errors.phone ? 'true' : undefined}
                      aria-describedby={errors.phone ? 'auth-phone-error' : undefined}
                      className="toy-input min-h-12 w-full rounded-2xl px-4 py-3 text-base text-toy-ink placeholder:text-slate-400"
                    />
                  </Field>

                  <Field
                    id="auth-password"
                    label="Contraseña"
                    error={errors.password}
                    hint="Mínimo 12 caracteres, con mayúscula, minúscula y número."
                  >
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        maxLength={128}
                        value={registerForm.password}
                        onChange={(event) => {
                          setRegisterForm((current) => ({ ...current, password: event.target.value }))
                          setErrors((current) => ({ ...current, password: undefined }))
                        }}
                        placeholder="Crea una contraseña segura"
                        aria-invalid={errors.password ? 'true' : undefined}
                        aria-describedby={errors.password ? 'auth-password-error' : 'auth-password-hint'}
                        className="toy-input min-h-12 w-full rounded-2xl py-3 pl-4 pr-12 text-base text-toy-ink placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-red-700"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </Field>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="christmas-btn flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 disabled:cursor-wait disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Spinner />
                        Creando cuenta…
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5" />
                        Crear mi cuenta navideña
                      </>
                    )}
                  </button>
                </form>
              )}

              {mode === 'login' && (
                <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-200 bg-red-50/60 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    Acceso de administrador (demo)
                  </p>
                  <p className="mt-1 break-all text-[11px] leading-relaxed text-slate-500">
                    {DEMO_ADMIN.email} · {DEMO_ADMIN.password}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginForm({ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password })
                      setErrors({})
                      setFeedback('')
                    }}
                    className="mt-1.5 text-[11px] font-black text-red-700 underline-offset-2 transition hover:text-red-500 hover:underline"
                  >
                    Usar credenciales de administrador
                  </button>
                </div>
              )}
            </>
          )}

          <p className="mt-5 text-center text-xs font-semibold leading-relaxed text-slate-500">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-extrabold text-red-700 underline-offset-4 transition hover:text-red-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {mode === 'login' ? 'Crea una aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
