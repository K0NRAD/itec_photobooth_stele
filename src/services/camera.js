/**
 * Kamera-Client — kommuniziert mit dem Deno-Backend via REST und WebSocket.
 * @module services/camera
 */

/** @type {WebSocket|null} */
let ws = null;
/** @type {Set<(event: object) => void>} */
const listeners = new Set();

/**
 * Baut WebSocket-Verbindung zum Backend auf.
 * Reconnectet automatisch bei Verbindungsabbruch.
 */
export function connectCamera() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const url = `ws://${location.hostname}:8000/ws`;
  ws = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach((fn) => fn(data));
    } catch { /* ignore malformed messages */ }
  };

  ws.onclose = () => {
    setTimeout(connectCamera, 2000);
  };

  ws.onerror = (err) => console.error('[camera-ws] error:', err);
}

/**
 * Meldet einen Event-Listener an.
 * @param {(event: object) => void} fn
 * @returns {() => void} Deregister-Funktion
 */
export function onCameraEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Löst ein Foto aus.
 * @param {string} sessionId
 * @param {number} index
 * @returns {Promise<{success: boolean, photoUrl: string|null, error: string|null}>}
 */
export async function triggerCapture(sessionId, index) {
  const res = await fetch('/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, index }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }));
    return { success: false, photoUrl: null, error: err.error };
  }

  const data = await res.json();
  return { success: true, photoUrl: data.photoUrl, error: null };
}

/**
 * Lädt ein Foto vom Backend und gibt eine Blob-URL zurück.
 * @param {string} photoUrl - relativer Pfad, z.B. /api/photos/sessionId/0
 * @returns {Promise<string>} Object-URL
 */
export async function fetchPhotoAsBlob(photoUrl) {
  const res = await fetch(photoUrl);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
