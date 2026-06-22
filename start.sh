#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

panic() { echo "Fehler: $1" >&2; exit 1; }

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Ruhestand verhindern (Display, System, Disk, User-Aktivität)
caffeinate -dimsu &
CAFFEINATE_PID=$!

# Beim Beenden aufräumen
trap "kill $CAFFEINATE_PID 2>/dev/null" EXIT

echo "Starte Frontend Dev Server auf http://localhost:5173..."
npm run dev &
DEV_PID=$!

# Warten bis der Dev-Server bereit ist
attempts=0
max_attempts=15
until curl -s http://localhost:5173 >/dev/null 2>&1; do
  (( attempts++ ))
  (( attempts >= max_attempts )) && panic "Dev-Server nicht erreichbar nach $max_attempts Versuchen."
  echo "Warte auf Dev-Server... Versuch $attempts/$max_attempts"
  sleep 2
done

echo "Dev-Server aktiv – starte Chrome im Kiosk-Modus..."
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --no-first-run \
  --no-default-browser-check \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --disable-background-networking \
  --disable-features=Translate,TranslateUI \
  --disable-sync \
  --use-fake-ui-for-media-stream \
  --lang=de \
  --kiosk \
  --window-position=1440,0 \
  --user-data-dir="$HOME/.itec-photobooth-stele-profile" \
  --app=http://localhost:5173 2>/dev/null &

# Bildschirmauflösung auf dem externen Monitor setzen
echo "MacBook Deckel schliessen..."
sleep 4
displayplacer "id:F8EDD3F5-AC68-87A6-CF27-815DCBEABE12 res:1080x1920 hz:30 color_depth:8 enabled:true scaling:on origin:(1680,0) degree:90"

# Dev-Server im Vordergrund halten
wait $DEV_PID