/**
 * Crea los monitores de UptimeRobot para Mi Juguetería.
 *
 * Uso:
 *   UPTIMEROBOT_API_KEY=ur... \
 *   UPTIMEROBOT_ALERT_CONTACTS=0123456_0_0 \
 *   BASE_URL=https://mijugueteria.co \
 *   APPLY=1 node deploy/monitoring/uptimerobot.mjs
 *
 * Sin APPLY=1 el script solo imprime las peticiones (dry-run) y no crea nada.
 * Alert contacts: usa los IDs de tu cuenta en el formato que exige la API v2.
 *
 * Documentación: https://uptimerobot.com/api/
 */

const API_URL = 'https://api.uptimerobot.com/v2/newMonitor'
const API_KEY = process.env.UPTIMEROBOT_API_KEY ?? ''
const APPLY = process.env.APPLY === '1'
const BASE_URL = (process.env.BASE_URL ?? 'https://mijugueteria.co').replace(
  /\/+$/,
  '',
)
const INTERVAL = process.env.UPTIMEROBOT_INTERVAL ?? '60'
const ALERT_CONTACTS = process.env.UPTIMEROBOT_ALERT_CONTACTS ?? ''

const monitors = [
  {
    friendly_name: 'Mi Juguetería · Health',
    url: `${BASE_URL}/health`,
    type: '1',
    interval: INTERVAL,
    keyword_type: '2',
    keyword_value: 'ok',
    http_method: 'GET',
  },
  {
    friendly_name: 'Mi Juguetería · Catálogo',
    url: `${BASE_URL}/catalogo`,
    type: '1',
    interval: INTERVAL,
    http_method: 'GET',
  },
]

async function createMonitor(monitor) {
  const body = new URLSearchParams({
    api_key: API_KEY,
    format: 'json',
    ...monitor,
  })

  if (ALERT_CONTACTS) body.set('alert_contacts', ALERT_CONTACTS)

  if (!APPLY) {
    console.log(
      `[dry-run] POST ${API_URL}\n${JSON.stringify(
        Object.fromEntries(body),
        null,
        2,
      )}\n`,
    )
    return
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10_000),
  })
  const payload = await response.json()

  if (payload.stat !== 'ok') {
    throw new Error(
      `UptimeRobot rechazó "${monitor.friendly_name}": ${
        payload.error?.message ?? JSON.stringify(payload)
      }`,
    )
  }

  console.log(
    `Monitor creado: ${monitor.friendly_name} · id ${payload.monitor?.id}`,
  )
}

async function main() {
  if (!API_KEY) {
    console.error('Falta UPTIMEROBOT_API_KEY.')
    process.exit(1)
  }

  if (!APPLY) {
    console.log('Modo dry-run. Añade APPLY=1 para crear los monitores.\n')
  }

  for (const monitor of monitors) {
    await createMonitor(monitor)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
