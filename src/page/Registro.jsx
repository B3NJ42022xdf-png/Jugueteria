import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FloatingToys from '../components/FloatingToys.jsx'
import ToyConfetti from '../components/ToyConfetti.jsx'
import {
  DuplicateEmailError,
  emailExists,
  registerUser,
} from '../services/authService'
import {
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
  validateField,
  validateRegistrationForm,
} from '../lib/validators.js'

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
}

const FIELDS = ['fullName', 'email', 'phone', 'password']
const EMAIL_CHECK_DEBOUNCE_MS = 600
const SUBMIT_ATTEMPTS = 2
const DUPLICATE_EMAIL_MESSAGE =
  'Este correo ya está registrado. Inicia sesión o usa otro.'

const BENEFITS = [
  'Compra segura y protegida',
  'Guarda tus regalos favoritos',
  'Sigue el estado de tus pedidos',
]

const PASSWORD_RULES = [
  {
    id: 'length',
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'case',
    label: 'Una letra mayúscula y una minúscula',
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  {
    id: 'number',
    label: 'Al menos un número',
    test: (value) => /\d/.test(value),
  },
]

/* ------------------------------------------------------------------ */
/* Iconos (SVG en línea para no agregar dependencias)                  */
/* ------------------------------------------------------------------ */

function UserIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function MailIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function PhoneIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function LockIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

function AlertIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.3 2.3 4.7-4.6" />
    </svg>
  )
}

function ShieldIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function SparklesIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      <path d="M5 15l.7 1.6 1.6.7-1.6.7L5 19.6l-.7-1.6L2.7 17.3l1.6-.7L5 15Z" />
    </svg>
  )
}

function WifiOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 2l20 20" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M5 12.9a10 10 0 0 1 3.4-2.2" />
      <path d="M14.8 10.6A10 10 0 0 1 19 12.9" />
      <path d="M2.5 8.5a15 15 0 0 1 4.2-2.4" />
      <path d="M17.6 6.4A15 15 0 0 1 21.5 8.5" />
      <path d="M12 20h.01" />
    </svg>
  )
}

function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Utilidades de la página                                             */
/* ------------------------------------------------------------------ */

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Detecta pérdida de conexión sin bloquear el render en navegadores antiguos. */
function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  )

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

/* ------------------------------------------------------------------ */
/* Piezas de la interfaz                                               */
/* ------------------------------------------------------------------ */

function Brand({ compact = false }) {
  return (
    <Link
      to="/catalogo"
      className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
      aria-label="Mi Juguetería, ir al catálogo"
    >
      <span
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-500 text-2xl shadow-lg shadow-red-900/30 ring-2 ring-amber-200 transition-transform duration-300 group-hover:-rotate-6"
        aria-hidden="true"
      >
        🎄
        <span className="absolute -right-1.5 -top-2 text-sm">🎅</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-festive text-xl font-bold tracking-wide text-red-800">
          Mi Juguetería
        </span>
        {!compact && (
          <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-700">
            Especial Navidad
          </span>
        )}
      </span>
    </Link>
  )
}

