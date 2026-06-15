#!/bin/sh
set -eu

cd /src

RESTORE_HASH="$(find src -name '*.csproj' -type f -print | sort | xargs sha256sum | sha256sum | cut -d' ' -f1)"
HASH_FILE="/cache/restore.hash"

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE" 2>/dev/null || true)" != "$RESTORE_HASH" ]; then
  echo "[backend] Restoring NuGet packages. This is needed only on first run or when .csproj files change."
  dotnet restore src/Zerno.Api/Zerno.Api.csproj --disable-parallel
  echo "$RESTORE_HASH" > "$HASH_FILE"
else
  echo "[backend] NuGet packages are cached. Skipping dotnet restore."
fi

echo "[backend] Starting API on 0.0.0.0:5080"
exec dotnet run --project src/Zerno.Api/Zerno.Api.csproj --no-restore --no-launch-profile --urls http://0.0.0.0:5080
