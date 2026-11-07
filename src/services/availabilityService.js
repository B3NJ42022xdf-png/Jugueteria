/**
 * Disponibilidad, mantenimiento, monitoreo y alertas.
 *
 * Objetivo de servicio: 99.9 % mensual (como máximo ~43 min de caída en un mes
 * de 30 días). El panel calcula el uptime a partir de las incidencias no
 * planificadas del mes en curso y de las verificaciones sintéticas que hace
 * contra `/health`.
 *
 * En producción el monitoreo real lo hacen UptimeRobot y New Relic desde
 * fuera de la aplicación (ver `deploy/monitoring/`). Este módulo es la capa de
 * evidencia y configuración que ve el administrador.
 */

import { getBackupSummary } from './backupService.js'

export const UPTIME_TARGET = 99.9
export const UPTIME_MONTH_MINUTES = 30 * 24 * 60
export const ALLOWED_DOWNTIME_MINUTES =
  UPTIME_MONTH_MINUTES * (1 - UPTIME_TARGET / 100)
export const MAINTENANCE_TIMEZONE = 'America/Bogota'
export const MAINTENANCE_EARLIEST_HOUR = 0
export const MAINTENANCE_LATEST_HOUR = 6

const CONFIG_KEY = 'jugueteria.availability.config.v1'
const CHECKS_KEY = 'jugueteria.availability.checks.v1'
const INCIDENTS_KEY = 'jugueteria.availability.incidents.v1'
const ALERTS_KEY = 'jugueteria.availability.alerts.v1'
const MAX_CHECKS = 120
const MAX_ALERTS = 40

const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

const DEFAULT_CONFIG = {
  maintenance: {
    enabled: true,
    day: 0,
    startHour: 2,
    durationMinutes: 120,
    timezone: MAINTENANCE_TIMEZONE,
  },
  monitoring: {
    email: 'soporte@mijugueteria.co',
    slackWebhook: '',
    uptimeRobot: true,
    newRelic: true,
    checkIntervalSeconds: 60,
  },
  updatedAt: null,
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // La app sigue operando aunque el navegador bloquee el almacenamiento.
  }
}

function round(value) {
  return Math.round(value * 100) / 100
}

function percentile(values, ratio) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  )
  return sorted[index]
}

export function getDayLabel(day) {
  return DAY_LABELS[day] ?? DAY_LABELS[0]
}

/* ------------------------------------------------------------------ */
/* Configuración                                                       */
/* ------------------------------------------------------------------ */

export function getAvailabilityConfig() {
  const stored = readJson(CONFIG_KEY, {})
  const maintenance = stored.maintenance ?? {}
  const monitoring = stored.monitoring ?? {}

  return {
    ...DEFAULT_CONFIG,
    ...stored,
    maintenance: { ...DEFAULT_CONFIG.maintenance, ...maintenance },
    monitoring: { ...DEFAULT_CONFIG.monitoring, ...monitoring },
  }
}

/**
 * Solo se permite programar mantenimiento dentro de la madrugada
 * (00:00–06:00). Devuelve un mensaje de error o cadena vacía.
 */
export function validateMaintenanceWindow({
  startHour,
  durationMinutes,
} = {}) {
  const start = Number(startHour)
  const duration = Number(durationMinutes)

  if (!Number.isInteger(start) || start < 0 || start > 23) {
    return 'Selecciona una hora de inicio válida.'
  }

  if (!Number.isInteger(duration) || duration < 30 || duration > 240) {
    return 'La ventana debe durar entre 30 minutos y 4 horas.'
  }

  const endMinutes = start * 60 + duration

  if (endMinutes > MAINTENANCE_LATEST_HOUR * 60) {
    return 'La ventana debe terminar antes de las 06:00 (horario de madrugada).'
  }

  if (start < MAINTENANCE_EARLIEST_HOUR) {
    return 'La ventana debe comenzar después de las 00:00.'
  }

  return ''
}

/**
 * Guarda la programación de mantenimiento y los canales de alerta.
 * Si la ventana no es de madrugada, no se guarda nada.
 */
