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
  Kiosk-Modus. Reines Python (Standardbibliothek, keine Abhängigkeiten),
  gestartet über `start.sh`/`start.bat`.

## Projektstruktur

```
.
├── .github/workflows/build.yml   # CI: Frontend-Build + Paket-ZIP,
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
│   │   ├── config.js                # Laufzeit-Konfiguration (siehe unten)
│   │   ├── speech.js                # Web Speech API Wrapper
│   │   └── supabase.js              # Upload zu Supabase Storage
│   ├── state/
│   │   └── photobooth.svelte.js     # globaler App-State (Svelte 5 Runes)
│   ├── App.svelte                   # Haupt-Screens & State-Machine
│   ├── app.css
│   └── main.js                      # Einstiegspunkt + JS-Error-Overlay
├── build.sh             # lokales Produktions-Paket (Vite-Build + Kopie)
├── dev.sh               # lokaler Dev-Server (Vite)
├── start.sh             # Start (macOS/Linux): python3 system_bridge.py
├── start.bat            # Start (Windows): python system_bridge.py
├── system_bridge.py     # Desktop-Wrapper: lokaler HTTP-Server + Chrome-Kiosk
└── .env                  # Zugangsdaten für Entwicklung (siehe "Konfiguration")
```

## Voraussetzungen

- [Node.js](https://nodejs.org) 20+ (nur für den Build)
- Für die fertige App auf dem Zielgerät:
  - **Python 3** (Standardbibliothek genügt, keine zusätzlichen Pakete nötig)
  - **Google Chrome** (`system_bridge.py` startet die App darin im
    Kiosk-Modus)

## Konfiguration

Zugangsdaten (Supabase-URL/-Key/-Bucket, Admin-PIN) werden **nicht** in den
Build eingebacken, sondern zur Laufzeit aus einer `.env`-Datei gelesen:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_BUCKET=photos

VITE_ADMIN_PIN=1234
```

- **Entwicklung** (`npm run dev`/`./dev.sh`): `.env` im Projekt-Root, wird
  von Vite automatisch über `import.meta.env` eingelesen.
- **Desktop-App** (Paket aus `release/itec-photobooth/` bzw. Release-ZIP):
  `.env` mit denselben Schlüsseln muss **manuell neben `system_bridge.py`**
  abgelegt werden, z. B. `release/itec-photobooth/.env`. `system_bridge.py`
  liest die Datei beim Start ein und stellt die Werte dem Frontend als
  `window.__RUNTIME_CONFIG__` bereit (`src/services/config.js`). Fehlt die
  Datei, läuft die App weiter, aber Foto-Upload und Admin-PIN-Prüfung
  funktionieren nicht wie konfiguriert (Fallback `VITE_ADMIN_PIN=1234`).

Damit landen die Zugangsdaten nicht im (öffentlich herunterladbaren)
Release-Artefakt, sondern werden separat und pro Gerät bereitgestellt.

## Entwicklung

```bash
./dev.sh
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

Das Script baut das Frontend (`npm run build`) und stellt
`release/itec-photobooth/` zusammen: `dist/` (Vite-Build), `system_bridge.py`,
`start.sh` und `start.bat`.

**Auf dem Zielgerät:**

1. Den Ordner `release/itec-photobooth/` (bzw. das Release-ZIP) auf das
   Zielgerät kopieren.
2. `.env` mit den Zugangsdaten daneben legen (siehe "Konfiguration").
3. `start.sh` (macOS/Linux) bzw. `start.bat` (Windows) ausführen — startet
   `python3 system_bridge.py`.

`system_bridge.py` öffnet einen lokalen Webserver für den Vite-Build und
startet Google Chrome im Kiosk-Modus (`--kiosk
--use-fake-ui-for-media-stream`) mit einem eigenen, isolierten
Chrome-Profil — Kamera-/Mikrofon-Berechtigungen werden darin dauerhaft
gespeichert.

Vorausgesetzt sind **Python 3** (Standardbibliothek genügt, kein `pip
install` nötig) und **Google Chrome** auf dem Zielgerät.

## CI/CD

`.github/workflows/build.yml` baut bei jedem Push auf `main` und bei
`v*`-Tags das Frontend und packt `dist/` zusammen mit `system_bridge.py`,
`start.sh` und `start.bat` zu `itec-photobooth.zip`. Da `system_bridge.py`
nur die Python-Standardbibliothek nutzt, ist das Paket plattformunabhängig.
Bei Tags wird zusätzlich ein GitHub Release mit dem ZIP erstellt.

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
