import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  SESSION_CHANGED_EVENT,
  SESSION_EXPIRED_EVENT,
  SESSION_STORAGE_KEY,
  destroySession,
  getSession,
  getSessionRemainingMs,
  touchSession,
} from '../services/authService.js'

const PROTECTED_PREFIXES = ['/admin', '/perfil', '/calificar']
const ACTIVITY_EVENTS = [
  'pointerdown',
  'keydown',
  'touchstart',
  'scroll',
  'focus',
  'visibilitychange',
]

function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/**
 * Guardián global de sesión.
 *
 * - Escucha actividad real del usuario y extiende la sesión (máximo 30 min
 *   desde el último evento).
 * - Si la sesión expira, la destruye y redirige al login cuando el usuario
 *   estaba en una ruta protegida.
 * - Sincroniza la expiración entre pestañas mediante el evento `storage`.
 *
 * Se monta una sola vez dentro del BrowserRouter y no renderiza nada.
 */
export default function SessionGuard() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location)
  const timerRef = useRef(null)
  const lastTouchRef = useRef(0)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    let disposed = false

    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    function redirectToLogin(reason) {
      if (disposed) return

      const pathname = locationRef.current?.pathname ?? '/'

      if (!isProtectedPath(pathname)) return

      navigate('/login', {
        replace: true,
        state: {
          expired: reason === 'expired',
          from: pathname,
        },
      })
    }

    function expire(reason = 'expired') {
      clearTimer()
      destroySession(reason)
      redirectToLogin(reason)
    }

    function schedule() {
      clearTimer()

      if (disposed) return

      const remaining = getSessionRemainingMs()

      if (remaining === null) return

      if (remaining <= 0) {
        expire('expired')
        return
      }

      // Se revisa cada minuto: cubre equipos que suspendieron la pestaña y
      // relojes que avanzaron mientras el temporizador estaba dormido.
      timerRef.current = setTimeout(
        () => schedule(),
        Math.min(remaining, 60_000),
      )
    }

    function handleActivity(event) {
      if (event?.type === 'visibilitychange' && document.hidden) return

      const session = getSession({ touch: false })

      if (!session) return

      const now = Date.now()

      if (now - lastTouchRef.current < 15_000) return

      lastTouchRef.current = now
      touchSession(session)
      schedule()
    }

    function handleSessionChanged(event) {
      if (event?.detail?.session) {
        lastTouchRef.current = Date.now()
        schedule()
        return
      }

      clearTimer()
    }

    function handleSessionExpired(event) {
      const reason = event?.detail?.reason ?? 'expired'

      if (reason === 'expired' || reason === 'invalid') {
        redirectToLogin(reason)
      }
    }

    function handleStorage(event) {
      if (event.key !== SESSION_STORAGE_KEY) return

      if (!event.newValue) {
        clearTimer()
        redirectToLogin('expired')
        return
      }

      schedule()
    }

    const session = getSession({ touch: false })

    if (session) {
      lastTouchRef.current = Date.now()
      schedule()
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged)
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    window.addEventListener('storage', handleStorage)

    return () => {
      disposed = true
      clearTimer()
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged)
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
      window.removeEventListener('storage', handleStorage)
    }
  }, [navigate])

  return null
}
