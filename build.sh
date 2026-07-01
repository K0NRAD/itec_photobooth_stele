#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Building frontend (Vite)..."
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run build

echo "Assembling package..."
rm -rf release/itec-photobooth
mkdir -p release/itec-photobooth
cp -r dist release/itec-photobooth/
cp system_bridge.py start.sh release/itec-photobooth/
chmod +x release/itec-photobooth/start.sh

echo "Done: release/itec-photobooth/"
echo "Auf dem Zielsystem: .env neben system_bridge.py legen, dann start.sh ausführen."
