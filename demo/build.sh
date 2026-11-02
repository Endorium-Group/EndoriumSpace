#!/usr/bin/env bash
# Builds the interactive demo from the EndoriumFort Enterprise frontend sources
# (private repository; only frontend/ is needed).
#
#   demo/build.sh <EndoriumFort checkout> <output dir> [base path]
#
# Example (local):
#   git clone --depth 1 --branch v1.0.56 https://github.com/NergYR/EndoriumFort /tmp/ee
#   demo/build.sh /tmp/ee ./_site/demo /demo/
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$1" && pwd)"
OUT="$(mkdir -p "$2" && cd "$2" && pwd)"
BASE="${3:-/demo/}"

cp "$HERE/vite.config.demo.mjs" "$SRC/frontend/vite.config.demo.mjs"
cd "$SRC/frontend"
[ -d src/pro ] || echo "warning: no src/pro in $SRC — building the Community UI" >&2
[ -d node_modules ] || npm ci --no-audit --no-fund
DEMO_BASE="$BASE" DEMO_SHIM="$HERE/src/shim.js" DEMO_OUT="$OUT" \
  npx vite build --config vite.config.demo.mjs
echo "Demo built in $OUT (base $BASE)"
