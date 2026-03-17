#!/bin/bash
# qclaw 一键启动脚本（launchd 常驻版）
# 用法: ./start.sh
# 停止: ./start.sh stop
# 状态: ./start.sh status

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=4174
NGROK_DOMAIN="guilefully-unclarifying-shirly.ngrok-free.dev"
SERVER_PLIST="$HOME/Library/LaunchAgents/ai.qclaw.server.plist"
NGROK_PLIST="$HOME/Library/LaunchAgents/ai.qclaw.ngrok.plist"
UID_NUM="$(id -u)"

mkdir -p "$SCRIPT_DIR/.qclaw"

stop() {
  echo "🛑 停止 qclaw launchd 服务..."
  launchctl bootout "gui/$UID_NUM" "$SERVER_PLIST" 2>/dev/null || true
  launchctl bootout "gui/$UID_NUM" "$NGROK_PLIST" 2>/dev/null || true
  pkill -f 'server/index.mjs' 2>/dev/null || true
  pkill -f 'ngrok http' 2>/dev/null || true
  echo "✅ 已停止"
  exit 0
}

status() {
  echo "--- qclaw server ---"
  launchctl print "gui/$UID_NUM/ai.qclaw.server" 2>/dev/null | grep -E 'state =|pid =|last exit code =|runs =' || echo 'not loaded'
  echo "--- qclaw ngrok ---"
  launchctl print "gui/$UID_NUM/ai.qclaw.ngrok" 2>/dev/null | grep -E 'state =|pid =|last exit code =|runs =' || echo 'not loaded'
  echo "--- health ---"
  printf 'local:' && curl -s -o /dev/null -w '%{http_code}\n' "http://127.0.0.1:$PORT/api/overview" || true
  printf 'public:' && curl -s -o /dev/null -w '%{http_code}\n' "https://$NGROK_DOMAIN" || true
  exit 0
}

if [ "${1:-}" = "stop" ]; then stop; fi
if [ "${1:-}" = "status" ]; then status; fi

echo "📦 构建前端..."
cd "$SCRIPT_DIR"
npm run build

echo "🚀 通过 launchd 启动 qclaw 常驻服务..."
launchctl bootout "gui/$UID_NUM" "$SERVER_PLIST" 2>/dev/null || true
launchctl bootout "gui/$UID_NUM" "$NGROK_PLIST" 2>/dev/null || true
pkill -f 'server/index.mjs' 2>/dev/null || true
pkill -f 'ngrok http' 2>/dev/null || true
launchctl bootstrap "gui/$UID_NUM" "$SERVER_PLIST"
launchctl bootstrap "gui/$UID_NUM" "$NGROK_PLIST"
launchctl kickstart -k "gui/$UID_NUM/ai.qclaw.server"
sleep 3
launchctl kickstart -k "gui/$UID_NUM/ai.qclaw.ngrok"
sleep 6

if curl -sf "http://127.0.0.1:$PORT/api/overview" > /dev/null; then
  echo "  ✅ server 正常，API 可达"
else
  echo "  ❌ server 启动失败，查看: .qclaw/server.log / .qclaw/launchd-server.err.log"
  exit 1
fi

if curl -sf "https://$NGROK_DOMAIN" > /dev/null; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 qclaw 已上线（launchd 常驻）！"
  echo "   公网地址: https://$NGROK_DOMAIN"
  echo "   本地地址: http://127.0.0.1:$PORT"
  echo "   查看状态: ./start.sh status"
  echo "   停止服务: ./start.sh stop"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "  ⚠️  tunnel 未就绪，先执行 ./start.sh status 查看"
fi
