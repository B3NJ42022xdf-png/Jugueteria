#!/usr/bin/env bash
#
# Respaldo diario de PostgreSQL para Mi Juguetería.
#
# Variables:
#   DATABASE_URL     Cadena completa (tiene prioridad).
#   PGHOST/PGUSER/PGPASSWORD/PGDATABASE  Alternativa por variables.
#   BACKUP_DIR       Directorio local (por defecto /var/backups/jugueteria).
#   RETENTION_DAYS   Días de retención local (por defecto 14).
#   S3_BUCKET        Bucket opcional para copia fuera del servidor.
#
# Ejecución manual:
#   sudo -u backup /srv/mi-jugueteria-web/deploy/scripts/backup-db.sh
#
# Se ejecuta a diario a las 03:15 con deploy/systemd/jugueteria-backup.timer.

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/jugueteria}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${BACKUP_DIR}/jugueteria-${STAMP}.sql.gz"
CHECKSUM="${FILE}.sha256"

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$FILE" "$CHECKSUM"' ERR

echo "[$(date -Is)] Iniciando respaldo de Mi Juguetería"

if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump \
    --no-owner \
    --no-privileges \
    --format=plain \
    --dbname="$DATABASE_URL" \
    | gzip -9 > "$FILE"
else
  : "${PGDATABASE:?Define DATABASE_URL o PGDATABASE para el respaldo}"
  export PGHOST="${PGHOST:-127.0.0.1}"
  export PGPORT="${PGPORT:-5432}"
  export PGUSER="${PGUSER:-jugueteria}"

  pg_dump \
    --no-owner \
    --no-privileges \
    --format=plain \
    --dbname="$PGDATABASE" \
    | gzip -9 > "$FILE"
fi

if [[ ! -s "$FILE" ]] || ! gzip -t "$FILE"; then
  echo "ERROR: el respaldo quedó vacío o corrupto." >&2
  exit 1
fi

sha256sum "$FILE" > "$CHECKSUM"
BYTES="$(stat -c '%s' "$FILE")"
echo "[$(date -Is)] Respaldo OK · ${FILE} · ${BYTES} bytes"

if [[ -n "${S3_BUCKET:-}" ]]; then
  aws s3 cp "$FILE" "s3://${S3_BUCKET}/postgres/" \
    --sse AES256 \
    --only-show-errors
  aws s3 cp "$CHECKSUM" "s3://${S3_BUCKET}/postgres/" \
    --sse AES256 \
    --only-show-errors
  echo "[$(date -Is)] Copia externa OK · s3://${S3_BUCKET}/postgres/"
fi

# Retención local. La copia en S3 puede tener su propia política de ciclo de vida.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'jugueteria-*.sql.gz' \
  -mtime +"$RETENTION_DAYS" -print -delete

echo "[$(date -Is)] Respaldo finalizado"
