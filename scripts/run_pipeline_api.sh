#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/services/pipeline-api"
PYTHON_BIN="${PYTHON_BIN:-/home/lanceharvie/qdrant-env/bin/python}"
HOST="${PIPELINE_API_HOST:-127.0.0.1}"
PORT="${PIPELINE_API_PORT:-8100}"

cd "$API_DIR"

if [[ -f ".env" ]]; then
  set -a
  source ".env"
  set +a
fi

exec "$PYTHON_BIN" -m uvicorn app.main:app --host "$HOST" --port "$PORT"
