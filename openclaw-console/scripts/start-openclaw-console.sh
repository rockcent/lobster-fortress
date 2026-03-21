#!/bin/zsh

set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cd /Volumes/rock2/codex/openclaw-console

if [ ! -d node_modules ]; then
  /opt/homebrew/bin/npm install
fi

needs_build=0
if [ ! -f dist/index.html ]; then
  needs_build=1
else
  watch_items=(
    src
    server
    api
    public
    package.json
    package-lock.json
    tsconfig.json
    vite.config.ts
  )
  for item in "${watch_items[@]}"; do
    if [ -d "$item" ]; then
      if [ -n "$(find "$item" -type f -newer dist/index.html -print -quit 2>/dev/null)" ]; then
        needs_build=1
        break
      fi
    elif [ -f "$item" ] && [ "$item" -nt dist/index.html ]; then
      needs_build=1
      break
    fi
  done
fi

if [ "$needs_build" -eq 1 ]; then
  /opt/homebrew/bin/npm run build
fi

exec /opt/homebrew/bin/node ./node_modules/tsx/dist/cli.mjs server/server.ts
