#!/bin/sh
# Runs Maestro with the app id and the QA test account password passed to the flows.
# Usage: sh scripts/maestro.sh [maestro test options] <flow or directory>
set -e

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

# Tools that don't load the user's shell profile (MCP servers, CI) may not have Maestro
# and Java on PATH; fall back to their default install locations.
if ! command -v maestro >/dev/null 2>&1; then
  PATH="$HOME/.maestro/bin:$PATH"
fi
if [ -z "$JAVA_HOME" ]; then
  for candidate in /opt/homebrew/opt/openjdk@17 /usr/local/opt/openjdk@17; do
    if [ -d "$candidate/libexec/openjdk.jdk/Contents/Home" ]; then
      JAVA_HOME="$candidate/libexec/openjdk.jdk/Contents/Home"
      PATH="$JAVA_HOME/bin:$PATH"
      export JAVA_HOME
      break
    fi
  done
fi

exec maestro test \
  -e APP_ID="${APP_ID:-com.woapp.mobile}" \
  -e QA_PASSWORD="${QA_PASSWORD:-}" \
  "$@"
