#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

python3 system_bridge.py &
BRIDGE_PID=$!

# Ruhestand verhindern (Display, System, Disk, User-Aktivität)
caffeinate -dimsu &
CAFFEINATE_PID=$!

# Beim Beenden aufräumen
trap 'kill "$CAFFEINATE_PID" "$BRIDGE_PID" 2>/dev/null' EXIT

# Bildschirmauflösung auf dem externen Monitor setzen
echo "MacBook Deckel schliessen..."
sleep 4
displayplacer "id:83105DA9-59B4-20EF-0776-FE37461AF6D4 res:1080x1920 hz:30 color_depth:8 enabled:true scaling:on origin:(1680,0) degree:90"

wait $BRIDGE_PID