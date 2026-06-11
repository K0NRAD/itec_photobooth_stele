/**
 * Laufzeit-Konfiguration.
 *
 * Im gepackten Kiosk-Build liest `system_bridge.py` eine `.env`-Datei neben
 * der Executable und injiziert die Werte als `window.__RUNTIME_CONFIG__` in
 * `index.html` (siehe README, Abschnitt "Konfiguration"). Im Dev-Modus
 * (`npm run dev`) existiert `window.__RUNTIME_CONFIG__` nicht — dann greift
 * Vites `import.meta.env` (`.env` im Projekt-Root).
 * @module services/config
 */

const runtime = /** @type {Record<string, string>} */ (
  /** @type {any} */ (window).__RUNTIME_CONFIG__ ?? {}
);

/**
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string|undefined}
 */
function get(key, fallback) {
  return runtime[key] ?? import.meta.env[key] ?? fallback;
}

export const config = {
  SUPABASE_URL: get('VITE_SUPABASE_URL', 'https://localhost'),
  SUPABASE_ANON_KEY: get('VITE_SUPABASE_ANON_KEY', ''),
  SUPABASE_BUCKET: get('VITE_SUPABASE_BUCKET', 'photos'),
  ADMIN_PIN: get('VITE_ADMIN_PIN', '1234'),
};
