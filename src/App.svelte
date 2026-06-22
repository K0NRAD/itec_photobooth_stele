<script>
  import VoiceControl from './components/VoiceControl.svelte';
  import Countdown from './components/Countdown.svelte';
  import FormatSelector from './components/FormatSelector.svelte';
  import QRCode from './components/QRCode.svelte';
  import AdminPanel from './components/AdminPanel.svelte';

  import {
    pb, derived,
    transition, startSession, addPhoto, setResult, reset,
  } from './state/photobooth.svelte.js';

  import { initCamera, captureFrame, stopCamera } from './services/camera.js';
  import { uploadPhoto } from './services/supabase.js';
  import { composeImage } from './services/composer.js';

  let showAdmin = $state(false);
  let capturing = $state(false);
  let showCountdown = $state(false);
  let statusMessage = $state('');
  /** @type {string|null} */
  let previewUrl = $state(null);
  /** @type {Blob|null} */
  let pendingBlob = $state(null);

  /** @type {HTMLVideoElement} */
  let videoEl = $state(null);

  let adminPressTimer = null;

  $effect(() => {
    if (pb.currentState !== 'capturing' || !videoEl) return;
    initCamera(videoEl, pb.selectedCameraId).catch((err) => {
      statusMessage = `Kamera-Fehler: ${err.message}`;
    });
    return () => stopCamera();
  });

  /**
   * @param {string} command
   */
  function handleVoiceCommand(command) {
    if (command === 'admin') { showAdmin = true; return; }

    if (pb.currentState === 'idle') {
      if (command === 'start') transition('format_select');
    } else if (pb.currentState === 'format_select') {
      if (['stripe', 'collage', 'polaroid', 'grid'].includes(command)) {
        handleFormatSelect(command);
      } else if (command === 'next') {
        handleFormatSelect(pb.selectedFormat);
      } else if (command === 'restart') reset();
    } else if (pb.currentState === 'capturing') {
      if (command === 'capture' && !capturing) triggerNextPhoto();
      else if (command === 'restart') reset();
    } else if (pb.currentState === 'preview') {
      if (command === 'save') doUpload();
      if (command === 'restart') resetPreview();
    } else if (pb.currentState === 'result') {
      if (command === 'restart') reset();
    }
  }

  /** @param {string} format */
  function handleFormatSelect(format) {
    startSession(format);
    transition('capturing');
  }

  async function triggerNextPhoto() {
    if (capturing || derived.allPhotosTaken) return;
    capturing = true;
    showCountdown = true;
  }

  async function onCountdownComplete() {
    showCountdown = false;
    statusMessage = 'Aufnahme...';

    try {
      const blobUrl = await captureFrame(videoEl);
      addPhoto(blobUrl);
      statusMessage = `Foto ${pb.photos.length} / ${derived.requiredPhotos}`;
      capturing = false;
      if (derived.allPhotosTaken) await composeAndUpload();
    } catch (err) {
      statusMessage = `Aufnahme fehlgeschlagen: ${err.message}`;
      capturing = false;
    }
  }

  async function composeAndUpload() {
    transition('composing');
    statusMessage = 'Bild wird erstellt...';
    const blob = await composeImage(pb.photos, pb.selectedFormat, pb.background);
    pendingBlob = blob;
    previewUrl = URL.createObjectURL(blob);
    transition('preview');
  }

  async function doUpload() {
    if (!pendingBlob) return;
    transition('composing');
    statusMessage = 'Hochladen...';
    const { publicUrl, error } = await uploadPhoto(pendingBlob, pb.sessionId, pb.selectedFormat);
    pendingBlob = null;
    if (error || !publicUrl) {
      statusMessage = `Upload fehlgeschlagen: ${error}`;
      transition('preview');
      return;
    }
    setResult(publicUrl);
  }

  function resetPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    pendingBlob = null;
    reset();
  }

  function startAdminPress() {
    adminPressTimer = setTimeout(() => { showAdmin = true; }, 5000);
  }

  function stopAdminPress() {
    clearTimeout(adminPressTimer);
  }
</script>

<main
  class="app"
  style="--bg-color: {pb.background.type === 'color' ? pb.background.value : '#1a1a2e'}"
