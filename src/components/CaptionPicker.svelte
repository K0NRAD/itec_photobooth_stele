<script>
  /**
   * CaptionPicker — Beschriftung, die auf jedem Foto im weißen Streifen erscheint.
   * @module components/CaptionPicker
   */
  import { untrack } from 'svelte';
  import { setCaption } from '../state/photobooth.svelte.js';

  /** @type {{ caption: string, onDone: () => void }} */
  let { caption, onDone } = $props();

  let value = $state(untrack(() => caption ?? ''));

  function apply() {
    setCaption(value.trim());
    onDone();
  }
</script>

<div class="caption-picker">
  <h2>Foto-Text</h2>
  <p class="hint">Erscheint auf jedem Foto im weißen Streifen unten. Leer lassen für keinen Text.</p>

  <input
    type="text"
    maxlength="40"
    bind:value
    placeholder="z. B. Sommerfest 2026"
    onkeydown={(e) => e.key === 'Enter' && apply()}
  />

  <div class="preview" class:empty={!value.trim()}>
    {value.trim() || 'Vorschau'}
  </div>

  <button class="apply-btn" onclick={apply}>Übernehmen →</button>
</div>

<style>
  .caption-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
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
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
    max-width: 420px;
    text-align: center;
    line-height: 1.4;
  }

  input {
    font-size: 24px;
    text-align: center;
    letter-spacing: normal;
    -webkit-text-security: none;
    padding: 16px 24px;
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    width: 100%;
    max-width: 420px;
    box-sizing: border-box;
  }

  .preview {
    width: 100%;
    max-width: 420px;
    padding: 20px 16px;
    border-radius: 8px;
    background: #ffffff;
    color: #333333;
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 26px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview.empty {
    color: rgba(0, 0, 0, 0.3);
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
