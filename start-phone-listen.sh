#!/bin/bash
cd "$(dirname "$0")"
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Add your key on the same line, like this:"
  echo "OPENAI_API_KEY='your-key' ./start-phone-listen.sh"
  exit 1
fi
if command -v lsof >/dev/null; then
  pids="$(lsof -tiTCP:8765 -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    sleep 0.4
  fi
fi
exec python3 preview/serve-dev.py
