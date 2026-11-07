import { useEffect, useMemo, useState } from 'react'
import { formatBytes } from '../services/imageService.js'
import {
  MAINTENANCE_LATEST_HOUR,
  UPTIME_TARGET,
  getAvailabilitySnapshot,
  getDayLabel,
  resolveIncident,
  runAvailabilityCheck,
  saveAvailabilityConfig,
  sendTestAlert,
} from '../services/availabilityService.js'
import {
  createLocalBackup,
  downloadBackup,
} from '../services/backupService.js'

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const windowFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

const DAY_OPTIONS = Array.from({ length: 7 }, (_, index) => ({
  value: index,
  label: getDayLabel(index),
}))

const HOUR_OPTIONS = Array.from({ length: 6 }, (_, index) => index)

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
]

const INFRASTRUCTURE = [
  {
    icon: '♻️',
    title: 'PM2 · autoreinicio',
    file: 'deploy/ecosystem.config.cjs',
    detail:
      '2 instancias en clúster, autorestart con backoff exponencial, máximo de reinicios y apagado ordenado.',
  },
  {
    icon: '⚖️',
    title: 'Nginx · balanceador',
    file: 'deploy/nginx.conf',
    detail:
      'Upstream con max_fails y fail_timeout, reintento en otra réplica y página 503 de mantenimiento.',
  },
  {
    icon: '🐳',
    title: 'Docker · alta disponibilidad',
    file: 'deploy/docker-compose.yml',
    detail:
      'Dos réplicas con restart: always y healthcheck; Nginx solo arranca cuando ambas están sanas.',
  },
  {
    icon: '🛠️',
    title: 'systemd · watchdog',
    file: 'deploy/systemd/jugueteria.service',
    detail:
      'Restart=always, RestartSec=5 y reinicio ilimitado si el proceso principal cae.',
  },
]

const STATUS_STYLES = {
  operational: {
    label: 'Operativo',
    panel: 'border-emerald-200 bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  degraded: {
    label: 'Degradado',
    panel: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  down: {
    label: 'Interrupción',
    panel: 'border-rose-200 bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
  },
  maintenance: {
    label: 'Mantenimiento',
    panel: 'border-violet-200 bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
  },
}

const ALERT_STYLES = {
  critical: 'bg-rose-100 text-rose-700',
  recovery: 'bg-emerald-100 text-emerald-700',
  test: 'bg-violet-100 text-violet-700',
  info: 'bg-slate-100 text-slate-600',
}

function formatMinutes(minutes) {
  const totalSeconds = Math.round((Number(minutes) || 0) * 60)
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours} h ${mins} min`
  if (mins > 0) return `${mins} min ${seconds} s`
  return `${seconds} s`
}

function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(3)} %`
}

function formatLatency(value) {
  if (!Number.isFinite(value) || value <= 0) return '—'
  return `${value.toFixed(1)} ms`
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return dateTimeFormatter.format(new Date(value))
  } catch {
    return '—'
  }
}

function formatWindow(value) {
  if (!value) return '—'
  try {
    return windowFormatter.format(new Date(value))
  } catch {
    return '—'
  }
}

function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function ClockIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function DatabaseIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  )
}

function BellIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  )
}

function DownloadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function StatusCard({ label, children, className = '' }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {children}
    </div>
  )
}

