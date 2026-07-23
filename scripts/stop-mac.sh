#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="prelegal"

if docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "Prelegal stopped."
else
  echo "Prelegal was not running."
fi
