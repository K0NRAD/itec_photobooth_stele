<script>
  /**
   * AdminPanel — Betreiber-Einstellungen (PIN-geschützt).
   * Zugang: 5s auf untere linke Ecke drücken oder Sprachbefehl "admin".
   * @module components/AdminPanel
   */
  import BackgroundPicker from './BackgroundPicker.svelte';
  import CameraPicker from './CameraPicker.svelte';
  import { pb } from '../state/photobooth.svelte.js';
  import { config } from '../services/config.js';

  /** @type {{ onClose: () => void }} */
  let { onClose } = $props();

  const ADMIN_PIN = config.ADMIN_PIN;

  /** @type {'pin'|'menu'|'background'|'camera'} */
  let view = $state('pin');
  let pinInput = $state('');
  let pinError = $state(false);

  function checkPin() {
    if (pinInput === ADMIN_PIN) {
      view = 'menu';
      pinError = false;
    } else {
      pinError = true;
      pinInput = '';
    }
  }
</script>

<div class="admin-overlay">
  <div class="admin-panel">
    {#if view === 'pin'}
      <h3>Admin-Zugang</h3>
      <p>PIN eingeben</p>
      <input
        type="password"
        inputmode="numeric"
        maxlength="6"
        bind:value={pinInput}
        placeholder="••••"
        class:error={pinError}
        onkeydown={(e) => e.key === 'Enter' && checkPin()}
      />
      {#if pinError}
        <p class="error-msg">Falscher PIN</p>
      {/if}
      <div class="btn-row">
        <button onclick={onClose}>Abbrechen</button>
        <button class="primary" onclick={checkPin}>OK</button>
      </div>

    {:else if view === 'menu'}
      <h3>Einstellungen</h3>
      <div class="menu-items">
        <button onclick={() => (view = 'background')}>
          🎨 Hintergrund anpassen
        </button>
        <button onclick={() => (view = 'camera')}>
          📷 Kamera auswählen
        </button>
      </div>
      <button class="close-btn" onclick={onClose}>Schließen</button>

    {:else if view === 'background'}
      <BackgroundPicker background={pb.background} onDone={() => (view = 'menu')} />

    {:else if view === 'camera'}
      <CameraPicker selectedId={pb.selectedCameraId} onDone={() => (view = 'menu')} />
    {/if}
  </div>
</div>

<style>
  .admin-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .admin-panel {
    background: #1a1a2e;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    padding: 48px;
    width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    color: white;
    text-align: center;
  }

  h3 {
    font-size: 36px;
    font-weight: 800;
    margin: 0;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
  }

  input {
    font-size: 32px;
    text-align: center;
    letter-spacing: 0.4em;
    padding: 16px 24px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    width: 240px;
  }

  input.error {
    border-color: #ef4444;
  }

  .error-msg {
    color: #ef4444;
    font-size: 16px;
  }

  .btn-row {
    display: flex;
    gap: 16px;
  }

  button {
    padding: 14px 32px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
    color: white;
    transition: all 0.2s;
    width: 100%;
  }

  button.primary {
    background: #f472b6;
    border-color: #f472b6;
  }

  button:hover {
    opacity: 0.85;
  }

  .menu-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .close-btn {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.2);
    margin-top: 8px;
  }
</style>
