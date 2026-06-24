<script>
  /**
   * QRCode — zeigt den QR-Code zur Ausgabe-URL an.
   * Verschwindet nach `timeout` Sekunden automatisch.
   * @module components/QRCode
   */
  import { onMount, onDestroy, untrack } from 'svelte';
  import { renderQRCode } from '../lib/qrcode.js';

  /** @type {{ url: string, timeout?: number, onClose: () => void }} */
  let { url, timeout = 30, onClose } = $props();

  /** @type {HTMLCanvasElement} */
  let canvas;
  let remaining = $state(untrack(() => timeout));
  let interval = null;

  onMount(async () => {
    await renderQRCode(canvas, url, 420);

    interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 1000);
  });

  onDestroy(() => clearInterval(interval));
</script>

<div class="qr-screen">
  <h2>Deine Fotos sind fertig!</h2>
  <p class="subtitle">Scanne den QR-Code, um dein Bild zu laden</p>

  <div class="qr-container">
    <canvas bind:this={canvas}></canvas>
  </div>

  <div class="url-text">{url}</div>

  <div class="timer-bar">
    <div class="timer-fill" style="width: {(remaining / timeout) * 100}%"></div>
  </div>
  <p class="timer-text">Schließt automatisch in {remaining}s</p>

  <button class="close-btn" onclick={onClose}>✕ Schließen</button>
  <p class="hint">Oder sage <strong>"Abbrechen"</strong></p>
</div>

<style>
  .qr-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 60px 32px;
    width: 100%;
    min-height: 100vh;
    text-align: center;
  }

  h2 {
    font-size: 52px;
    font-weight: 900;
    color: #ffffff;
    margin: 0;
    line-height: 1.1;
  }

  .subtitle {
    font-size: 22px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }

  .qr-container {
    background: #ffffff;
    padding: 20px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  .url-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.35);
    word-break: break-all;
    max-width: 500px;
  }

  .timer-bar {
    width: 400px;
    height: 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    overflow: hidden;
  }

  .timer-fill {
    height: 100%;
    background: #f472b6;
    border-radius: 3px;
    transition: width 1s linear;
  }

  .timer-text {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 16px 40px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .hint {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.5);
  }

  .hint strong {
    color: #f472b6;
  }
</style>
