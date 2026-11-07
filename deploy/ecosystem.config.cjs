/**
 * PM2 · Mi Juguetería
 *
 *   pm2 start deploy/ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup
 *
 * Dos o más instancias en clúster: si una cae, las demás siguen atendiendo y
 * PM2 reinicia la que falló con backoff exponencial. `instances: 'max'` usa
 * todos los núcleos disponibles; en una máquina de 4 vCPU son 4 réplicas.
 */

const path = require('node:path')

module.exports = {
  apps: [
    {
      name: 'mi-jugueteria-web',
      script: 'server/index.mjs',
      cwd: path.resolve(__dirname, '..'),
      instances: Number(process.env.WEB_CONCURRENCY) || 'max',
      exec_mode: 'cluster',
      instance_var: 'INSTANCE_ID',
      autorestart: true,
      watch: false,
      max_memory_restart: '350M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 200,
      max_restarts: 20,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
        APP_VERSION: process.env.APP_VERSION ?? '1.0.0',
        ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL ?? '',
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
      },
    },
  ],
}
