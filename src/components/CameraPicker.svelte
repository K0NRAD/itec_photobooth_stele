<script>
  /**
   * CameraPicker — Auswahl der zu verwendenden Kamera (Video-Eingabegerät).
   * @module components/CameraPicker
   */
  import { untrack } from 'svelte';
  import { setCamera } from '../state/photobooth.svelte.js';
  import { listCameras, initCamera, stopCamera } from '../services/camera.js';

  /** @type {{ selectedId: string|null, onDone: () => void }} */
  let { selectedId, onDone } = $props();

  /** @type {MediaDeviceInfo[]} */
  let cameras = $state([]);
  let selected = $state(untrack(() => selectedId));
  let error = $state('');

  /** @type {HTMLVideoElement} */
  let videoEl = $state(null);

  $effect(() => {
    listCameras()
      .then((found) => {
        cameras = found;
        if (!selected && found.length > 0) selected = found[0].deviceId;
      })
      .catch((err) => {
        error = `Kameras konnten nicht ermittelt werden: ${err.message}`;
      });
  });

  $effect(() => {
    if (!videoEl || !selected) return;
    initCamera(videoEl, selected).catch((err) => {
      error = `Vorschau fehlgeschlagen: ${err.message}`;
    });
    return () => stopCamera();
  });

  function apply() {
    setCamera(selected);
    onDone();
  }
</script>

<div class="camera-picker">
  <h2>Kamera</h2>

  {#if error}
    <p class="error-msg">{error}</p>
  {/if}

  {#if cameras.length === 0}
    {#if !error}
      <p class="hint">Keine Kameras gefunden</p>
    {/if}
  {:else}
    <div class="camera-list">
      {#each cameras as cam, i}
        <button
          class="camera-item"
          class:active={selected === cam.deviceId}
          onclick={() => (selected = cam.deviceId)}
        >
          {cam.label || `Kamera ${i + 1}`}
        </button>
      {/each}
    </div>

    <video bind:this={videoEl} class="preview" autoplay playsinline muted></video>
  {/if}

  <button class="apply-btn" onclick={apply}>Übernehmen →</button>
</div>

<style>
  .camera-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 40px 24px;
    width: 100%;
  }

  h2 {
    font-size: 48px;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
  }

  .hint {
    color: rgba(255, 255, 255, 0.5);
    font-size: 18px;
  }

  .error-msg {
    color: #ef4444;
    font-size: 16px;
  }

  .camera-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .camera-item {
    padding: 16px 24px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .camera-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .camera-item.active {
    border-color: #f472b6;
    background: rgba(244, 114, 182, 0.15);
  }

  .preview {
    width: 320px;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 16px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    background: #000;
    transform: scaleX(-1);
  }

  .apply-btn {
    background: #f472b6;
    color: white;
    border: none;
    border-radius: 16px;
    padding: 20px 60px;
    font-size: 24px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .apply-btn:hover {
    transform: scale(1.04);
  }
</style>
