#!/bin/sh
set -eu

cd /app

: "${NPM_CONFIG_REGISTRY:=https://registry.npmmirror.com/}"
: "${NPM_REGISTRY_FALLBACKS:=https://registry.npmjs.org/ https://registry.yarnpkg.com/}"
: "${NPM_INSTALL_ATTEMPTS_PER_REGISTRY:=2}"

npm_set_common_config() {
  registry="$1"
  echo "[frontend] npm registry: $registry"
  npm config set registry "$registry" >/dev/null
  npm config set replace-registry-host always >/dev/null || true
  npm config set fetch-retries "${NPM_CONFIG_FETCH_RETRIES:-10}" >/dev/null
  npm config set fetch-retry-factor "${NPM_CONFIG_FETCH_RETRY_FACTOR:-2}" >/dev/null || true
  npm config set fetch-retry-mintimeout "${NPM_CONFIG_FETCH_RETRY_MINTIMEOUT:-20000}" >/dev/null
  npm config set fetch-retry-maxtimeout "${NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT:-180000}" >/dev/null
  npm config set fetch-timeout "${NPM_CONFIG_FETCH_TIMEOUT:-600000}" >/dev/null
  npm config set audit false >/dev/null
  npm config set fund false >/dev/null
  npm config set progress true >/dev/null || true
}

clean_node_modules() {
  echo "[frontend] cleaning broken node_modules volume..."
  mkdir -p node_modules
  find node_modules -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
  rm -rf node_modules/.bin node_modules/.package-lock.hash 2>/dev/null || true
}

install_with_registry() {
  registry="$1"
  npm_set_common_config "$registry"

  attempt=1
  while [ "$attempt" -le "$NPM_INSTALL_ATTEMPTS_PER_REGISTRY" ]; do
    echo "[frontend] npm ci attempt $attempt/$NPM_INSTALL_ATTEMPTS_PER_REGISTRY via $registry"
    clean_node_modules

    if npm ci --include=dev --prefer-online --no-audit --no-fund --loglevel=info; then
      return 0
    fi

    echo "[frontend] npm ci failed on attempt $attempt via $registry"
    npm cache verify >/dev/null 2>&1 || true
    attempt=$((attempt + 1))
    sleep 5
  done

  return 1
}

if [ ! -f package-lock.json ]; then
  echo "[frontend] ERROR: package-lock.json not found in /app"
  exit 1
fi

LOCK_HASH="$(sha256sum package-lock.json | cut -d' ' -f1)"
HASH_FILE="node_modules/.package-lock.hash"

if [ -x node_modules/.bin/vite ] && [ -f "$HASH_FILE" ] && [ "$(cat "$HASH_FILE" 2>/dev/null || true)" = "$LOCK_HASH" ]; then
  echo "[frontend] npm packages are cached. Skipping npm ci."
else
  echo "[frontend] installing npm packages. This is needed only on first run or when package-lock.json changes."
  echo "[frontend] if your network blocks npm, try: NPM_CONFIG_REGISTRY=https://registry.npmmirror.com/ docker compose up -d frontend"

  success=0
  tried=""
  for registry in "$NPM_CONFIG_REGISTRY" $NPM_REGISTRY_FALLBACKS; do
    case " $tried " in
      *" $registry "*) continue ;;
    esac
    tried="$tried $registry"

    if install_with_registry "$registry"; then
      success=1
      break
    fi
  done

  if [ "$success" != "1" ]; then
    echo "[frontend] ERROR: npm packages could not be installed from any registry."
    echo "[frontend] Check Docker network/VPN/proxy, or run npm ci once on the host and then retry."
    exit 1
  fi

  echo "$LOCK_HASH" > "$HASH_FILE"
fi

echo "[frontend] Starting Vite on 0.0.0.0:5173"
exec npm run dev -- --host 0.0.0.0 --port 5173