export default function AdminAvailability() {
  const [snapshot, setSnapshot] = useState(() => getAvailabilitySnapshot())
  const [form, setForm] = useState(() => getAvailabilitySnapshot().config)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingAlert, setTestingAlert] = useState(false)
  const [backupBusy, setBackupBusy] = useState(false)
  const [createdBackup, setCreatedBackup] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    runAvailabilityCheck()
      .then(() => {
        if (active) setSnapshot(getAvailabilitySnapshot())
      })
      .catch(() => {
        if (active) {
          setError('No pudimos ejecutar la verificación automática.')
        }
      })

    return () => {
      active = false
    }
  }, [])

  const status = STATUS_STYLES[snapshot.status.key] ?? STATUS_STYLES.operational
  const endMinutes =
    Number(form.maintenance.startHour) * 60 +
    Number(form.maintenance.durationMinutes)
  const endHourLabel = `${String(Math.floor(endMinutes / 60)).padStart(
    2,
    '0',
  )}:${String(endMinutes % 60).padStart(2, '0')}`
  const windowError =
    endMinutes > MAINTENANCE_LATEST_HOUR * 60
      ? 'La ventana debe terminar antes de las 06:00 para seguir siendo madrugada.'
      : ''

  const usedPercent = useMemo(() => {
    if (snapshot.allowedDowntimeMinutes <= 0) return 0
    return Math.min(
      100,
      (snapshot.downtimeMinutes / snapshot.allowedDowntimeMinutes) * 100,
    )
  }, [snapshot.allowedDowntimeMinutes, snapshot.downtimeMinutes])

  function refresh() {
    setSnapshot(getAvailabilitySnapshot())
  }

  function updateMaintenance(patch) {
    setForm((previous) => ({
      ...previous,
      maintenance: { ...previous.maintenance, ...patch },
    }))
  }

  function updateMonitoring(patch) {
    setForm((previous) => ({
      ...previous,
      monitoring: { ...previous.monitoring, ...patch },
    }))
  }

  async function handleCheck() {
    setChecking(true)
    setError('')

    try {
      const check = await runAvailabilityCheck()
      refresh()
      setMessage(
        check.status === 'up'
          ? `Verificación correcta: /health respondió en ${formatLatency(
              check.latencyMs,
            )}.`
          : `La verificación terminó en estado "${check.status}": ${check.detail}`,
      )
    } catch {
      setError('No pudimos ejecutar la verificación.')
    } finally {
      setChecking(false)
    }
  }

  function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const result = saveAvailabilityConfig({
      maintenance: {
        ...form.maintenance,
        enabled: Boolean(form.maintenance.enabled),
        day: Number(form.maintenance.day),
        startHour: Number(form.maintenance.startHour),
        durationMinutes: Number(form.maintenance.durationMinutes),
      },
      monitoring: form.monitoring,
    })

    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setForm(result.config)
    setSnapshot(getAvailabilitySnapshot())
    setMessage(
      'Programación guardada. La ventana queda restringida a la madrugada (00:00–06:00).',
    )
  }

  async function handleTestAlert() {
    setTestingAlert(true)
    setError('')

    try {
      const result = await sendTestAlert()
      refresh()
      setMessage(
        result.delivered
          ? `Alerta de prueba enviada por ${result.channel}.`
          : `Alerta registrada en el panel. ${result.error || 'Configura ALERT_WEBHOOK_URL para enviarla a Slack.'}`,
      )
    } catch {
      setError('No pudimos registrar la alerta de prueba.')
    } finally {
      setTestingAlert(false)
    }
  }

  function handleBackup() {
    setBackupBusy(true)
    setError('')

    try {
      const result = createLocalBackup({
        kind: 'manual',
        note: 'Respaldo creado desde el panel de disponibilidad.',
      })
      setCreatedBackup(result)
      refresh()
      setMessage(
        `Respaldo creado: ${formatBytes(result.metadata.bytes)} · ${
          result.metadata.records
        } registros.`,
      )
    } catch {
      setError('No pudimos crear el respaldo local.')
    } finally {
      setBackupBusy(false)
    }
  }

  function handleDownload() {
    setError('')

    const downloaded = createdBackup
      ? downloadBackup(createdBackup.payload, createdBackup.fileName)
      : downloadBackup()

    if (!downloaded) {
      setError('Todavía no hay un respaldo descargable. Crea uno primero.')
      return
    }

    setMessage('Respaldo descargado como archivo JSON.')
  }

  function handleResolve(incidentId) {
    resolveIncident(incidentId)
    refresh()
    setMessage('Incidencia cerrada. El uptime mensual se recalculó.')
  }

  return (
    <section aria-labelledby="disponibilidad-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="disponibilidad-title"
            className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900"
          >
            <ShieldIcon className="h-5 w-5 text-violet-600" />
            Disponibilidad y continuidad
          </h2>
          <p className="max-w-2xl text-xs text-slate-500">
            SLA mensual del {UPTIME_TARGET} %, ventana de mantenimiento en
            madrugada, respaldos diarios y monitoreo con alertas en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-fuchsia-500/20 transition hover:from-violet-700 hover:to-fuchsia-600 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshIcon className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Verificando…' : 'Verificar ahora'}
          </button>
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={testingAlert}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <BellIcon className="h-4 w-4" />
            {testingAlert ? 'Enviando…' : 'Probar alerta'}
          </button>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-2xl border p-4 shadow-sm ${status.panel}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Uptime mensual
            </p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${status.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <p className={`mt-1 text-3xl font-black ${status.text}`}>
            {formatPercent(snapshot.uptimePercent)}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            Objetivo ≥ {UPTIME_TARGET} % · {snapshot.monthLabel}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
            <div
              className={`h-full rounded-full ${
                snapshot.meetsTarget ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, snapshot.uptimePercent)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] font-bold text-slate-500">
            {snapshot.meetsTarget
              ? 'Cumple el SLA'
              : 'Por debajo del SLA: revisa las incidencias'}
          </p>
        </div>

        <StatusCard label="Presupuesto de caída" className="border-slate-200 bg-white">
          <p className="mt-1 text-2xl font-black text-slate-900">
            {formatMinutes(snapshot.allowedDowntimeMinutes)}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            Consumido {formatMinutes(snapshot.downtimeMinutes)} · disponible{' '}
            {formatMinutes(snapshot.remainingDowntimeMinutes)}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                usedPercent >= 100
                  ? 'bg-rose-500'
                  : usedPercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            Cálculo sobre el mes en curso, excluyendo mantenimiento planificado.
          </p>
        </StatusCard>

        <StatusCard label="Última verificación" className="border-slate-200 bg-white">
          <p className="mt-1 text-2xl font-black text-slate-900">
            {formatLatency(snapshot.latency.last)}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            HTTP {snapshot.lastCheck?.httpStatus || '—'} · promedio{' '}
            {formatLatency(snapshot.latency.average)}
          </p>
          <p className="mt-3 truncate text-[10px] text-slate-400">
            {snapshot.lastCheck
              ? `${formatDate(snapshot.lastCheck.at)} · ${snapshot.lastCheck.detail}`
              : 'Aún no hay verificaciones registradas.'}
          </p>
          <p className="mt-1 text-[10px] font-bold text-violet-600">
            Monitoreo automático cada{' '}
            {snapshot.monitoring.checkIntervalSeconds} s
          </p>
        </StatusCard>

        <StatusCard label="Próximo mantenimiento" className="border-slate-200 bg-white">
          <p className="mt-1 text-lg font-black text-slate-900">
            {snapshot.maintenance.dayLabel}{' '}
            {String(snapshot.maintenance.startHour).padStart(2, '0')}:00
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            {formatWindow(snapshot.maintenance.start)} ·{' '}
            {snapshot.maintenance.label}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-700">
            <ClockIcon className="h-3 w-3" />
            Madrugada · {snapshot.maintenance.timezone}
          </span>
          <p className="mt-1.5 text-[10px] text-slate-400">
            {snapshot.maintenance.active ? 'Ventana en curso' : 'Tráfico mínimo'}
          </p>
        </StatusCard>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-900">
              <ClockIcon className="h-4 w-4 text-violet-600" />
              Ventana de mantenimiento
            </h3>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-bold text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(form.maintenance.enabled)}
                onChange={(event) =>
                  updateMaintenance({ enabled: event.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              Activa
            </label>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Solo se permite entre las 00:00 y las 06:00, cuando el tráfico es
            mínimo. Las alertas de UptimeRobot se pausan durante la ventana.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[11px] font-bold text-slate-600">
              Día
              <select
                value={form.maintenance.day}
                onChange={(event) =>
                  updateMaintenance({ day: Number(event.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-[11px] font-bold text-slate-600">
              Hora de inicio
              <select
                value={form.maintenance.startHour}
                onChange={(event) =>
                  updateMaintenance({ startHour: Number(event.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                {HOUR_OPTIONS.map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="text-[11px] font-bold text-slate-600">
              Duración
              <select
                value={form.maintenance.durationMinutes}
                onChange={(event) =>
                  updateMaintenance({
                    durationMinutes: Number(event.target.value),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Ventana resultante
              </p>
              <p className="mt-0.5 text-sm font-black text-slate-800">
                {String(form.maintenance.startHour).padStart(2, '0')}:00 –{' '}
                {endHourLabel}
              </p>
            </div>
          </div>

          {windowError && (
            <p className="mt-2 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-700">
              {windowError}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || Boolean(windowError)}
            className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar programación'}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-900">
            <BellIcon className="h-4 w-4 text-violet-600" />
            Monitoreo y alertas
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            UptimeRobot revisa <code>/health</code> cada 60 s y New Relic
            recibe métricas del servidor. Las alertas llegan por correo y Slack.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                UptimeRobot
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-600">
                {form.monitoring.uptimeRobot
                  ? 'Monitor activo · 60 s'
                  : 'Desactivado'}
              </p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-wide text-sky-700">
                New Relic
              </p>
              <p className="mt-0.5 text-[10px] text-sky-600">
                {form.monitoring.newRelic
                  ? 'APM + alertas'
                  : 'Desactivado'}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[11px] font-bold text-slate-600">
              Correo de alertas
              <input
                type="email"
                value={form.monitoring.email}
                onChange={(event) =>
                  updateMonitoring({ email: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="soporte@mijugueteria.co"
              />
            </label>

            <label className="text-[11px] font-bold text-slate-600">
              Webhook de Slack
              <input
                type="url"
                value={form.monitoring.slackWebhook}
                onChange={(event) =>
                  updateMonitoring({ slackWebhook: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="https://hooks.slack.com/services/…"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={Boolean(form.monitoring.uptimeRobot)}
                onChange={(event) =>
                  updateMonitoring({ uptimeRobot: event.target.checked })
                }
                className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              UptimeRobot
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={Boolean(form.monitoring.newRelic)}
                onChange={(event) =>
                  updateMonitoring({ newRelic: event.target.checked })
                }
                className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              New Relic
            </label>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500">
            <strong className="text-slate-700">Configuración real:</strong>{' '}
            <code>deploy/monitoring/uptimerobot.mjs</code> crea los monitores y{' '}
            <code>deploy/monitoring/newrelic.cjs</code> configura APM. El
            servidor envía la alerta de prueba con{' '}
            <code>ALERT_WEBHOOK_URL</code>.
          </div>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-900">
              <DatabaseIcon className="h-4 w-4 text-violet-600" />
              Respaldos automáticos
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Respaldo diario de la base de datos a las{' '}
              <strong className="text-slate-700">
                {snapshot.backup.schedule.label}
              </strong>{' '}
              ({snapshot.backup.schedule.timezone}), retención de{' '}
              {snapshot.backup.retentionDays} días. Este panel además exporta
              los datos locales para soporte.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBackup}
              disabled={backupBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
            >
              <DatabaseIcon className="h-4 w-4" />
              {backupBusy ? 'Creando…' : 'Crear respaldo'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Descargar
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              Último respaldo
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-700">
              {snapshot.backup.lastRun
                ? formatDate(snapshot.backup.lastRun)
                : 'Aún no hay respaldos'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              Tamaño
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-700">
              {snapshot.backup.latest
                ? formatBytes(snapshot.backup.latest.bytes)
                : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
              Próxima ejecución
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-700">
              {formatDate(snapshot.backup.schedule.nextRun)}
            </p>
          </div>
        </div>

        {snapshot.backup.entries.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-[9px] uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2 font-black">Fecha</th>
                  <th className="px-2 py-2 font-black">Tipo</th>
                  <th className="px-2 py-2 font-black">Registros</th>
                  <th className="px-2 py-2 font-black">Tamaño</th>
                  <th className="px-2 py-2 font-black">Estado</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.backup.entries.slice(0, 6).map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-2 py-2 text-slate-600">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-2 py-2 font-bold capitalize text-violet-600">
                      {entry.kind}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {entry.records}
                    </td>
                    <td className="px-2 py-2 font-bold text-slate-700">
                      {formatBytes(entry.bytes)}
                    </td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                        {entry.stored ? 'Guardado' : 'Solo descarga'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-[11px] text-slate-500">
            Todavía no hay respaldos locales. El respaldo real de PostgreSQL se
            ejecuta a diario con <code>deploy/scripts/backup-db.sh</code>.
          </p>
        )}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">
            Autoreinicio y balanceo
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Configuración incluida en el repositorio para que una caída de
            proceso no tumbe la tienda.
          </p>
          <ul className="mt-3 space-y-2">
            {INFRASTRUCTURE.map((item) => (
              <li
                key={item.file}
                className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2"
              >
                <span className="text-base" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-[10px] leading-relaxed text-slate-500">
                    {item.detail}
                  </p>
                  <code className="mt-0.5 block truncate text-[9px] text-violet-600">
                    {item.file}
                  </code>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">
            Últimas verificaciones
          </h3>
          {snapshot.checks.length === 0 ? (
            <p className="mt-2 text-[11px] text-slate-500">
              Pulsa “Verificar ahora” para registrar la primera medición.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[9px] uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-1.5 font-black">Hora</th>
                    <th className="px-2 py-1.5 font-black">Estado</th>
                    <th className="px-2 py-1.5 font-black">Latencia</th>
                    <th className="px-2 py-1.5 font-black">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.checks.slice(0, 8).map((check) => (
                    <tr
                      key={check.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-2 py-1.5 text-slate-500">
                        {formatDate(check.at)}
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`rounded-full px-1.5 py-0.5 font-black ${
                            check.status === 'up'
                              ? 'bg-emerald-50 text-emerald-700'
                              : check.status === 'degraded'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {check.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 font-bold tabular-nums text-slate-700">
                        {formatLatency(check.latencyMs)}
                      </td>
                      <td className="max-w-[220px] truncate px-2 py-1.5 text-slate-500">
                        {check.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">
            Incidencias del mes
          </h3>
          {snapshot.incidents.length === 0 ? (
            <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
              <CheckIcon className="h-4 w-4" />
              Sin interrupciones registradas en {snapshot.monthLabel}.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {snapshot.incidents.map((incident) => (
                <li
                  key={incident.id}
                  className={`rounded-xl border px-3 py-2 ${
                    incident.resolvedAt
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-rose-200 bg-rose-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-black text-slate-800">
                        {incident.cause}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Inicio {formatDate(incident.startedAt)}
                        {incident.resolvedAt
                          ? ` · Fin ${formatDate(incident.resolvedAt)}`
                          : ' · En curso'}
                      </p>
                    </div>
                    {incident.resolvedAt ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                        Resuelta
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResolve(incident.id)}
                        className="rounded-lg bg-rose-600 px-2 py-1 text-[9px] font-black text-white hover:bg-rose-700"
                      >
                        Cerrar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-black text-slate-900">
            Historial de alertas
          </h3>
          {snapshot.alerts.length === 0 ? (
            <p className="mt-2 text-[11px] text-slate-500">
              Aún no se han enviado alertas. Usa “Probar alerta” para validar el
              canal.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {snapshot.alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2"
                >
                  <span
                    className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      ALERT_STYLES[alert.severity] ?? ALERT_STYLES.info
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-slate-700">
                      {alert.message}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      {formatDate(alert.at)} · {alert.channel}
                      {alert.delivered ? ' · entregada' : ' · registrada'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-relaxed text-slate-500">
        <strong className="text-slate-700">Cómo se calcula el SLA:</strong> el
        objetivo es {UPTIME_TARGET} % mensual, equivalente a{' '}
        {formatMinutes(snapshot.allowedDowntimeMinutes)} de caída en un mes de
        30 días. El mantenimiento planificado de madrugada no consume ese
        presupuesto. Las alertas críticas se generan tras dos fallos
        consecutivos de <code>/health</code> y se cierran al recuperar el
        servicio.
      </p>
    </section>
  )
}
