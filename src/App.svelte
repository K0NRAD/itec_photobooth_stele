<script>
  /**
   * App — Haupt-Komponente mit State-Machine-Steuerung.
   * Koordiniert alle Screens und verarbeitet Sprachbefehle.
   * @module App
   */
  import { onMount } from 'svelte';

  import VoiceControl from './components/VoiceControl.svelte';
  import Countdown from './components/Countdown.svelte';
  import FormatSelector from './components/FormatSelector.svelte';
  import BackgroundPicker from './components/BackgroundPicker.svelte';
  import QRCode from './components/QRCode.svelte';
  import AdminPanel from './components/AdminPanel.svelte';
  import PhotoStripe from './components/formats/PhotoStripe.svelte';
  import PhotoCollage from './components/formats/PhotoCollage.svelte';
  import PolaroidPhoto from './components/formats/PolaroidPhoto.svelte';
  import PhotoGrid from './components/formats/PhotoGrid.svelte';

  import {
    pb, derived,
    transition, startSession, addPhoto, setResult, reset,
  } from './state/photobooth.svelte.js';

  import { connectCamera, triggerCapture, fetchPhotoAsBlob, onCameraEvent } from './services/camera.js';
  import { uploadPhoto } from './services/supabase.js';
  import { composeImage } from './services/composer.js';

  /** @type {boolean} */
  let showAdmin = $state(false);
  /** @type {boolean} */
  let capturing = $state(false);
  /** @type {boolean} */
  let showCountdown = $state(false);
  /** @type {string} */
  let statusMessage = $state('');

  let adminPressTimer = null;

  onMount(() => {
    connectCamera();
    const unsubWs = onCameraEvent(handleCameraEvent);
    return unsubWs;
  });

  /**
   * @param {object} event
   */
  function handleCameraEvent(event) {
    if (event.type === 'capture_done' && event.photoUrl) {
      handlePhotoCaptured(event.photoUrl);
    }
    if (event.type === 'error') {
      statusMessage = `Kamera-Fehler: ${event.message}`;
    }
  }

  /**
   * Verarbeitet einen erkannten Sprachbefehl.
   * @param {string} command
   */
  function handleVoiceCommand(command) {
    if (command === 'admin') {
      showAdmin = true;
      return;
    }

    if (pb.currentState === 'idle') {
      if (command === 'start') transition('format_select');
    } else if (pb.currentState === 'format_select') {
      if (['stripe', 'collage', 'polaroid', 'grid'].includes(command)) {
        handleFormatSelect(command);
      } else if (command === 'next') {
        handleFormatSelect(pb.selectedFormat);
      }
    } else if (pb.currentState === 'background_select') {
      if (command === 'next') transition('capturing');
    } else if (pb.currentState === 'capturing') {
      if (command === 'capture' && !capturing) {
        triggerNextPhoto();
      }
    } else if (pb.currentState === 'result') {
      if (command === 'restart') reset();
    }
  }

  /**
   * @param {string} format
   */
  function handleFormatSelect(format) {
    startSession(format);
    transition('background_select');
  }

  async function triggerNextPhoto() {
    if (capturing || derived.allPhotosTaken) return;
    capturing = true;
    showCountdown = true;
  }

  async function onCountdownComplete() {
    showCountdown = false;
    statusMessage = 'Aufnahme...';

    const result = await triggerCapture(pb.sessionId, pb.photos.length);

    if (!result.success) {
      statusMessage = result.error || 'Aufnahme fehlgeschlagen';
      capturing = false;
      return;
    }

    if (result.photoUrl) {
      await handlePhotoCaptured(result.photoUrl);
    }
  }

  /**
   * @param {string} photoUrl
   */
  async function handlePhotoCaptured(photoUrl) {
    const blobUrl = await fetchPhotoAsBlob(photoUrl);
    addPhoto(blobUrl);
    statusMessage = `Foto ${pb.photos.length} / ${derived.requiredPhotos}`;
    capturing = false;

    if (derived.allPhotosTaken) {
      await composeAndUpload();
    }
  }

  async function composeAndUpload() {
    transition('composing');
    statusMessage = 'Bild wird erstellt...';

    const blob = await composeImage(pb.photos, pb.selectedFormat, pb.background);
    statusMessage = 'Hochladen...';

    const { publicUrl, error } = await uploadPhoto(blob, pb.sessionId, pb.selectedFormat);

    if (error || !publicUrl) {
      statusMessage = `Upload fehlgeschlagen: ${error}`;
      return;
    }

    setResult(publicUrl);
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
      <p class="instruction">Sage <strong>"Start"</strong> oder tippe zum Beginnen</p>
      <button class="start-btn" onclick={() => transition('format_select')}>
        Start
      </button>
    </div>

  {:else if pb.currentState === 'format_select'}
    <div class="screen">
      <FormatSelector
        selected={pb.selectedFormat}
        onSelect={handleFormatSelect}
      />
    </div>

  {:else if pb.currentState === 'background_select'}
    <div class="screen">
      <BackgroundPicker
        background={pb.background}
        onDone={() => transition('capturing')}
      />
    </div>

  {:else if pb.currentState === 'capturing'}
    <div class="screen center">
      <h2>Foto {pb.photos.length + 1} von {derived.requiredPhotos}</h2>

      <div class="format-preview-container">
        {#if pb.selectedFormat === 'stripe'}
          <PhotoStripe photos={pb.photos} />
        {:else if pb.selectedFormat === 'collage'}
          <PhotoCollage photos={pb.photos} />
        {:else if pb.selectedFormat === 'polaroid'}
          <PolaroidPhoto photos={pb.photos} />
        {:else}
          <PhotoGrid photos={pb.photos} />
        {/if}
      </div>

      {#if showCountdown}
        <div class="countdown-overlay">
          <Countdown seconds={3} onComplete={onCountdownComplete} />
        </div>
      {:else if !derived.allPhotosTaken}
        <button
          class="capture-btn"
          disabled={capturing}
          onclick={triggerNextPhoto}
        >
          {capturing ? 'Aufnahme...' : '📷 Foto aufnehmen'}
        </button>
        <p class="hint">Oder sage <strong>"Foto"</strong></p>
      {/if}

      {#if statusMessage}
        <p class="status">{statusMessage}</p>
      {/if}
    </div>

  {:else if pb.currentState === 'composing'}
    <div class="screen center">
      <div class="spinner"></div>
      <p class="status">{statusMessage}</p>
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

  .format-preview-container {
    width: 100%;
    max-width: 640px;
    max-height: 55vh;
    overflow: hidden;
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .countdown-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    z-index: 50;
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

  .capture-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .capture-btn:not(:disabled):hover {
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
