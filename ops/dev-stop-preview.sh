#!/usr/bin/env bash
# 停止本地预览服务（Astro dev）。
# 用法：./ops/dev-stop-preview.sh（默认端口 3618，可用 PORT=xxxx 覆盖）
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3618}"

cd "$ROOT_DIR"

# 1. 停 Astro 后台开发服务，与 ops/dev-restart-preview.sh 的 --background 启动方式对应
if [ -f "$ROOT_DIR/.astro/dev.json" ]; then
  echo "正在停止 Astro 开发服务..."
  ASTRO_TELEMETRY_DISABLED=1 npx astro dev stop >/dev/null 2>&1 || true
  sleep 1
fi

# 2. 按 cwd 兜底：清理本项目残留的 astro dev 进程，避免误伤其他项目
stop_project_processes() {
  local pids
  pids="$(pgrep -f "astro dev" 2>/dev/null || true)"

  if [ -z "$pids" ]; then
    return
  fi

  while IFS= read -r pid; do
    [ -n "$pid" ] || continue

    local cwd
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' || true)"

    if [ "$cwd" = "$ROOT_DIR" ]; then
      echo "发现当前项目的 Astro 服务，正在停止：$pid"
      kill "$pid" >/dev/null 2>&1 || true
      sleep 0.3
      if kill -0 "$pid" >/dev/null 2>&1; then
        kill -9 "$pid" >/dev/null 2>&1 || true
      fi
    fi
  done <<< "$pids"
}

# 3. 端口兜底：仍有进程占着端口就强制结束
stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"

  if [ -n "$pids" ]; then
    echo "端口 $port 仍被占用，正在停止相关进程：$pids"
    echo "$pids" | xargs kill >/dev/null 2>&1 || true
    sleep 1
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      echo "$pids" | xargs kill -9 >/dev/null 2>&1 || true
    fi
  fi
}

stop_project_processes
stop_port "$PORT"

echo "已停止。"
