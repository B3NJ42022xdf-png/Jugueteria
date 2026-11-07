#!/usr/bin/env bash
#
# Restauración de un respaldo de PostgreSQL.
#
# Uso:
#   CONFIRM_RESTORE=YES DATABASE_URL=postgres://... \
#     ./deploy/scripts/restore-db.sh /var/backups/jugueteria/jugueteria-20260101-031500.sql.gz
#
# ADVERTENCIA: psql vuelve a ejecutar el SQL sobre la base actual. Hazlo en una
# base de staging o con la aplicación detenida.

set -Eeuo pipefail

FILE="${1:-}"
if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Uso: $0 /ruta/al/respaldo.sql.gz" >&2
  exit 1
fi

if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo "Restauración cancelada. Repite con CONFIRM_RESTORE=YES." >&2
  exit 1
fi

gzip -t "$FILE"

if [[ -n "${DATABASE_URL:-}" ]]; then
  gunzip -c "$FILE" | psql "$DATABASE_URL"
else
  : "${PGDATABASE:?Define DATABASE_URL o PGDATABASE}"
  export PGHOST="${PGHOST:-127.0.0.1}"
  export PGPORT="${PGPORT:-5432}"
  export PGUSER="${PGUSER:-jugueteria}"
  gunzip -c "$FILE" | psql --dbname="$PGDATABASE"
fi

echo "Restauración completada desde $FILE"
