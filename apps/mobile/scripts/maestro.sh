#!/bin/sh
# Runs Maestro with the app id and the QA test account password passed to the flows.
# Usage: sh scripts/maestro.sh [maestro test options] <flow or directory>
set -e

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

exec maestro test \
  -e APP_ID="${APP_ID:-com.woapp.mobile}" \
  -e QA_PASSWORD="${QA_PASSWORD:-}" \
  "$@"
