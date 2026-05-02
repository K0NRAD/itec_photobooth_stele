/**
 * Web Speech API Wrapper für Chrome.
 * Erkennt Sprachbefehle und ruft den jeweiligen Handler auf.
 * @module services/speech
 */

/** @typedef {(command: string, raw: string) => void} CommandHandler */

/** Bekannte Befehle und ihre normalisierten Namen */
const COMMANDS = {
  start: ['start', 'los', 'starten', 'beginnen'],
  stripe: ['streifen', 'stripe', 'fotostreifen'],
  collage: ['collage', 'fotocollage', 'zusammenstellung'],
  polaroid: ['polaroid'],
  grid: ['grid', 'raster', 'fotoraster'],
  capture: ['foto', 'cheese', 'aufnehmen', 'jetzt'],
  next: ['weiter', 'fertig', 'nächste', 'done'],
  restart: ['nochmal', 'wiederholen', 'neustart', 'zurück'],
  admin: ['admin', 'einstellungen'],
};

/** @type {SpeechRecognition|null} */
let recognition = null;
/** @type {boolean} */
let running = false;

/**
 * Startet die kontinuierliche Spracherkennung.
 * @param {CommandHandler} onCommand - Callback bei erkanntem Befehl
 * @param {string} [lang='de-DE']
 * @returns {() => void} Stop-Funktion
 */
export function startSpeechRecognition(onCommand, lang = 'de-DE') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[speech] Web Speech API nicht verfügbar');
    return () => {};
  }

  recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (!event.results[i].isFinal) continue;
      for (let j = 0; j < event.results[i].length; j++) {
        const raw = event.results[i][j].transcript.trim().toLowerCase();
        const command = matchCommand(raw);
        if (command) {
          console.log(`[speech] Befehl erkannt: "${command}" (original: "${raw}")`);
          onCommand(command, raw);
          break;
        }
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error !== 'no-speech') {
      console.error('[speech] Fehler:', event.error);
    }
  };

  recognition.onend = () => {
    if (running) recognition.start();
  };

  running = true;
  recognition.start();

  return () => {
    running = false;
    recognition?.stop();
    recognition = null;
  };
}

/**
 * Matched rohen Transkript-Text gegen bekannte Befehle.
 * @param {string} text
 * @returns {string|null} Befehlsname oder null
 */
function matchCommand(text) {
  for (const [command, variants] of Object.entries(COMMANDS)) {
    if (variants.some((v) => text.includes(v))) {
      return command;
    }
  }
  return null;
}
