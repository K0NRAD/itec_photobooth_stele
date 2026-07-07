/**
 * Web Speech API Wrapper — robuste kontinuierliche Spracherkennung.
 * Erstellt bei jedem Neustart eine neue Instanz (verhindert stille Abstürze).
 * @module services/speech
 */

/** @typedef {(command: string, raw: string) => void} CommandHandler */

const COMMANDS = {
  start:   ['start', 'los', 'starten', 'beginnen', 'hallo'],
  stripe:  ['streifen', 'stripe', 'fotostreifen'],
  collage: ['collage', 'fotocollage', 'zusammenstellung'],
  polaroid:['polaroid'],
  grid:    ['grid', 'grit', 'raster', 'fotoraster', 'gitter'],
  capture: ['foto', 'cheese', 'aufnehmen', 'jetzt', 'schießen', 'klick'],
  next:    ['weiter', 'fertig', 'nächste', 'done', 'ok', 'okay'],
  save:    ['speichern', 'hochladen', 'ja', 'okay', 'weiter', 'done'],
  restart: ['nochmal', 'wiederholen', 'neustart', 'zurück', 'neu', 'abbrechen'],
  admin:   ['admin', 'einstellungen'],
};

/**
 * Startet kontinuierliche Spracherkennung mit automatischem Neustart.
 * @param {CommandHandler} onCommand
 * @param {string} [lang='de-DE']
 * @returns {() => void} Stop-Funktion
 */
export function startSpeechRecognition(onCommand, lang = 'de-DE') {
  const SR = window.SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition;
  if (!SR) {
    console.warn('[speech] Web Speech API nicht verfügbar');
    return () => {};
  }

  let active = true;
  let cooldown = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let restartTimer = null;
  /** @type {SpeechRecognition | null} */
  let recognition = null;

  function start() {
    if (!active) return;

    recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 6;

    recognition.onresult = (/** @type {SpeechRecognitionEvent} */ event) => {
      if (cooldown) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          const raw = event.results[i][j].transcript.trim().toLowerCase();
          console.log(raw);
          const command = matchCommand(raw);
          if (command) {
            cooldown = true;
            setTimeout(() => { cooldown = false; }, 1500);
            console.log(`[speech] "${command}" ← "${raw}"`);
            onCommand(command, raw);
            return;
          }
        }
      }
    };

    recognition.onerror = (/** @type {SpeechRecognitionErrorEvent} */ event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.error('[speech] Mikrofon-Zugriff verweigert — Sprachsteuerung deaktiviert');
        active = false;
      }
    };

    // onend feuert bei jedem Abbruch — neue Instanz erstellen statt .start() erneut aufrufen
    recognition.onend = () => {
      if (!active) return;
      restartTimer = setTimeout(start, 300);
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('[speech] Start fehlgeschlagen, erneuter Versuch:', err instanceof Error ? err.message : err);
      restartTimer = setTimeout(start, 500);
    }
  }

  start();

  return () => {
    active = false;
    if (restartTimer !== null) clearTimeout(restartTimer);
    try { recognition?.stop(); } catch { /* ignore */ }
    recognition = null;
  };
}

/**
 * @param {string} text
 * @returns {string|null}
 */
function matchCommand(text) {
  for (const [command, variants] of Object.entries(COMMANDS)) {
    if (variants.some((v) => text.includes(v))) return command;
  }
  return null;
}
