#!/usr/bin/env bash
set -euo pipefail
exec node "$(dirname "$0")/verify-cloudflare-preview.mjs"