export function saveAvailabilityConfig(patch = {}) {
  const current = getAvailabilityConfig()
  const next = {
    ...current,
    ...patch,
    maintenance: {
      ...current.maintenance,
      ...(patch.maintenance ?? {}),
    },
    monitoring: {
      ...current.monitoring,
      ...(patch.monitoring ?? {}),
    },
    updatedAt: new Date().toISOString(),
  }

  next.maintenance.day = Number(next.maintenance.day)
  next.maintenance.startHour = Number(next.maintenance.startHour)
  next.maintenance.durationMinutes = Number(next.maintenance.durationMinutes)
  next.maintenance.enabled = Boolean(next.maintenance.enabled)

  if (
    !Number.isInteger(next.maintenance.day) ||
    next.maintenance.day < 0 ||
    next.maintenance.day > 6
  ) {
    return {
      ok: false,
      error: 'Selecciona un día de la semana válido.',
      config: current,
    }
  }

  const error = validateMaintenanceWindow(next.maintenance)
  if (error) return { ok: false, error, config: current }

  if (
    next.monitoring.slackWebhook &&
    !/^https?:\/\//i.test(next.monitoring.slackWebhook)
  ) {
    return {
      ok: false,
      error: 'El webhook de Slack debe ser una URL http(s) válida.',
      config: current,
    }
  }

  writeJson(CONFIG_KEY, next)
  return { ok: true, error: '', config: next }
}

/* ------------------------------------------------------------------ */
/* Ventana de mantenimiento                                            */
/* ------------------------------------------------------------------ */

/**
 * Calcula la próxima ventana (o la actual si está en curso).
 * Las horas se interpretan en la zona horaria del negocio (America/Bogota),
 * que es la misma que usa el timer de systemd.
 */
export function getMaintenanceWindow(
  config = getAvailabilityConfig().maintenance,
  now = new Date(),
) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + ((config.day - start.getDay() + 7) % 7))
  start.setHours(config.startHour, 0, 0, 0)

  let end = new Date(start.getTime() + config.durationMinutes * 60 * 1000)

  if (now >= end) {
    start.setDate(start.getDate() + 7)
    end = new Date(start.getTime() + config.durationMinutes * 60 * 1000)
  }

  const active = config.enabled && now >= start && now < end

  return {
    active,
    enabled: config.enabled,
    start,
    end,
    dayLabel: getDayLabel(config.day),
    startHour: config.startHour,
    durationMinutes: config.durationMinutes,
    timezone: config.timezone,
    label: `${String(config.startHour).padStart(2, '0')}:00 – ${String(
      Math.floor((config.startHour * 60 + config.durationMinutes) / 60),
    ).padStart(2, '0')}:${String(
      (config.startHour * 60 + config.durationMinutes) % 60,
    ).padStart(2, '0')}`,
  }
}

/* ------------------------------------------------------------------ */
/* Uptime                                                              */
/* ------------------------------------------------------------------ */

function monthStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function calculateMonthlyUptime(incidents, now = new Date()) {
  const start = monthStart(now)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const elapsedMinutes = Math.max(1, (now - start) / 60000)
  const totalMinutes = (monthEnd - start) / 60000
  const downtimeMinutes = incidents
    .filter((incident) => incident.planned !== true)
    .reduce((total, incident) => {
      const incidentStart = new Date(incident.startedAt)
      const incidentEnd = incident.resolvedAt
        ? new Date(incident.resolvedAt)
        : now
      const overlapStart = Math.max(incidentStart, start)
      const overlapEnd = Math.min(incidentEnd, now)

      return total + Math.max(0, (overlapEnd - overlapStart) / 60000)
    }, 0)

  const percent =
    ((elapsedMinutes - downtimeMinutes) / elapsedMinutes) * 100

  return {
    percent: Math.max(0, Math.min(100, percent)),
    totalMinutes: round(elapsedMinutes),
    monthMinutes: round(totalMinutes),
    downtimeMinutes: round(downtimeMinutes),
    monthLabel: new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    }).format(now),
  }
}

/* ------------------------------------------------------------------ */
/* Verificaciones e incidencias                                        */
/* ------------------------------------------------------------------ */

export function listHealthChecks() {
  const checks = readJson(CHECKS_KEY, [])
  return Array.isArray(checks) ? checks : []
}

