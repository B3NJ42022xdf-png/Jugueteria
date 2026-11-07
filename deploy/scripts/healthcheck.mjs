/**
 * Healthcheck para cron, CI o supervisores externos.
 *
 *   HEALTH_URL=https://mijugueteria.co/health node deploy/scripts/healthcheck.mjs
 *
 * Sale con código 1 si el servicio no responde, si el HTTP no es 2xx o si el
 * estado reportado no es `ok`.
 */

const url = process.env.HEALTH_URL ?? 'http://127.0.0.1:3000/health'
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 5000)

async function main() {
  const startedAt = performance.now()

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const latencyMs = Math.round(performance.now() - startedAt)
    const payload = await response.json().catch(() => null)

    if (!response.ok || payload?.status !== 'ok') {
      console.error(
        JSON.stringify({
          ok: false,
          url,
          status: response.status,
          latencyMs,
          payload,
        }),
      )
      process.exit(1)
    }

    console.log(
      JSON.stringify({
        ok: true,
        url,
        status: response.status,
        latencyMs,
        uptimeSeconds: payload.uptimeSeconds,
        version: payload.version,
        timestamp: payload.timestamp,
      }),
    )
  } catch (error) {
    console.error(
      JSON.stringify({
        ok: false,
        url,
        error: error instanceof Error ? error.message : String(error),
      }),
    )
    process.exit(1)
  }
}

main()
