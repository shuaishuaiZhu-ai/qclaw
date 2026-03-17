#!/bin/bash
# qclaw 一键启动脚本
# 用法: ./start.sh
# 停止: ./start.sh stop

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.qclaw/qclaw.pid"
TUNNEL_PID_FILE="$SCRIPT_DIR/.qclaw/tunnel.pid"
LOG_FILE="$SCRIPT_DIR/.qclaw/server.log"
TUNNEL_LOG="$SCRIPT_DIR/.qclaw/tunnel.log"
PORT=4174

mkdir -p "$SCRIPT_DIR/.qclaw"

stop() {
  echo "🛑 停止 qclaw..."
  if [ -f "$PID_FILE" ]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null && echo "  server stopped" || true
    rm -f "$PID_FILE"
  fi
  if [ -f "$TUNNEL_PID_FILE" ]; then
    kill "$(cat "$TUNNEL_PID_FILE")" 2>/dev/null && echo "  tunnel stopped" || true
    rm -f "$TUNNEL_PID_FILE"
  fi
  # 兜底 kill 残留进程
  pkill -f 'server/index.mjs' 2>/dev/null || true
  pkill -f 'cloudflared tunnel' 2>/dev/null || true
  pkill -f 'ngrok http' 2>/dev/null || true
  echo "✅ 已停止"
  exit 0
}

if [ "$1" = "stop" ]; then stop; fi

# 先停掉旧实例
pkill -f 'server/index.mjs' 2>/dev/null || true
pkill -f 'cloudflared tunnel' 2>/dev/null || true
pkill -f 'ngrok http' 2>/dev/null || true
sleep 1

echo "📦 构建前端..."
cd "$SCRIPT_DIR"
npm run build

echo "🚀 启动 prod server (port $PORT)..."
nohup node server/index.mjs >> "$LOG_FILE" 2>&1 < /dev/null &
echo $! > "$PID_FILE"
sleep 2

# 验证 server 是否正常
if curl -sf "http://127.0.0.1:$PORT/api/overview" > /dev/null; then
  echo "  ✅ server 正常，API 可达"
else
  echo "  ❌ server 启动失败，查看日志: $LOG_FILE"
  exit 1
fi

NGROK_DOMAIN="guilefully-unclarifying-shirly.ngrok-free.dev"

echo "🌐 启动 ngrok Tunnel (固定域名: $NGROK_DOMAIN)..."
nohup ngrok http "$PORT" --domain="$NGROK_DOMAIN" --log=stdout >> "$TUNNEL_LOG" 2>&1 < /dev/null &
echo $! > "$TUNNEL_PID_FILE"

echo "  等待 tunnel 建立..."
for i in $(seq 1 15); do
  if grep -q "started tunnel" "$TUNNEL_LOG" 2>/dev/null; then break; fi
  sleep 1
done

if grep -q "started tunnel" "$TUNNEL_LOG" 2>/dev/null; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 qclaw 已上线！"
  echo "   公网地址: https://$NGROK_DOMAIN"
  echo "   本地地址: http://127.0.0.1:$PORT"
  echo "   停止服务: ./start.sh stop"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "  ⚠️  tunnel 启动超时，查看日志: $TUNNEL_LOG"
fi
