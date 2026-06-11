#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "Building frontend (Vite)..."
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run build

echo "Setting up Python venv (.venv)..."
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "Building executable (PyInstaller)..."
pyinstaller --noconfirm --distpath release system_bridge.spec

echo "Done: release/itec-photobooth/"
