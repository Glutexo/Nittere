#!/bin/zsh
set -euo pipefail
SCRIPT_DIR=${0:A:h}
osascript "$SCRIPT_DIR/ntv-live-pip-fix.scpt"
