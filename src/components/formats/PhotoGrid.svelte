<script>
  /**
   * PhotoGrid — Vorschau des 2×2 Photo-Grid-Formats.
   * @module components/formats/PhotoGrid
   */

  /** @type {{ photos: string[] }} */
  let { photos } = $props();
</script>

<div class="grid">
  {#each { length: 4 } as _, i}
    <div class="slot">
      {#if photos[i]}
        <img src={photos[i]} alt="Foto {i + 1}" />
      {:else}
        <div class="placeholder"><span>{i + 1}</span></div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
  }

  .slot {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.15);
  }

  .slot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder span {
    font-size: 48px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.2);
  }
</style>
