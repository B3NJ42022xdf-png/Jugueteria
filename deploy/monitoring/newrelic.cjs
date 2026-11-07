/**
 * New Relic · configuración del agente Node.
 *
 * Instala el agente en el servidor:
 *   npm install newrelic --omit=dev
 *
 * Arranca con:
 *   NEW_RELIC_HOME=/srv/mi-jugueteria-web/deploy/monitoring \
 *   NEW_RELIC_LICENSE_KEY=... \
 *   node -r newrelic server/index.mjs
 *
 * O con PM2:
 *   node_args: '-r newrelic'
 *
 * Crea una política de alertas en New Relic con estas condiciones:
 *   - Apdex < 0.9 durante 5 minutos.
 *   - Tasa de errores > 1 % durante 5 minutos.
 *   - Throughput = 0 durante 2 minutos.
 *   - Uso de memoria > 85 % durante 10 minutos.
 * Notifica al correo del equipo técnico y al webhook de Slack.
 */

module.exports = {
  app_name: [process.env.NEW_RELIC_APP_NAME ?? 'Mi Juguetería'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY ?? '',
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL ?? 'info',
    filepath: process.env.NEW_RELIC_LOG ?? 'stdout',
  },
  distributed_tracing: { enabled: true },
  application_logging: {
    enabled: true,
    forwarding: { enabled: true },
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
    ],
  },
}
