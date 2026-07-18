#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=${PAGESCMS_ENV_FILE:-/etc/pagescms/pagescms.env}
BACKUP_DIR=${PAGESCMS_BACKUP_DIR:-/var/backups/pagescms}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="$BACKUP_DIR/pagescms-$STAMP.dump"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "Cannot read $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

install -d -m 0700 "$BACKUP_DIR"
pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_FILE"

echo "Database backup written to $BACKUP_FILE"