function PageShell({ children }) {
  return (
    <div className="toy-dots relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-toy-cream">
      <a
        href="#registro-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-red-700 focus:shadow-xl"
      >
        Saltar al formulario de registro
      </a>

      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 hidden h-72 w-72 animate-blob bg-red-300/30 blur-3xl sm:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 animate-blob bg-emerald-300/30 blur-3xl [animation-delay:1.6s]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 hidden h-52 w-52 animate-blob bg-amber-300/40 blur-3xl [animation-delay:2.4s] md:block" />
      <FloatingToys />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-10">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0 lg:hidden">
            <Brand compact />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-1.5" aria-label="Navegación de registro">
            <Link
              to="/catalogo"
              className="hidden min-h-11 items-center rounded-full px-3 text-sm font-bold text-slate-600 transition hover:-rotate-2 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 sm:inline-flex"
            >
              Catálogo
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-white px-4 text-sm font-extrabold text-red-700 ring-2 ring-red-100 transition hover:-translate-y-0.5 hover:ring-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              Iniciar sesión
            </Link>
          </nav>
        </header>

        <div className="mt-5 grid flex-1 items-center gap-8 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-12">
          <aside className="hidden min-w-0 animate-slide-up flex-col gap-8 lg:flex">
            <Brand />

            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-red-900 shadow-sm ring-2 ring-amber-200">
                <SparklesIcon className="h-4 w-4" />
                Nueva cuenta navideña
              </span>
              <h2 className="mt-4 text-balance font-festive text-4xl font-bold leading-[1.05] tracking-wide text-red-800 xl:text-5xl">
                Tu Navidad{' '}
                <span className="text-emerald-700">empieza aquí</span>
              </h2>
              <p className="mt-4 max-w-md text-base font-semibold leading-relaxed text-slate-600">
                Crea tu cuenta para descubrir los juguetes de diciembre, comprar
                de forma segura y recibir sorpresas de Papá Noel.
              </p>
            </div>

            <ul className="space-y-3">
              {BENEFITS.map((benefit, index) => (
                <li
                  key={benefit}
                  className={`flex animate-slide-up items-center gap-3 text-sm font-bold text-slate-700 stagger-${index + 1}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 ring-2 ring-white">
                    <CheckCircleIcon className="h-4 w-4" />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-3 gap-3">
              {[
                { emoji: '🎅', label: 'Papá Noel' },
                { emoji: '🧝', label: 'Elfos' },
                { emoji: '🎁', label: 'Regalos' },
              ].map((toy, index) => (
                <div
                  key={toy.label}
                  className={`min-w-0 animate-pop-in rounded-2xl border-2 border-amber-100 bg-white/80 p-4 text-center shadow-sm backdrop-blur stagger-${index + 3}`}
                >
                  <span className="block animate-float text-3xl" aria-hidden="true">
                    {toy.emoji}
                  </span>
                  <span className="mt-2 block truncate text-xs font-extrabold text-slate-600">
                    {toy.label}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          <main className="mx-auto w-full min-w-0 max-w-md">{children}</main>
        </div>
      </div>
    </div>
  )
}

function TextField({
  id,
  label,
  icon,
  error,
  hint,
  rightSlot,
  below,
  describedBy,
  required = true,
  className = '',
  ...inputProps
}) {
  const describedByIds = [
    error ? `${id}-error` : null,
    hint ? `${id}-hint` : null,
    describedBy,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-extrabold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-toy-coral" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-toy-orange/80" aria-hidden="true">
          {icon}
        </span>

        {/* text-base (16 px) evita el zoom automático de iOS al enfocar. */}
        <input
          id={id}
          required={required}
          aria-required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedByIds || undefined}
          className={[
            'toy-input min-h-12 w-full rounded-2xl py-3 pl-11 text-base text-toy-ink placeholder:text-slate-400',
            rightSlot ? 'pr-14' : 'pr-4',
            error
              ? '!border-rose-400 focus:!border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.18)]'
              : '',
          ].join(' ')}
          {...inputProps}
        />

        {rightSlot}
      </div>

      {hint && !error && (
        <div id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {hint}
        </div>
      )}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-rose-600"
        >
          <AlertIcon className="mt-px h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </p>
      )}

      {below}
    </div>
  )
}

function PasswordMeter({ length }) {
  const percentage = Math.min((length / PASSWORD_MIN_LENGTH) * 100, 100)
  const complete = length >= PASSWORD_MIN_LENGTH

  return (
    <div className="mt-2 flex items-center gap-2.5">
      <div
        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Longitud de la contraseña"
        aria-valuemin={0}
        aria-valuemax={PASSWORD_MIN_LENGTH}
        aria-valuenow={Math.min(length, PASSWORD_MIN_LENGTH)}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            complete ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={`shrink-0 text-xs font-bold tabular-nums ${
          complete ? 'text-emerald-600' : 'text-amber-600'
        }`}
        aria-hidden="true"
      >
        {length}/{PASSWORD_MIN_LENGTH}
      </span>
    </div>
  )
}

function PasswordChecklist({ id, password }) {
  return (
    <ul id={id} className="mt-2 grid gap-1.5 text-xs leading-relaxed">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password)

        return (
          <li
            key={rule.id}
            className={`flex items-start gap-1.5 ${met ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}
          >
            <span className="mt-px shrink-0" aria-hidden="true">
              {met ? '✓' : '•'}
            </span>
            <span className="min-w-0">
              {rule.label}
              <span className="sr-only">{met ? ' (cumplido)' : ' (pendiente)'}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Página de registro                                                  */
/* ------------------------------------------------------------------ */

function Registro() {
  const navigate = useNavigate()
  const online = useOnlineStatus()

  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [emailState, setEmailState] = useState('idle')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [generalError, setGeneralError] = useState('')

  const mountedRef = useRef(true)
  const submittingRef = useRef(false)
  const emailTimerRef = useRef(null)
  const emailCheckId = useRef(0)
  const emailCache = useRef(new Map())

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      window.clearTimeout(emailTimerRef.current)
    }
  }, [])

  // El botón solo se habilita cuando todos los campos pasan la validación
  // síncrona y el correo no está marcado como duplicado.
  const isFormValid = useMemo(
    () => Object.keys(validateRegistrationForm(form)).length === 0,
    [form],
  )

  const passwordLength = form.password.length
  const passwordRulesVisible = passwordFocused || passwordLength > 0
  const emailChecking = emailState === 'checking'
  const emailTaken = emailState === 'taken'

  // Redirección al login cuando la cuenta se creó correctamente.
  useEffect(() => {
    if (!success) return

    const timer = window.setTimeout(() => {
      navigate('/login', {
        replace: true,
        state: { registered: true, email: registeredEmail },
      })
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [success, navigate, registeredEmail])

  function setFieldError(name, message) {
    setErrors((previous) => {
      const next = { ...previous }
      if (message) next[name] = message
      else delete next[name]
      return next
    })
  }

  async function runEmailCheck(rawEmail) {
    const normalized = normalizeEmail(rawEmail)

    if (!isValidEmail(normalized)) return

    const cached = emailCache.current.get(normalized)

    if (cached === true) {
      setEmailState('taken')
      setFieldError('email', DUPLICATE_EMAIL_MESSAGE)
      return
    }

    if (cached === false) {
      setEmailState('available')
      setFieldError('email', null)
      return
    }

    const requestId = ++emailCheckId.current
    setEmailState('checking')

    try {
      const exists = await emailExists(normalized)

      // Descarta respuestas viejas: si el usuario siguió escribiendo, esta
      // respuesta ya no aplica. Evita parpadeos y trabajo innecesario.
      if (!mountedRef.current || requestId !== emailCheckId.current) return

      emailCache.current.set(normalized, exists)

      if (exists) {
        setEmailState('taken')
        setFieldError('email', DUPLICATE_EMAIL_MESSAGE)
      } else {
        setEmailState('available')
        setFieldError('email', null)
      }
    } catch {
      if (mountedRef.current && requestId === emailCheckId.current) {
        setEmailState('error')
        setGeneralError('No pudimos verificar el correo. Intenta de nuevo.')
      }
    }
  }

  function handleChange(event) {
    const { name, value } = event.target

    setGeneralError('')
    setForm((previous) => ({ ...previous, [name]: value }))

    if (name === 'email') {
      // Invalida cualquier verificación en curso y reprograma una sola
      // consulta cuando el usuario deja de escribir (debounce).
      emailCheckId.current += 1
      window.clearTimeout(emailTimerRef.current)
      setEmailState('idle')

      const normalized = normalizeEmail(value)

      if (isValidEmail(normalized)) {
        emailTimerRef.current = window.setTimeout(() => {
          runEmailCheck(normalized)
        }, EMAIL_CHECK_DEBOUNCE_MS)
      }
    }

    if (touched[name]) {
      setFieldError(name, validateField(name, value))
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target

    setTouched((previous) => ({ ...previous, [name]: true }))

    if (name === 'password') setPasswordFocused(false)

    const message = validateField(name, value)

    if (message) {
      if (name === 'email') {
        emailCheckId.current += 1
        window.clearTimeout(emailTimerRef.current)
        setEmailState('idle')
      }
      setFieldError(name, message)
      return
    }

    setFieldError(name, null)

    if (name === 'email') {
      window.clearTimeout(emailTimerRef.current)
      runEmailCheck(value)
    }
  }

  function focusFirstError(nextErrors) {
    const firstField = FIELDS.find((field) => nextErrors[field])
    if (firstField) document.getElementById(firstField)?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    // Bloqueo síncrono: dos clics rápidos o el doble evento táctil no pueden
    // iniciar dos registros en paralelo.
    if (submittingRef.current) return

    setGeneralError('')
    setTouched({ fullName: true, email: true, phone: true, password: true })

    const fieldErrors = validateRegistrationForm(form)

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      focusFirstError(fieldErrors)
      return
    }

    if (!online) {
      setGeneralError('Sin conexión. Revisa tu red y vuelve a intentarlo.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)

    // Clave de idempotencia: si la red falla y se reintenta, el servidor puede
    // reconocer el mismo intento y no crear una cuenta duplicada.
    const requestId =
      globalThis.crypto?.randomUUID?.() ??
      `reg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    try {
      for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt += 1) {
        try {
          await registerUser({
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            password: form.password,
            requestId,
          })

          setRegisteredEmail(normalizeEmail(form.email))
          setSuccess(true)
          return
        } catch (error) {
          const isLastAttempt = attempt >= SUBMIT_ATTEMPTS
          const canRetry =
            !isLastAttempt &&
            !(error instanceof DuplicateEmailError) &&
            navigator.onLine !== false

          if (!canRetry) throw error

          // Retroceso exponencial corto para no saturar un servidor que ya
          // está bajo carga.
          await wait(400 * 2 ** (attempt - 1))
        }
      }
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        setEmailState('taken')
        setFieldError('email', DUPLICATE_EMAIL_MESSAGE)
        document.getElementById('email')?.focus()
      } else {
        setGeneralError(
          'No pudimos crear tu cuenta. Revisa tu conexión e intenta de nuevo.',
        )
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <PageShell>
        <section
          role="status"
          aria-live="polite"
          className="relative min-w-0 animate-pop-in overflow-hidden rounded-[32px] border-[3px] border-amber-200 bg-white p-6 text-center shadow-[0_24px_50px_-26px_rgba(127,29,29,0.45)] sm:p-10"
        >
          <ToyConfetti />
          <div aria-hidden="true" className="christmas-stripes absolute inset-x-0 top-0 h-1.5" />
          <div className="relative">
            <div className="mx-auto grid h-24 w-24 animate-bounce-in place-items-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white">
              <CheckCircleIcon className="h-12 w-12" />
            </div>

            <div className="mt-3 text-4xl" aria-hidden="true">
              <span className="inline-block animate-wiggle">🎅</span>
              <span className="ml-1 inline-block animate-wiggle [animation-delay:0.3s]">🎁</span>
            </div>

            <h1 className="mt-2 text-balance font-festive text-3xl font-bold tracking-wide text-red-800">
              ¡Cuenta navideña creada!
            </h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
              Registramos{' '}
              <strong className="break-all text-slate-800">{registeredEmail}</strong>{' '}
              de forma segura. Ya puedes iniciar sesión y empezar a preparar tu
              lista de regalos.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                state={{ registered: true, email: registeredEmail }}
                className="christmas-btn inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-5 py-3 text-base font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
              >
                Ir a iniciar sesión
              </Link>
              <Link
                to="/catalogo"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border-2 border-amber-200 bg-white px-5 py-3 text-base font-extrabold text-red-700 transition hover:-translate-y-0.5 hover:border-amber-400 hover:text-red-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50"
              >
                Seguir explorando
              </Link>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-red-700">
              <Spinner className="h-4 w-4" />
              Redirigiendo al inicio de sesión…
            </p>
          </div>
        </section>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <section
        aria-labelledby="registro-title"
        className="min-w-0 animate-pop-in rounded-[32px] border-[3px] border-amber-200 bg-white p-5 shadow-[0_26px_55px_-28px_rgba(127,29,29,0.5)] sm:p-7 lg:p-8"
      >
        <div className="mb-5 sm:mb-6">
          <span className="inline-flex animate-slide-up items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-red-900 lg:hidden">
            <SparklesIcon className="h-3.5 w-3.5" />
            Nueva cuenta navideña
          </span>
          <h1 id="registro-title" className="mt-3 animate-slide-up text-balance font-festive text-3xl font-bold tracking-wide text-red-800 sm:text-4xl lg:mt-0">
            Crea tu cuenta
          </h1>
          <p className="mt-1 animate-slide-up text-sm font-semibold leading-relaxed text-slate-600 stagger-1">
            Es rápido, seguro y gratis. Solo necesitamos cuatro datos para
            empezar la Navidad.
          </p>
        </div>

        {!online && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 flex animate-bounce-in items-start gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-relaxed text-amber-800"
          >
            <WifiOffIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
              Sin conexión. Podrás crear tu cuenta cuando recuperes la red.
            </span>
          </div>
        )}

        {generalError && (
          <div
            role="alert"
            className="mb-4 flex animate-shake items-start gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 p-3 text-sm font-bold leading-relaxed text-rose-700"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{generalError}</span>
          </div>
        )}

        <form
          id="registro-form"
          noValidate
          onSubmit={handleSubmit}
          aria-busy={submitting}
          className="space-y-4 sm:space-y-5"
        >
          <TextField
            id="fullName"
            name="fullName"
            label="Nombre completo"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder="Ana María Pérez"
            value={form.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.fullName ? errors.fullName : undefined}
            icon={<UserIcon />}
            maxLength={80}
            className="animate-slide-up stagger-2"
          />

          <TextField
            id="email"
            name="email"
            label="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            spellCheck={false}
            placeholder="ana@correo.com"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={
              touched.email || emailTaken ? errors.email : undefined
            }
            icon={<MailIcon />}
            hint={
              <span
                role="status"
                aria-live="polite"
                className={`inline-flex items-center gap-1.5 ${
                  emailState === 'available' ? 'font-semibold text-emerald-700' : ''
                }`}
              >
                {emailChecking && <Spinner className="h-3.5 w-3.5 shrink-0" />}
                {emailState === 'available' && (
                  <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                )}
                {emailChecking
                  ? 'Verificando disponibilidad…'
                  : emailState === 'available'
                    ? 'Correo disponible.'
                    : 'Nunca compartiremos tu correo con terceros.'}
              </span>
            }
            maxLength={120}
            className="animate-slide-up stagger-3"
          />

          <TextField
            id="phone"
            name="phone"
            label="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            placeholder="+57 300 123 4567"
            value={form.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.phone ? errors.phone : undefined}
            icon={<PhoneIcon />}
            hint="Incluye el código de tu país. Ej.: +57 300 123 4567."
            maxLength={25}
            className="animate-slide-up stagger-4"
          />

          <TextField
            id="password"
            name="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="done"
            placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setPasswordFocused(true)}
            error={touched.password ? errors.password : undefined}
            icon={<LockIcon />}
            hint={
              isValidPassword(form.password)
                ? `Cumple el mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`
                : `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.`
            }
            describedBy={passwordRulesVisible ? 'password-rules' : undefined}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex min-h-12 w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
            below={
              passwordLength > 0 || passwordRulesVisible ? (
                <div>
                  <PasswordMeter length={passwordLength} />
                  <PasswordChecklist id="password-rules" password={form.password} />
                </div>
              ) : null
            }
            maxLength={128}
            className="animate-slide-up stagger-5"
          />

          <div className="animate-slide-up space-y-2.5 pt-1 stagger-6">
            <button
              type="submit"
              disabled={!isFormValid || emailTaken || submitting || !online}
              aria-disabled={!isFormValid || emailTaken || submitting || !online}
              className="christmas-btn flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
            >
              {submitting ? (
                <>
                  <Spinner className="h-5 w-5" />
                  Creando cuenta…
                </>
              ) : (
                '🎁 Crear mi cuenta navideña'
              )}
            </button>

            <p className="text-center text-xs font-semibold leading-relaxed text-slate-500" aria-live="polite">
              {submitting
                ? 'Estamos procesando tu registro de forma segura. No cierres esta página.'
                : !online
                  ? 'El registro se habilitará cuando vuelvas a tener conexión.'
                  : !isFormValid || emailTaken
                    ? 'Completa todos los campos con un formato válido para habilitar el registro.'
                    : 'Tus datos viajan cifrados y se procesan de forma segura.'}
            </p>
          </div>
        </form>

        <p className="mt-5 text-center text-sm font-semibold text-slate-600">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center font-extrabold text-red-700 underline-offset-4 transition hover:text-red-500 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50"
          >
            Inicia sesión
          </Link>
        </p>

        <div className="mt-4 grid grid-cols-1 gap-1.5 border-t-2 border-dashed border-amber-200 pt-4 text-[11px] font-semibold text-slate-500 sm:grid-cols-3">
          <span className="flex items-center justify-center gap-1.5">
            <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            Cifrado AES-256
          </span>
          <span className="flex items-center justify-center gap-1.5">
            <LockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            Contraseña protegida
          </span>
          <span className="flex items-center justify-center gap-1.5">
            <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            Compra segura
          </span>
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
          Al registrarte aceptas nuestros Términos de uso y la Política de privacidad. Tus datos se
          almacenan cifrados.
        </p>
      </section>
    </PageShell>
  )
}

export default Registro
