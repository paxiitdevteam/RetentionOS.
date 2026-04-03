#!/bin/bash
# Unified local dev launcher for RetentionOS.
#
# Usage:
#   ./start.sh            -> start root + backend + dashboard
#   ./start.sh root      -> root server (marketing + /project-status) on :8000
#   ./start.sh backend   -> backend API on :3000
#   ./start.sh dashboard -> dashboard on :3001
#
# Run from repo root using Git Bash.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="${1:-all}" # all|root|backend|dashboard

ensure_root_deps() {
  if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
  fi
}

ensure_dashboard_deps() {
  if [ ! -d "dashboard/node_modules" ]; then
    echo "📦 Installing dashboard dependencies..."
    cd dashboard
    npm install
    cd "$SCRIPT_DIR"
  fi
}

PIDS=()

start_bg() {
  # Starts a command in background and tracks its PID.
  # shellcheck disable=SC2068
  "$@" &
  PIDS+=($!)
  echo "Started PID $! => $*"
}

cleanup() {
  echo ""
  echo "Stopping servers..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}

trap cleanup INT TERM

ensure_root_deps
ensure_dashboard_deps

echo "RetentionOS local launcher"
echo "  Root:      http://localhost:8000/"
echo "              http://localhost:8000/project-status"
echo "  Backend:   http://localhost:3000/health"
echo "  Dashboard: http://localhost:3001/login"
echo ""

case "$MODE" in
  all)
    start_bg npm start
    start_bg npm run backend:dev
    start_bg npm run dashboard:dev
    ;;
  root)
    start_bg npm start
    ;;
  backend)
    start_bg npm run backend:dev
    ;;
  dashboard)
    start_bg npm run dashboard:dev
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Use: ./start.sh [all|root|backend|dashboard]"
    exit 1
    ;;
esac

echo ""
echo "Press Ctrl+C to stop."
wait

