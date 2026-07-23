#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="prelegal"
CONTAINER_NAME="prelegal"
PORT=8000

cd "$(dirname "$0")/.."

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker build -t "$IMAGE_NAME" .

ENV_ARGS=()
if [ -f .env ]; then
  ENV_ARGS=(--env-file .env)
fi

docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:8000" \
  "${ENV_ARGS[@]}" \
  "$IMAGE_NAME"

echo "Prelegal is running at http://localhost:$PORT"
