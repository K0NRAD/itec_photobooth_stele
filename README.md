# Photobooth Stele

Touch- und sprachgesteuerte Photobooth-Anwendung für eine Stele im Portrait-Format
(1080×1920). Aufnahmen werden über die Webcam erstellt, lokal zu einem Ausgabebild
zusammengesetzt und in Supabase Storage hochgeladen — Gäste laden ihr Foto per
QR-Code herunter.

## Features

- **Vier Ausgabeformate**: Fotostreifen (3 Fotos), Collage (4 Fotos), Polaroid
  (1 Foto), Photo Grid (4 Fotos, 2×2)
- **Sprachsteuerung** (Web Speech API, `de-DE`) für den kompletten Ablauf:
  Start, Formatwahl, Auslösen, Speichern, Wiederholen, Admin-Zugang
- **Touch-Bedienung** als Alternative/Ergänzung zur Sprachsteuerung
- **Admin-Panel** (PIN-geschützt, Zugang über 5s Druck auf untere linke Ecke
  oder Sprachbefehl „admin“):
  - Hintergrund anpassen (Farbe oder Bild)
  - Kamera auswählen (bei mehreren Video-Eingabegeräten)
- **QR-Code** zur Ausgabe-URL nach dem Upload

## Tech-Stack

- **Frontend**: [Svelte 5](https://svelte.dev) (Runes, kein SvelteKit), [Vite](https://vitejs.dev), JavaScript + JSDoc (kein TypeScript)
- **Kamera**: `navigator.mediaDevices.getUserMedia` (UVC-Webcam, z. B. eine
  Sony Alpha 7 im Webcam-Modus)
- **Bildkomposition**: Canvas API (`src/services/composer.js`)
- **Storage**: [Supabase](https://supabase.com) Storage (`@supabase/supabase-js`)
- **QR-Code**: [`qrcode`](https://www.npmjs.com/package/qrcode)
- **Desktop-Wrapper**: `system_bridge.py` — startet einen lokalen
  `http.server`-Server für den Vite-Build und öffnet ihn in Google Chrome im
  Kiosk-Modus. Gepackt per [PyInstaller](https://pyinstaller.org) zu einer
  eigenständigen Executable.

## Projektstruktur

```
.
├── .github/workflows/build.yml   # CI: Frontend-Build + PyInstaller-Pakete
│                                    für Windows/macOS (Intel+Silicon)/Linux,
│                                    GitHub Release bei v*-Tags
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AdminPanel.svelte       # PIN-geschützte Einstellungen
│   │   ├── BackgroundPicker.svelte # Hintergrundauswahl (Farbe/Bild)
│   │   ├── CameraPicker.svelte     # Kameraauswahl mit Live-Vorschau
│   │   ├── Countdown.svelte        # Countdown vor der Auslösung
│   │   ├── FormatSelector.svelte   # Auswahl des Ausgabeformats
│   │   ├── QRCode.svelte           # QR-Code zur Ausgabe-URL
│   │   └── VoiceControl.svelte     # Mikrofon-Status & Sprachsteuerung
│   ├── lib/
│   │   └── qrcode.js                # QR-Code-Rendering (Canvas)
│   ├── services/
│   │   ├── camera.js                # getUserMedia, Kamera-Auflistung
│   │   ├── composer.js              # Canvas-Bildkomposition (alle Formate)
│   │   ├── speech.js                # Web Speech API Wrapper
│   │   └── supabase.js              # Upload zu Supabase Storage
│   ├── state/
│   │   └── photobooth.svelte.js     # globaler App-State (Svelte 5 Runes)
│   ├── App.svelte                   # Haupt-Screens & State-Machine
│   ├── app.css
│   └── main.js                      # Einstiegspunkt + JS-Error-Overlay
├── build.sh             # lokaler Produktions-Build (Vite + PyInstaller)
├── start.sh             # lokaler Dev-Server (Vite)
├── system_bridge.py     # Desktop-Wrapper: lokaler HTTP-Server + Chrome-Kiosk
├── system_bridge.spec   # PyInstaller-Spec
├── requirements.txt     # Python-Abhängigkeiten für den Build
└── .env                  # Supabase-Konfiguration & Admin-PIN (siehe unten)
```

## Voraussetzungen

- [Node.js](https://nodejs.org) 20+
- Für den Desktop-Build zusätzlich: Python 3.10+
- Für die fertige Desktop-App: **Google Chrome** muss auf dem Zielgerät
  installiert sein (`system_bridge.py` startet die App darin im Kiosk-Modus)

## Umgebungsvariablen

In `.env` im Projekt-Root:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_BUCKET=photos

VITE_ADMIN_PIN=1234
```

## Entwicklung

```bash
./start.sh
# oder
npm install
npm run dev
```

Die App läuft dann unter `http://localhost:5173`. Da `getUserMedia` einen
Secure Context benötigt, funktioniert `localhost` ohne weitere Konfiguration.

## Produktions-Build (Desktop-App)

```bash
./build.sh
```

Das Script baut das Frontend (`npm run build`), legt ein Python-`.venv` an,
installiert `requirements.txt` und paketiert `system_bridge.py` per
PyInstaller zu einer Executable. Ergebnis: `release/itec-photobooth/`.

Beim Start öffnet `system_bridge.py` einen lokalen Webserver für den
Vite-Build und startet Google Chrome im Kiosk-Modus (`--kiosk
--use-fake-ui-for-media-stream`) mit einem eigenen, isolierten
Chrome-Profil — Kamera-/Mikrofon-Berechtigungen werden darin dauerhaft
gespeichert.

### macOS: "kann nicht ausgeführt werden" / Gatekeeper

Die heruntergeladenen macOS-Builds sind nur ad-hoc signiert (kein
Apple-Developer-Account). Beim Entpacken markiert macOS jede Datei im Bundle
mit einem Quarantäne-Flag, wodurch Gatekeeper für die Executable und alle
mitgelieferten `.so`/`.dylib`-Dateien einzeln nacheinander Warnungen anzeigt.
Abhilfe: im Terminal die Quarantäne-Markierung rekursiv entfernen, bevor die
App gestartet wird:

```bash
xattr -cr /pfad/zu/itec-photobooth
```

(`/pfad/zu/itec-photobooth` ist der entpackte Ordner mit der Executable und
dem `_internal`-Verzeichnis.)

## CI/CD

`.github/workflows/build.yml` baut bei jedem Push auf `main` und bei
`v*`-Tags das Frontend und paketiert es für **Windows**, **macOS (Intel +
Apple Silicon)** und **Linux**. Bei Tags wird zusätzlich ein GitHub Release
mit allen vier ZIP-Artefakten (`itec-photobooth-<Plattform>.zip`) erstellt.

## Sprachbefehle (Auswahl)

| Befehl | Beispiele |
| --- | --- |
| Start | „Start“, „los“, „beginnen“ |
| Format wählen | „Streifen“, „Collage“, „Polaroid“, „Grid“ |
| Auslösen | „Foto“, „Cheese“, „jetzt“ |
| Bestätigen/Weiter | „weiter“, „fertig“, „ok“ |
| Speichern | „speichern“, „hochladen“ |
| Wiederholen | „nochmal“, „neu“ |
| Admin-Zugang | „admin“, „einstellungen“ |

Die vollständige Liste der erkannten Begriffe steht in
`src/services/speech.js`.
