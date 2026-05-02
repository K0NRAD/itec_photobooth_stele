/**
 * Globaler App-State für die Photobooth.
 * Svelte 5 Runes — reaktives Objekt, kein Store.
 * @module state/photobooth
 */

/** @typedef {'idle'|'format_select'|'background_select'|'capturing'|'composing'|'result'} AppState */
/** @typedef {'stripe'|'collage'|'polaroid'|'grid'} PhotoFormat */
/** @typedef {{ type: 'color'|'image', value: string }} Background */

/** Anzahl Fotos je Format */
export const PHOTO_COUNT = {
  stripe: 3,
  collage: 4,
  polaroid: 1,
  grid: 4,
};

/**
 * Reaktiver App-State. Alle Mutationen über die Hilfsfunktionen unten.
 * @type {{
 *   currentState: AppState,
 *   selectedFormat: PhotoFormat,
 *   photos: string[],
 *   background: Background,
 *   resultUrl: string|null,
 *   sessionId: string,
 * }}
 */
export const pb = $state({
  currentState: /** @type {AppState} */ ('idle'),
  selectedFormat: /** @type {PhotoFormat} */ ('stripe'),
  photos: /** @type {string[]} */ ([]),
  background: loadBackground(),
  resultUrl: /** @type {string|null} */ (null),
  sessionId: '',
});

/** Abgeleitete Werte als Getter-Objekt (reaktiv durch $state-Zugriff) */
export const derived = {
  get requiredPhotos() { return PHOTO_COUNT[pb.selectedFormat]; },
  get photoIndex() { return pb.photos.length; },
  get allPhotosTaken() { return pb.photos.length >= PHOTO_COUNT[pb.selectedFormat]; },
};

// --- Aktionen ---

/**
 * Wechselt den App-Zustand.
 * @param {AppState} next
 */
export function transition(next) {
  pb.currentState = next;
}

/**
 * Startet eine neue Session.
 * @param {PhotoFormat} format
 */
export function startSession(format) {
  pb.selectedFormat = format;
  pb.photos = [];
  pb.resultUrl = null;
  pb.sessionId = crypto.randomUUID();
}

/**
 * Fügt ein aufgenommenes Foto zur Session hinzu.
 * @param {string} blobUrl
 */
export function addPhoto(blobUrl) {
  pb.photos = [...pb.photos, blobUrl];
}

/**
 * Setzt den Hintergrund und speichert ihn persistent.
 * @param {Background} bg
 */
export function setBackground(bg) {
  pb.background = bg;
  try {
    localStorage.setItem('pb_background', JSON.stringify(bg));
  } catch { /* ignore */ }
}

/**
 * Setzt die fertige Ausgabe-URL und wechselt in den Result-Zustand.
 * @param {string} url
 */
export function setResult(url) {
  pb.resultUrl = url;
  transition('result');
}

/** Setzt alles zurück auf IDLE. */
export function reset() {
  pb.photos = [];
  pb.resultUrl = null;
  pb.sessionId = '';
  transition('idle');
}

/**
 * @returns {Background}
 */
function loadBackground() {
  try {
    const raw = localStorage.getItem('pb_background');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { type: 'color', value: '#1a1a2e' };
}
