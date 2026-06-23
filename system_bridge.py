import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class _ConfigInjectingHTTPRequestHandler(SimpleHTTPRequestHandler):
    """
    SimpleHTTPRequestHandler ohne Request-Logging, der `index.html` um ein
    `window.__RUNTIME_CONFIG__`-Skript mit den Werten aus `runtime_config`
    ergänzt (siehe `find_env_file`/`load_env`).
    """

    runtime_config = {}

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path in ('/', '/index.html'):
            self._serve_index()
        else:
            super().do_GET()

    def _serve_index(self):
        index_path = os.path.join(self.directory, 'index.html')
        with open(index_path, 'rb') as f:
            html = f.read()

        injection = (
            '<script>window.__RUNTIME_CONFIG__ = '
            + json.dumps(self.runtime_config)
            + ';</script>'
        ).encode('utf-8')
        html = html.replace(b'</head>', injection + b'</head>')

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(html)))
        self.end_headers()
        self.wfile.write(html)


def find_env_file():
    """
    Ermittelt den Pfad zur `.env`-Datei, die Zugangsdaten zur Laufzeit liefert.

    Liegt neben der Executable (PyInstaller) bzw. neben `system_bridge.py`
    (Entwicklung) und wird manuell auf dem Zielsystem bereitgestellt.

    @returns: Pfad zur `.env`-Datei (existiert ggf. nicht).
    """
    if getattr(sys, 'frozen', False):
        base_dir = os.path.dirname(sys.executable)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, '.env')


def load_env(path):
    """
    Liest eine einfache `.env`-Datei (KEY=VALUE pro Zeile) ein.

    Kommentare (`#`) und leere Zeilen werden ignoriert, umschließende
    Anführungszeichen am Wert entfernt.

    @param path: Pfad zur `.env`-Datei.
    @returns: dict mit den gefundenen Schlüssel/Wert-Paaren.
    """
    env = {}
    if not os.path.isfile(path):
        return env

    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def start_local_server(directory, runtime_config):
    """
    Startet einen lokalen HTTP-Server, der `directory` ausliefert.

    getUserMedia() benötigt einen Secure Context (http://localhost zählt
    dazu, file:// nicht), daher wird das Vite-Build über http:// statt
    direkt als Datei geladen.

    @param directory: Pfad zum auszuliefernden Verzeichnis (Vite-Build).
    @param runtime_config: dict, das als `window.__RUNTIME_CONFIG__` in
        `index.html` injiziert wird (siehe `load_env`).
    @returns: Port, auf dem der Server lokal erreichbar ist.
    """
    handler_class = type(
        '_RuntimeConfigHTTPRequestHandler',
        (_ConfigInjectingHTTPRequestHandler,),
        {'runtime_config': runtime_config},
    )
    handler = partial(handler_class, directory=directory)
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server.server_address[1]


def find_chrome():
    """
    Sucht die Google-Chrome-Executable für das aktuelle Betriebssystem.

    @returns: Pfad zur Chrome-Executable.
    @raises FileNotFoundError: wenn Chrome nicht installiert ist.
    """
    if sys.platform == 'darwin':
        candidates = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
    elif sys.platform == 'win32':
        candidates = [
            os.path.expandvars(r'%ProgramFiles%\Google\Chrome\Application\chrome.exe'),
            os.path.expandvars(r'%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe'),
            os.path.expandvars(r'%LocalAppData%\Google\Chrome\Application\chrome.exe'),
        ]
    else:
        candidates = []
        for name in ('google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'):
            path = shutil.which(name)
            if path:
                return path

    for path in candidates:
        if os.path.isfile(path):
            return path

    raise FileNotFoundError('Google Chrome wurde nicht gefunden.')


def main():
    # Vite-Build-Ausgabe (npm run build) — per PyInstaller --add-data "dist:dist" gebündelt
    base_path = getattr(sys, '_MEIPASS', os.path.abspath('.'))
    dist_path = os.path.join(base_path, 'dist')

    # Zugangsdaten (Supabase, Admin-PIN) kommen zur Laufzeit aus einer .env
    # neben der Executable, nicht aus dem Build (siehe README "Konfiguration").
    runtime_config = {
        k: v for k, v in load_env(find_env_file()).items() if k.startswith('VITE_')
    }

    port = start_local_server(dist_path, runtime_config)
    url = f'http://127.0.0.1:{port}/'

    try:
        chrome_path = find_chrome()
    except FileNotFoundError as e:
        print(f"\n[FEHLER] {e}")
        print("Bitte Google Chrome installieren: https://www.google.com/chrome/")
        sys.exit(1)

    # Eigenes Profil, damit die Kiosk-Instanz unabhängig von einem evtl.
    # bereits laufenden Chrome des Benutzers startet und Berechtigungen
    # (Kamera/Mikrofon) dauerhaft für diese App gespeichert werden.
    profile_dir = os.path.join(tempfile.gettempdir(), 'itec-photobooth-chrome-profile')

    subprocess.run([
        chrome_path,
        f'--app={url}',
        '--kiosk',
        '--no-first-run',
        '--noerrdialogs',
        '--disable-infobars',
        '--disable-session-crashed-bubble',
        '--use-fake-ui-for-media-stream',
        '--disable-save-password-bubble',
        '--password-store=basic',
        '--disable-features=Translate,TranslateUI',
        f'--user-data-dir={profile_dir}',
    ])


if __name__ == '__main__':
    main()
