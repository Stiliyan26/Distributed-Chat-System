#!/usr/bin/env bash
set -euo pipefail
# Repo root (Chat-System/), regardless of cwd.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

files=(
  docker-compose.auth.yml
  docker-compose.channel.yml
  docker-compose.messaging.yml
  docker-compose.presence.yml
  docker-compose.chat.yml
  docker-compose.delivery.yml
  docker-compose.api-gateway.yml
  docker-compose.loadtest.yml
)
args=()
for f in "${files[@]}"; do args+=(-f "$f"); done

docker compose "${args[@]}" "$@"