export function listIncidents() {
  const incidents = readJson(INCIDENTS_KEY, [])
  return Array.isArray(incidents) ? incidents : []
}

export function listAlerts() {
  const alerts = readJson(ALERTS_KEY, [])
  return Array.isArray(alerts) ? alerts : []
}

export function registerAlert({
  severity = 'info',
  channel = 'Panel',
  message = '',
  delivered = false,
} = {}) {
  const alert = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    severity,
    channel,
    message,
    delivered,
  }

  writeJson(ALERTS_KEY, [alert, ...listAlerts()].slice(0, MAX_ALERTS))
  return alert
}

/**
 * Guarda una verificación. Tras dos fallos consecutivos abre una incidencia
 * (si no hay una abierta) y registra una alerta crítica. Al recuperarse, la
 * incidencia se cierra automáticamente.
 */
export function recordHealthCheck({
  status = 'down',
  latencyMs = 0,
  httpStatus = 0,
  detail = '',
} = {}) {
  const at = new Date().toISOString()
  const check = {
    id: crypto.randomUUID(),
    at,
    status,
    latencyMs: round(Math.max(0, Number(latencyMs) || 0)),
    httpStatus: Number(httpStatus) || 0,
    detail,
  }

  const checks = [...listHealthChecks(), check].slice(-MAX_CHECKS)
  writeJson(CHECKS_KEY, checks)

  const incidents = listIncidents()
  const openIncident = incidents.find((incident) => !incident.resolvedAt)
  const previous = checks.at(-2)

  if (status === 'down' && !openIncident && previous?.status === 'down') {
    const incident = {
      id: crypto.randomUUID(),
      startedAt: previous.at,
      resolvedAt: null,
      planned: false,
      cause: 'Monitoreo automático',
      detectedBy: 'healthcheck',
      notes: detail,
    }

    writeJson(INCIDENTS_KEY, [incident, ...incidents])
    registerAlert({
      severity: 'critical',
      channel: 'UptimeRobot / Panel',
      message: `Caída detectada: ${detail || 'el servicio no responde'}.`,
    })
  }

  if (status === 'up' && openIncident) {
    const resolved = incidents.map((incident) =>
      incident.id === openIncident.id
        ? { ...incident, resolvedAt: at, resolvedBy: 'healthcheck' }
        : incident,
    )
    writeJson(INCIDENTS_KEY, resolved)
    registerAlert({
      severity: 'recovery',
      channel: 'UptimeRobot / Panel',
      message: 'Servicio restablecido. La incidencia se cerró automáticamente.',
    })
  }

  return check
}

/**
 * Verifica `/health` con un timeout de 5 s. Si el endpoint no existe pero la
 * página responde, marca "degradado" (monitoreo mal configurado) en lugar de
 * declarar una caída falsa.
 */
export async function runAvailabilityCheck() {
  const startedAt = performance.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const response = await fetch('/health', {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)

    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    const latencyMs = performance.now() - startedAt

    if (response.ok && payload?.status === 'ok') {
      return recordHealthCheck({
        status: 'up',
        latencyMs,
        httpStatus: response.status,
        detail: `Endpoint /health OK · uptime ${Math.round(
          payload.uptimeSeconds ?? 0,
        )} s`,
      })
    }

    if (response.status === 404 || response.status === 501) {
      const page = await fetch('/', { method: 'HEAD', cache: 'no-store' })
      if (page.ok) {
        return recordHealthCheck({
          status: 'degraded',
          latencyMs: performance.now() - startedAt,
          httpStatus: page.status,
          detail: '/health no está configurado; la página sí responde.',
        })
      }
    }

    return recordHealthCheck({
      status: 'degraded',
      latencyMs,
      httpStatus: response.status,
      detail: payload?.status
        ? `Estado reportado: ${payload.status}`
        : `Respuesta HTTP ${response.status}`,
    })
  } catch (error) {
    return recordHealthCheck({
      status: 'down',
      latencyMs: performance.now() - startedAt,
      httpStatus: 0,
      detail:
        error?.name === 'AbortError'
          ? 'Tiempo de espera agotado (5 s).'
          : error instanceof Error
            ? error.message
            : 'No se pudo conectar con /health.',
    })
  }
}