>
  {#if pb.background.type === 'image'}
    <div
      class="bg-image"
      style="background-image: url('{pb.background.value}')"
    ></div>
  {/if}

  <div
    class="admin-trigger"
    onpointerdown={startAdminPress}
    onpointerup={stopAdminPress}
    onpointerleave={stopAdminPress}
    role="button"
    tabindex="-1"
    aria-label="Admin"
  ></div>

  {#if pb.currentState === 'idle'}
    <div class="screen center">
      <div class="logo">📸</div>
      <h1>Photobooth</h1>
      <p class="instruction">Sage <strong>"Start"</strong>, <strong>"Starten"</strong> oder tippe zum Beginnen</p>
      <button class="start-btn" onclick={() => transition('format_select')}>
        Start
      </button>
    </div>

  {:else if pb.currentState === 'format_select'}
    <div class="screen">
      <FormatSelector
        selected={pb.selectedFormat}
        onSelect={handleFormatSelect}
        onClose={reset}
      />
    </div>

  {:else if pb.currentState === 'capturing'}
    <div class="screen capturing-screen">
      <video bind:this={videoEl} class="camera-fullscreen" autoplay playsinline muted></video>

      <div class="capturing-overlay">
        <div class="capturing-top">
          <span class="photo-counter">Foto {pb.photos.length + 1} / {derived.requiredPhotos}</span>
        </div>

        {#if showCountdown}
          <div class="countdown-center">
            <Countdown seconds={3} onComplete={onCountdownComplete} />
          </div>
        {/if}

        <div class="capturing-bottom">
          {#if statusMessage}
            <p class="status">{statusMessage}</p>
          {/if}
          {#if !showCountdown && !capturing}
            <button class="shutter-btn" onclick={triggerNextPhoto} aria-label="Foto aufnehmen">
              <span class="shutter-inner"></span>
            </button>
            <p class="hint">Oder sage <strong>"Foto"</strong>, <strong>"Aufnehmen"</strong></p>
          {/if}
        </div>
      </div>
    </div>

  {:else if pb.currentState === 'composing'}
    <div class="screen center">
      <div class="spinner"></div>
      <p class="status">{statusMessage}</p>
    </div>

  {:else if pb.currentState === 'preview'}
    <div class="screen center">
      <h2>Vorschau</h2>
      <div class="preview-container">
        <img src={previewUrl} alt="Vorschau" class="preview-image" />
      </div>
      <div class="preview-actions">
        <button class="capture-btn" onclick={doUpload}>
          Speichern
        </button>
        <button class="discard-btn" onclick={resetPreview}>
          Nochmal
        </button>
      </div>
      <p class="hint">Sage <strong>"Speichern"</strong> oder <strong>"Nochmal"</strong></p>
    </div>

  {:else if pb.currentState === 'result'}
    <div class="screen">
      <QRCode url={pb.resultUrl} timeout={30} onClose={reset} />
    </div>
  {/if}

  <VoiceControl onCommand={handleVoiceCommand} />

  {#if showAdmin}
    <AdminPanel onClose={() => (showAdmin = false)} />
  {/if}
</main>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    background: #000;
    color: #fff;
    overflow: hidden;
    user-select: none;
  }

  :global(button) {
    border: none;
    font-family: inherit;
    cursor: pointer;
  }

  .app {
    position: relative;
    width: 100vw;
    height: 100vh;
    background-color: var(--bg-color, #1a1a2e);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .bg-image {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    z-index: 0;
  }

  .screen {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .screen.center {
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 40px;
    text-align: center;
  }

  .logo {
    font-size: 96px;
    line-height: 1;
  }

  h1 {
    font-size: 72px;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  h2 {
    font-size: 40px;
    font-weight: 800;
  }

  .instruction {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.65);
  }

  .instruction strong {
    color: #f472b6;
  }

  .start-btn {
    background: #f472b6;
    color: white;
    border-radius: 20px;
    padding: 24px 80px;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: 0.03em;
    transition: transform 0.15s;
    margin-top: 16px;
  }

  .start-btn:hover {
    transform: scale(1.04);
  }

  .capturing-screen {
    position: relative;
    overflow: hidden;
  }

  .camera-fullscreen {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: scaleX(-1);
    background: #000;
  }

  .capturing-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 40px 60px;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.5) 0%,
      transparent 25%,
      transparent 65%,
      rgba(0,0,0,0.6) 100%
    );
  }

  .capturing-top {
    display: flex;
    justify-content: center;
  }

  .photo-counter {
    font-size: 28px;
    font-weight: 700;
    color: white;
    background: rgba(0,0,0,0.4);
    padding: 10px 28px;
    border-radius: 50px;
    letter-spacing: 0.05em;
  }

  .countdown-center {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .capturing-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .shutter-btn {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    border: 4px solid white !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.1s, background 0.1s;
    padding: 0;
  }

  .shutter-btn:active {
    transform: scale(0.92);
    background: rgba(255, 255, 255, 0.45);
  }

  .shutter-inner {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: white;
    display: block;
  }

  .preview-container {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  }

  .preview-actions {
    display: flex;
    gap: 20px;
  }

  .discard-btn {
    background: rgba(255, 255, 255, 0.12);
    color: white;
    border-radius: 20px;
    padding: 24px 60px;
    font-size: 28px;
    font-weight: 800;
    transition: transform 0.15s;
  }

  .discard-btn:hover {
    transform: scale(1.04);
    background: rgba(255, 255, 255, 0.2);
  }

  .capture-btn {
    background: #f472b6;
    color: white;
    border-radius: 20px;
    padding: 24px 60px;
    font-size: 28px;
    font-weight: 800;
    transition: transform 0.15s;
  }

  .capture-btn:hover {
    transform: scale(1.04);
  }

  .hint {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.5);
  }

  .hint strong {
    color: #f472b6;
  }

  .status {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.6);
  }

  .spinner {
    width: 80px;
    height: 80px;
    border: 6px solid rgba(255, 255, 255, 0.1);
    border-top-color: #f472b6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .admin-trigger {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 80px;
    height: 80px;
    z-index: 150;
  }
</style>
