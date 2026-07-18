#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_APP_PRIVATE_KEY_FILE:?Missing GITHUB_APP_PRIVATE_KEY_FILE}"

if [[ ! -r "$GITHUB_APP_PRIVATE_KEY_FILE" ]]; then
  echo "Cannot read GitHub App private key: $GITHUB_APP_PRIVATE_KEY_FILE" >&2
  exit 1
fi

export GITHUB_APP_PRIVATE_KEY
GITHUB_APP_PRIVATE_KEY=$(<"$GITHUB_APP_PRIVATE_KEY_FILE")

cd /opt/pagescms/current

echo "Applying Pages CMS database migrations..."
./node_modules/.bin/drizzle-kit migrate

exec ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3000
