/**
 * Respaldos locales de la tienda.
 *
 * La base de datos real se respalda en el servidor con
 * `deploy/scripts/backup-db.sh` y el timer de systemd. Este servicio cubre la
 * parte que sí vive en el navegador: exporta usuarios, pedidos, inventario y
 * opiniones a un JSON descargable para soporte y auditoría.
 *
 * Solo se guarda el último respaldo completo en `localStorage` (los metadatos
 * de todos). Así el panel puede ofrecer "descargar el último respaldo" sin
 * duplicar grandes volúmenes de datos ni agotar la cuota del navegador.
 */

const INDEX_KEY = 'jugueteria.backups.v1'
const LATEST_KEY = 'jugueteria.backup.latest.v1'
const RETENTION_DAYS = 14
const SCHEDULED_HOUR = 3
const SCHEDULED_MINUTE = 15

const SOURCES = [
  { key: 'jugueteria.users.v1', label: 'Usuarios' },
  { key: 'jugueteria.customProducts.v1', label: 'Productos personalizados' },
  { key: 'jugueteria.productChanges.v1', label: 'Cambios de producto' },
  { key: 'jugueteria.stock.v1', label: 'Stock' },
  { key: 'jugueteria.ratings.v1', label: 'Opiniones' },
  { key: 'jugueteria.receipts.v1', label: 'Recibos' },
  { key: 'jugueteria.ledger.v1', label: 'Libro de ventas' },
  { key: 'jugueteria.shipments.v1', label: 'Envíos' },
  { key: 'jugueteria.orderAudit.v1', label: 'Auditoría de pedidos' },
]

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
    // Si el navegador bloquea o llena el almacenamiento, el respaldo sigue
    // siendo descargable porque ya está en memoria.
  }
}

function round(value) {
  return Math.round(value * 100) / 100
}

function byteSize(text) {
  return new TextEncoder().encode(text).length
}

function countRecords(data) {
  return Object.values(data).reduce((total, value) => {
    if (Array.isArray(value)) return total + value.length
    if (value && typeof value === 'object') return total + Object.keys(value).length
    return total + 1
  }, 0)
}

function stamp(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
}

export function listBackups() {
  const entries = readJson(INDEX_KEY, [])
  return Array.isArray(entries) ? entries : []
}

/** Construye el contenido completo del respaldo a partir de localStorage. */
export function buildBackupPayload({ kind = 'manual', note = '' } = {}) {
  const createdAt = new Date().toISOString()
  const data = {}
  const included = []

  for (const source of SOURCES) {
    const raw = localStorage.getItem(source.key)
    if (raw === null) continue

    try {
      data[source.key] = JSON.parse(raw)
    } catch {
      data[source.key] = raw
    }

    included.push(source.label)
  }

  return {
    format: 'mi-jugueteria-backup',
    version: 1,
    createdAt,
    kind,
    note,
    source: 'localStorage',
    included,
    data,
  }
}

/**
 * Crea un respaldo, registra sus metadatos y conserva el último JSON completo.
 * Devuelve `{ metadata, payload, json, fileName, stored }`.
 */
export function createLocalBackup({ kind = 'manual', note = '' } = {}) {
  const payload = buildBackupPayload({ kind, note })
  const json = `${JSON.stringify(payload, null, 2)}\n`
  const createdAt = payload.createdAt
  const fileName = `jugueteria-${kind}-${stamp(new Date(createdAt))}.json`
  const metadata = {
    id: crypto.randomUUID(),
    createdAt,
    kind,
    note,
    fileName,
    bytes: byteSize(json),
    records: countRecords(payload.data),
    sources: payload.included.length,
    storage: 'localStorage',
    retentionDays: RETENTION_DAYS,
  }

  let stored = true
  try {
    localStorage.setItem(LATEST_KEY, json)
  } catch {
    stored = false
  }

  metadata.stored = stored
  const entries = [metadata, ...listBackups()].slice(0, 30)
  writeJson(INDEX_KEY, entries)

  return { metadata, payload, json, fileName, stored }
}

export function getLatestBackupPayload() {
  try {
    return JSON.parse(localStorage.getItem(LATEST_KEY) ?? 'null')
  } catch {
    return null
  }
}

/** Descarga un respaldo. Si no se pasa uno, usa el último guardado. */
export function downloadBackup(payload = null, fileName = '') {
  const backup = payload ?? getLatestBackupPayload()

  if (!backup) return false

  const json = `${JSON.stringify(backup, null, 2)}\n`
  const name =
    fileName ||
    `jugueteria-manual-${stamp(new Date(backup.createdAt ?? Date.now()))}.json`
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  return true
}

/** Siguiente ejecución diaria del respaldo (03:15, hora local del negocio). */
export function getNextScheduledBackup(now = new Date()) {
  const next = new Date(now)
  next.setHours(SCHEDULED_HOUR, SCHEDULED_MINUTE, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next
}

export function getBackupSummary() {
  const entries = [...listBackups()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  const latest = entries[0] ?? null

  return {
    entries,
    latest,
    count: entries.length,
    totalBytes: entries.reduce((total, entry) => total + (entry.bytes ?? 0), 0),
    retentionDays: RETENTION_DAYS,
    schedule: {
      hour: SCHEDULED_HOUR,
      minute: SCHEDULED_MINUTE,
      label: '03:15',
      timezone: 'America/Bogota',
      nextRun: getNextScheduledBackup(),
    },
    lastRun: latest?.createdAt ?? null,
    storage: latest?.storage ?? 'localStorage',
    averageBytes: entries.length
      ? round(
          entries.reduce((total, entry) => total + (entry.bytes ?? 0), 0) /
            entries.length,
        )
      : 0,
  }
}
