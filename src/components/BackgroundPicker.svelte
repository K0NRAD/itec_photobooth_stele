<script>
  /**
   * BackgroundPicker — Hintergrundauswahl (Farbe oder Bild).
   * @module components/BackgroundPicker
   */
  import { untrack } from 'svelte';
  import { setBackground } from '../state/photobooth.svelte.js';

  /** @type {{ background: { type: string, value: string }, onDone: () => void }} */
  let { background, onDone } = $props();

  /** @type {'color'|'image'} */
  let activeTab = $state(untrack(() => background.type === 'image' ? 'image' : 'color'));
  let colorValue = $state(untrack(() => background.type === 'color' ? background.value : '#1a1a2e'));
  let imagePreview = $state(untrack(() => /** @type {string|null} */ (background.type === 'image' ? background.value : null)));

  function handleColorChange(e) {
    colorValue = e.target.value;
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      imagePreview = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function apply() {
    if (activeTab === 'color') {
      setBackground({ type: 'color', value: colorValue });
    } else if (imagePreview) {
      setBackground({ type: 'image', value: imagePreview });
    }
    onDone();
  }
</script>

<div class="bg-picker">
  <h2>Hintergrund</h2>

  <div class="tabs">
    <button class:active={activeTab === 'color'} onclick={() => (activeTab = 'color')}>
      Farbe
    </button>
    <button class:active={activeTab === 'image'} onclick={() => (activeTab = 'image')}>
      Bild / Muster
    </button>
  </div>

  {#if activeTab === 'color'}
    <div class="color-section">
      <div class="color-preview" style="background: {colorValue}"></div>
      <input type="color" value={colorValue} oninput={handleColorChange} />
      <div class="presets">
        {#each ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#2d6a4f', '#1b263b', '#000000', '#ffffff'] as c}
          <button
            class="preset-swatch"
            style="background: {c}"
            aria-label="Farbe {c}"
            onclick={() => { colorValue = c; }}
          ></button>
        {/each}
      </div>
    </div>
  {:else}
    <div class="image-section">
      {#if imagePreview}
        <img src={imagePreview} alt="Vorschau" class="image-preview" />
      {:else}
        <div class="image-placeholder">Kein Bild gewählt</div>
      {/if}
      <label class="upload-btn">
        Bild hochladen
        <input type="file" accept="image/*" onchange={handleImageUpload} />
      </label>
    </div>
  {/if}

  <button class="apply-btn" onclick={apply}>Übernehmen →</button>
</div>

<style>
  .bg-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding: 40px 24px;
    width: 100%;
  }

  h2 {
    font-size: 48px;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
  }

  .tabs {
    display: flex;
    gap: 0;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 4px;
  }

  .tabs button {
    padding: 14px 40px;
    border-radius: 10px;
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    background: transparent;
    border: none;
    transition: all 0.2s;
  }

  .tabs button.active {
    background: #f472b6;
    color: white;
  }

  .color-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .color-preview {
    width: 200px;
    height: 200px;
    border-radius: 20px;
    border: 3px solid rgba(255, 255, 255, 0.2);
  }

  input[type='color'] {
    width: 80px;
    height: 50px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    max-width: 400px;
  }

  .preset-swatch {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: transform 0.15s;
  }

  .preset-swatch:hover {
    transform: scale(1.15);
    border-color: white;
  }

  .image-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .image-preview {
    width: 300px;
    height: 300px;
    object-fit: cover;
    border-radius: 16px;
    border: 3px solid rgba(255, 255, 255, 0.2);
  }

  .image-placeholder {
    width: 300px;
    height: 300px;
    border-radius: 16px;
    border: 3px dashed rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
  }

  .upload-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 16px 40px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-btn input {
    display: none;
  }

  .upload-btn:hover {
    background: rgba(255, 255, 255, 0.2);
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
