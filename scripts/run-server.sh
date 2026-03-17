#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$SCRIPT_DIR/.qclaw"
mkdir -p "$LOG_DIR"

cd "$SCRIPT_DIR"
exec /Users/zhoumo1218/.nvm/versions/node/v24.14.0/bin/node server/index.mjs >> "$LOG_DIR/server.log" 2>&1
