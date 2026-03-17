#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$SCRIPT_DIR/.qclaw"
mkdir -p "$LOG_DIR"

cd "$SCRIPT_DIR"
exec /opt/homebrew/bin/ngrok http 4174 --url=https://guilefully-unclarifying-shirly.ngrok-free.dev --log=stdout >> "$LOG_DIR/tunnel.log" 2>&1
