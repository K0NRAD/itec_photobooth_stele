import os
import shutil
import subprocess
import sys
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class _QuietHTTPRequestHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler ohne Request-Logging auf der Konsole."""

    def log_message(self, format, *args):
        pass


def start_local_server(directory):
    """
    Startet einen lokalen HTTP-Server, der `directory` ausliefert.

    getUserMedia() benötigt einen Secure Context (http://localhost zählt
    dazu, file:// nicht), daher wird das Vite-Build über http:// statt
    direkt als Datei geladen.

    @param directory: Pfad zum auszuliefernden Verzeichnis (Vite-Build).
    @returns: Port, auf dem der Server lokal erreichbar ist.
    """
    handler = partial(_QuietHTTPRequestHandler, directory=directory)
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

    port = start_local_server(dist_path)
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
        f'--user-data-dir={profile_dir}',
    ])


if __name__ == '__main__':
    main()
