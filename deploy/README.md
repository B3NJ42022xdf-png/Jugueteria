# Despliegue y disponibilidad · Mi Juguetería

Objetivo: **99.9 % de disponibilidad mensual** (máximo ~43 min de caída en un
mes de 30 días), mantenimiento solo en madrugada, autoreinicio, respaldos
diarios y alertas en tiempo real.

## 1. Arquitectura

```
Internet
   │
   ▼
Nginx :80  ── balancea (least_conn) ──►  app × N  (Node + dist)
   │
   ├── /health  → JSON con estado y uptime
   └── error 502/503/504 → página de mantenimiento
```

- **PM2** o **systemd** reinician el proceso si cae.
- **Docker Compose** levanta N réplicas con `restart: always` y healthcheck.
- **Nginx** descubre réplicas nuevas por Docker DNS (`resolve`) y reintenta en
  otra réplica con `proxy_next_upstream`.
- **UptimeRobot** consulta `/health` cada 60 s desde fuera.
- **New Relic** recibe métricas del proceso Node.

## 2. Arranque local del servidor de producción

```bash
npm run build
npm start                 # http://localhost:3000
npm run health            # consulta /health y sale 1 si falla
```

Modo mantenimiento:

```bash
MAINTENANCE_MODE=true npm start
# Todas las rutas responden 503 con public/mantenimiento.html; /health sigue activo.
```

## 3. Docker + Nginx + réplicas escalables

```bash
docker compose -f deploy/docker-compose.yml up -d --build
curl http://localhost:8080/health
```

El servicio `app` arranca con `APP_REPLICAS` réplicas (2 por defecto). Nginx
usa `least_conn` y descubre las IPs nuevas mediante Docker DNS, sin reiniciar.

Escalar ante un pico de tráfico:

```bash
# de 2 a 4 réplicas
docker compose -f deploy/docker-compose.yml up -d --scale app=4

# o fijar el valor por defecto desde el entorno
APP_REPLICAS=3 docker compose -f deploy/docker-compose.yml up -d
```

Comprobar el reparto y el autoreinicio:

```bash
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f --tail=50 nginx
docker kill deploy-app-1        # Nginx sigue atendiendo con las demás
docker compose -f deploy/docker-compose.yml ps
```

Activar / retirar mantenimiento:

```bash
docker compose -f deploy/docker-compose.yml exec nginx touch /etc/nginx/maintenance.on
docker compose -f deploy/docker-compose.yml exec nginx rm /etc/nginx/maintenance.on
```

### 3.1 Validación de 500 usuarios simultáneos

El benchmark dispara **500 peticiones concurrentes** contra `/registro`, mide
p95/p99, req/s y tasa de error, y falla si p95 supera 1500 ms o hay más de 1 %
de errores:

```bash
npm run build
npm run preview          # terminal 1
npm run benchmark        # terminal 2
```

Variables útiles:

```bash
BENCH_CONCURRENCY=500 BENCH_MAX_P95_MS=1500 npm run benchmark
BENCH_URL=http://localhost:8080 BENCH_CONCURRENCY=500 npm run benchmark
```

El resultado queda en `public/performance-report.json` (`loadTest`).

## 4. PM2

```bash
npm install -g pm2
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup
pm2 status
pm2 logs mi-jugueteria-web
```

`ecosystem.config.cjs` usa `instances: 'max'` (todos los núcleos), modo
clúster, `autorestart`, backoff exponencial, `max_restarts` y `wait_ready`.
Para limitar el número de workers:

```bash
WEB_CONCURRENCY=4 pm2 start deploy/ecosystem.config.cjs --env production
```

## 5. systemd (alternativa sin PM2)

```bash
sudo cp deploy/systemd/jugueteria.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now jugueteria
sudo systemctl status jugueteria
```

`Restart=always` y `RestartSec=5` reinician el servicio ante cualquier caída.

## 6. Respaldos diarios de PostgreSQL

```bash
sudo cp deploy/systemd/jugueteria-backup.service /etc/systemd/system/
sudo cp deploy/systemd/jugueteria-backup.timer   /etc/systemd/system/
sudo cp deploy/.env.example /etc/mi-jugueteria-backup.env   # completar credenciales
sudo chmod 600 /etc/mi-jugueteria-backup.env
sudo systemctl daemon-reload
sudo systemctl enable --now jugueteria-backup.timer
systemctl list-timers jugueteria-backup.timer
```

El timer se ejecuta **todos los días a las 03:15 (America/Bogota)** con
`Persistent=true` (recupera ejecuciones perdidas). El script:

- Genera `jugueteria-AAAAMMdd-HHMMSS.sql.gz`.
- Verifica que el gzip no esté corrupto y calcula SHA-256.
- Borra copias locales de más de 14 días.
- Opcionalmente sube a S3 con cifrado AES-256 (`S3_BUCKET`).

Restauración:

```bash
CONFIRM_RESTORE=YES DATABASE_URL=postgres://... \
  ./deploy/scripts/restore-db.sh /var/backups/jugueteria/jugueteria-....sql.gz
```

El panel de administración (**🛡️ Disponibilidad**) también permite crear y
descargar un respaldo JSON de los datos locales para soporte.

## 7. Monitoreo y alertas

### UptimeRobot

```bash
UPTIMEROBOT_API_KEY=ur... \
UPTIMEROBOT_ALERT_CONTACTS=0123456_0_0 \
BASE_URL=https://mijugueteria.co \
APPLY=1 node deploy/monitoring/uptimerobot.mjs
```

Crea dos monitores cada 60 s:

- `GET /health` con la palabra clave `ok`.
- `GET /catalogo` con HTTP 200.

Sin `APPLY=1` el script solo muestra el dry-run. Configura los contactos de
alerta (correo, SMS, Slack) en UptimeRobot para que la notificación llegue al
equipo técnico.

### New Relic

```bash
npm install newrelic --omit=dev
NEW_RELIC_HOME=/srv/mi-jugueteria-web/deploy/monitoring \
NEW_RELIC_LICENSE_KEY=... \
node -r newrelic server/index.mjs
```

Crea la política de alertas descrita en `deploy/monitoring/newrelic.cjs`
(Apdex, errores, throughput, memoria) y apunta las notificaciones al correo del
equipo y a Slack.

### Alertas desde el panel

`server/index.mjs` expone `POST /api/alerts/test`. Si defines
`ALERT_WEBHOOK_URL`, el servidor reenvía la alerta a Slack sin problemas de
CORS. Si no está configurado, la alerta queda registrada en el historial del
panel.

## 8. Mantenimiento en madrugada

El panel (**🛡️ Disponibilidad**) solo permite ventanas entre **00:00 y 06:00**.
La configuración por defecto es **domingo 02:00–04:00 (America/Bogota)**.

Procedimiento:

1. Programar la ventana en el panel y avisar a soporte.
2. Pausar los monitores de UptimeRobot o marcarlos como mantenimiento.
3. Activar la página 503 (`MAINTENANCE_MODE=true` o `maintenance.on` en Nginx).
4. Ejecutar despliegue, migraciones y respaldos.
5. Retirar el modo mantenimiento y verificar `/health`.

El mantenimiento planificado no consume el presupuesto de caída del SLA.