export function resolveIncident(incidentId, resolvedBy = 'admin') {
  const incidents = listIncidents()
  const resolvedAt = new Date().toISOString()
  const next = incidents.map((incident) =>
    incident.id === incidentId
      ? { ...incident, resolvedAt, resolvedBy }
      : incident,
  )

  writeJson(INCIDENTS_KEY, next)
  registerAlert({
    severity: 'info',
    channel: 'Panel',
    message: 'Incidencia cerrada manualmente por el equipo técnico.',
  })

  return next
}

/**
 * Envía una alerta de prueba. En producción la reenvía el servidor a Slack
 * (`ALERT_WEBHOOK_URL`); si no está configurado, queda registrada en el panel.
 */
export async function sendTestAlert() {
  const message = `Alerta de prueba · Mi Juguetería · ${new Date().toLocaleString(
    'es-CO',
  )} · Objetivo ${UPTIME_TARGET}% mensual`
  let delivered = false
  let channel = 'Panel'
  let error

  try {
    const response = await fetch('/api/alerts/test', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (response.ok) {
      const payload = await response.json()
      delivered = Boolean(payload.delivered)
      channel = payload.channel ?? 'Panel'
      error = payload.error ?? ''
    } else {
      error = `El servidor respondió HTTP ${response.status}.`
    }
  } catch (requestError) {
    error =
      requestError instanceof Error
        ? requestError.message
        : 'No se pudo contactar al servidor.'
  }

  const alert = registerAlert({
    severity: 'test',
    channel,
    message,
    delivered,
  })

  return { delivered, channel, error, alert }
}

/* ------------------------------------------------------------------ */
/* Resumen para el panel                                               */
/* ------------------------------------------------------------------ */

export function getAvailabilitySnapshot(now = new Date()) {
  const config = getAvailabilityConfig()
  const checks = listHealthChecks()
  const incidents = listIncidents()
  const alerts = listAlerts()
  const lastCheck = checks.at(-1) ?? null
  const openIncident = incidents.find((incident) => !incident.resolvedAt) ?? null
  const maintenance = getMaintenanceWindow(config.maintenance, now)
  const uptime = calculateMonthlyUptime(incidents, now)
  const latencies = checks.slice(-30).map((check) => check.latencyMs)
  const allowedDowntime = uptime.monthMinutes * (1 - UPTIME_TARGET / 100)

  const statusKey = maintenance.active
    ? 'maintenance'
    : openIncident || lastCheck?.status === 'down'
      ? 'down'
      : lastCheck?.status === 'degraded'
        ? 'degraded'
        : 'operational'

  return {
    target: UPTIME_TARGET,
    uptimePercent: round(uptime.percent),
    monthLabel: uptime.monthLabel,
    totalMinutes: uptime.totalMinutes,
    monthMinutes: uptime.monthMinutes,
    downtimeMinutes: uptime.downtimeMinutes,
    allowedDowntimeMinutes: round(allowedDowntime),
    remainingDowntimeMinutes: round(
      Math.max(0, allowedDowntime - uptime.downtimeMinutes),
    ),
    meetsTarget: uptime.percent >= UPTIME_TARGET,
    status: {
      key: statusKey,
      label: {
        operational: 'Operativo',
        degraded: 'Degradado',
        down: 'Interrupción',
        maintenance: 'Mantenimiento',
      }[statusKey],
      lastCheck,
      openIncident,
    },
    maintenance: {
      ...maintenance,
      config: config.maintenance,
      validationError: validateMaintenanceWindow(config.maintenance),
    },
    monitoring: config.monitoring,
    config,
    lastCheck,
    checks: [...checks].reverse().slice(0, 20),
    incidents: [...incidents]
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 10),
    alerts: alerts.slice(0, 10),
    latency: {
      last: lastCheck?.latencyMs ?? 0,
      average: latencies.length
        ? round(
            latencies.reduce((total, value) => total + value, 0) /
              latencies.length,
          )
        : 0,
      p95: round(percentile(latencies, 0.95)),
    },
    backup: getBackupSummary(),
    monitoredSince: checks[0]?.at ?? null,
  }
}
