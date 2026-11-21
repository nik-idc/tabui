#!/usr/bin/env sh
# Runs an npm script inside the CI image, so browsers, fonts, and system
# libraries match CI. Usage: scripts/e2e-docker.sh <npm script> [args...]
#
# The container keeps its own node_modules in ~/.cache/tabui-e2e-docker,
# because packages installed on the host may not work in the Ubuntu image. It
# runs as your user, so test output in the repo stays yours.
#
# Environment:
#   CONTAINER_ENGINE  Command that runs containers. Default: "sudo docker".
#   TABUI_E2E_IMAGE   Image to use. Default: the CI image.
set -eu

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <npm script> [args...]" >&2
  exit 2
fi

engine="${CONTAINER_ENGINE:-sudo docker}"
image="${TABUI_E2E_IMAGE:-ghcr.io/nik-idc/tabui/tabui-cicd:0.1}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
modules="${HOME}/.cache/tabui-e2e-docker/node_modules"
mkdir -p "$modules"

# $engine is split on purpose, so "sudo docker" works.
# shellcheck disable=SC2086
exec $engine run --rm --init --ipc=host \
  --user "$(id -u):$(id -g)" \
  --env HOME=/tmp/home \
  --env HUSKY=0 \
  --volume "$repo:/work" \
  --volume "$modules:/work/node_modules" \
  --workdir /work \
  "$image" \
  sh -c '
    set -e
    mkdir -p "$HOME"
    # Reinstall only when the lock file changed since the last run.
    if ! cmp -s package-lock.json node_modules/.e2e-docker-lock; then
      npm ci --no-audit --no-fund
      cp package-lock.json node_modules/.e2e-docker-lock
    fi
    pulseaudio --start --exit-idle-time=-1
    npm run "$@"
  ' sh "$@"
