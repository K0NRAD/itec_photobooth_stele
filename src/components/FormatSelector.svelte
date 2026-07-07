<script>
  /**
   * FormatSelector — Auswahl des Ausgabeformats per Touch oder Sprache.
   * @module components/FormatSelector
   */
  import { onMount, onDestroy, untrack } from 'svelte';

  /** @type {{ selected: string, onSelect: (format: string) => void, timeout?: number, onClose?: () => void }} */
  let { selected, onSelect, timeout = 120, onClose } = $props();

  let remaining = $state(untrack(() => timeout));
  let interval = null;

  onMount(() => {
    interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        onClose?.();
      }
    }, 1000);
  });

  onDestroy(() => clearInterval(interval));

  const formats = [
    {
      id: 'stripe',
      label: 'Streifen',
      description: '3 Fotos',
      icon: '▣',
      preview: 'stripe',
    },
    {
      id: 'collage',
      label: 'Collage',
      description: '4 Fotos',
      icon: '⊞',
      preview: 'collage',
    },
    {
      id: 'polaroid',
      label: 'Polaroid',
      description: '1 Foto',
      icon: '⬜',
      preview: 'polaroid',
    },
    {
      id: 'grid',
      label: 'Raster',
      description: '4 Fotos',
      icon: '⊟',
      preview: 'grid',
    },
  ];
</script>

<div class="format-selector">
  <h2>Format wählen</h2>
  <p class="hint">Tippe oder sage den Namen</p>

  <div class="timer-bar">
    <div class="timer-fill" style="width: {(remaining / timeout) * 100}%"></div>
  </div>
  <p class="timer-text">Schließt automatisch in {remaining}s</p>

  <div class="formats">
    {#each formats as fmt}
      <button
        class="format-card"
        class:active={selected === fmt.id}
        onclick={() => onSelect(fmt.id)}
      >
        <div class="format-preview {fmt.preview}">
          {#if fmt.preview === 'stripe'}
            <div class="preview-stripe">
              <div></div><div></div><div></div>
            </div>
          {:else if fmt.preview === 'collage'}
            <div class="preview-collage">
              <div class="big"></div>
              <div class="small-col">
                <div></div><div></div>
              </div>
              <div class="bottom"></div>
            </div>
          {:else if fmt.preview === 'polaroid'}
            <div class="preview-polaroid">
              <div class="photo"></div>
              <div class="caption"></div>
            </div>
          {:else}
            <div class="preview-grid">
              <div></div><div></div><div></div><div></div>
            </div>
          {/if}
        </div>
        <span class="format-label">{fmt.label}</span>
        <span class="format-desc">{fmt.description}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .format-selector {
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

  .hint {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  .formats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
    max-width: 900px;
  }

  .format-card {
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 28px 20px 20px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    transition: all 0.2s ease;
    color: white;
  }

  .format-card:hover,
  .format-card.active {
    background: rgba(244, 114, 182, 0.2);
    border-color: #f472b6;
    transform: scale(1.03);
  }

  .format-preview {
    width: 120px;
    height: 160px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .format-label {
    font-size: 22px;
    font-weight: 700;
  }

  .format-desc {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.6);
  }

  /* Preview-Illustrationen */
  .preview-stripe {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 80%;
    height: 90%;
    padding: 8px 0;
  }
  .preview-stripe > div {
    flex: 1;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 3px;
  }

  .preview-collage {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
    width: 85%;
    height: 90%;
    padding: 4px;
  }
  .preview-collage .big {
    background: rgba(255, 255, 255, 0.25);
    border-radius: 3px;
    grid-row: span 2;
  }
  .preview-collage .small-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .preview-collage .small-col > div {
    flex: 1;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 3px;
  }
  .preview-collage .bottom {
    display: none;
  }

  .preview-polaroid {
    display: flex;
    flex-direction: column;
    background: white;
    width: 75%;
    height: 85%;
    border-radius: 3px;
    padding: 6px 6px 16px;
    gap: 4px;
  }
  .preview-polaroid .photo {
    flex: 1;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
  }
  .preview-polaroid .caption {
    height: 6px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    width: 80%;
    height: 80%;
  }
  .preview-grid > div {
    background: rgba(255, 255, 255, 0.25);
    border-radius: 3px;
  }

  .timer-bar {
    width: 400px;
    height: 4px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    overflow: hidden;
  }

  .timer-fill {
    height: 100%;
    background: #f472b6;
    border-radius: 2px;
    transition: width 1s linear;
  }

  .timer-text {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }
</style>
