#!/usr/bin/env bash
# 本地开发预览脚本：Astro 热更新模式，改代码即时生效，无需重启。
# 用法：./ops/dev/dev-restart.sh（默认端口 3618，可用 PORT=xxxx 覆盖）
# 注意：新增或修改文章 markdown 后，需执行 npm run content:feed / content:lists 再刷新页面。
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$ROOT_DIR/.tmp"
LOG_FILE="$TMP_DIR/astro-dev.log"
PORT="${PORT:-3618}"
LAN_IP="${LAN_IP:-$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)}"

cd "$ROOT_DIR"
mkdir -p "$TMP_DIR"

# 公开仓库的本地预览固定使用仓库内示例内容，不受外部内容目录影响
unset CONTENT_DIR

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"

  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill >/dev/null 2>&1 || true
    sleep 1
  fi
}

echo "正在重启开发服务…"

# 1. 停掉 Astro 自带的后台开发服务（Astro 7 用 .astro/dev.json 记录状态）
if [ -f "$ROOT_DIR/.astro/dev.json" ]; then
  ASTRO_TELEMETRY_DISABLED=1 npx astro dev stop >/dev/null 2>&1 || true
  sleep 1
fi

# 2. 端口兜底
stop_port "$PORT"

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "未检测到 node_modules，正在安装依赖…"
  npm install --silent
fi

SITE_URL="${SITE_URL:-http://localhost:$PORT/}"

if ! SITE_URL="$SITE_URL" npm run dev -- --host 0.0.0.0 --port "$PORT" --background > "$LOG_FILE" 2>&1; then
  echo "后台模式启动失败，改用前台常驻模式..." >&2
  SITE_URL="$SITE_URL" nohup npm run dev -- --host 0.0.0.0 --port "$PORT" >> "$LOG_FILE" 2>&1 &
  disown "$!" || true
fi

for attempt in {1..20}; do
  curl -fsS --max-time 2 -o /dev/null "http://localhost:$PORT" 2>/dev/null && break
  sleep 1
done

# 后台守护进程在某些终端/沙箱下会被回收，此时回退到前台常驻进程
if ! curl -fsS --max-time 2 -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
  echo "后台模式未保持运行，改用前台常驻模式..."
  SITE_URL="$SITE_URL" nohup npm run dev -- --host 0.0.0.0 --port "$PORT" >> "$LOG_FILE" 2>&1 &
  disown "$!" || true
fi

for attempt in {1..60}; do
  if curl -fsS --max-time 2 -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
    echo "已启动（热更新） http://localhost:$PORT/"
    if [ -n "$LAN_IP" ]; then
      echo "局域网  http://$LAN_IP:$PORT/"
    fi
    echo "日志 npx astro dev logs · 停止 npx astro dev stop"
    exit 0
  fi

  sleep 1
done

echo "开发服务超时未就绪。日志位置：$LOG_FILE" >&2
tail -n 80 "$LOG_FILE" >&2 || true
exit 1
