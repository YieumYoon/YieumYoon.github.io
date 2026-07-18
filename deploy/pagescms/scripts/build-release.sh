#!/usr/bin/env bash
set -euo pipefail

PAGESCMS_ROOT=${PAGESCMS_ROOT:-/opt/pagescms}
PAGESCMS_REPOSITORY=${PAGESCMS_REPOSITORY:-https://github.com/pagescms/pagescms.git}
PAGESCMS_COMMIT=${PAGESCMS_COMMIT:-6f4e860a35d934406580287e7042e5e111e207a1}
NODE_VERSION=${NODE_VERSION:-24}

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
DEPLOY_DIR=$(dirname "$SCRIPT_DIR")
OVERLAY_DIR="$DEPLOY_DIR/overlay"

if [[ $(id -un) != pagescms ]]; then
  echo "Run this script as the pagescms service account." >&2
  exit 1
fi

for command in fnm git sha256sum; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

eval "$(fnm env --shell bash)"
fnm install "$NODE_VERSION"
fnm use "$NODE_VERSION"

NODE_BIN_DIR=$(dirname "$(readlink -f "$(command -v node)")")
OVERLAY_HASH=$(
  find "$OVERLAY_DIR" -type f -print0 \
    | sort -z \
    | xargs -0 sha256sum \
    | sha256sum \
    | cut -d ' ' -f 1
)
RELEASE_ID="${PAGESCMS_COMMIT:0:12}-${OVERLAY_HASH:0:12}"
RELEASE_DIR="$PAGESCMS_ROOT/releases/$RELEASE_ID"
BUILD_DIR="$PAGESCMS_ROOT/releases/.build-$RELEASE_ID-$$"

install -d "$PAGESCMS_ROOT/releases" "$PAGESCMS_ROOT/node"
ln -sfn "$NODE_BIN_DIR" "$PAGESCMS_ROOT/node/current"

if [[ ! -d "$RELEASE_DIR" ]]; then
  cleanup() {
    rm -rf "$BUILD_DIR"
  }
  trap cleanup EXIT

  git clone --filter=blob:none --no-checkout "$PAGESCMS_REPOSITORY" "$BUILD_DIR"
  git -C "$BUILD_DIR" checkout --detach "$PAGESCMS_COMMIT"
  rm -rf "$BUILD_DIR/.git"
  cp -a "$OVERLAY_DIR/." "$BUILD_DIR/"

  cd "$BUILD_DIR"
  npm ci --no-audit --no-fund

  BASE_URL=http://localhost:3000 \
  DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
  BETTER_AUTH_SECRET=build-only-secret-not-used-at-runtime \
  GITHUB_APP_ID=0 \
  GITHUB_APP_NAME=build-only \
  GITHUB_APP_CLIENT_ID=build-only \
  GITHUB_APP_CLIENT_SECRET=build-only \
  GITHUB_APP_PRIVATE_KEY=build-only \
  GITHUB_APP_WEBHOOK_SECRET=build-only \
    ./node_modules/.bin/next build

  mv "$BUILD_DIR" "$RELEASE_DIR"
  trap - EXIT
fi

ln -sfn "$RELEASE_DIR" "$PAGESCMS_ROOT/current"

echo "Pages CMS release ready: $RELEASE_DIR"
echo "Restart with: sudo systemctl restart pagescms"
