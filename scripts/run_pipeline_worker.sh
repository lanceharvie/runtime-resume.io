#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKER_DIR="$ROOT_DIR/services/pipeline-worker"
API_DIR="$ROOT_DIR/services/pipeline-api"
PYTHON_BIN="${PYTHON_BIN:-/home/lanceharvie/qdrant-env/bin/python}"

cd "$API_DIR"

if [[ -f "$API_DIR/.env" ]]; then
  set -a
  source "$API_DIR/.env"
  set +a
fi

exec "$PYTHON_BIN" "$WORKER_DIR/worker.py"
