<script>
  /**
   * PhotoCollage — Vorschau des asymmetrischen Collage-Formats.
   * @module components/formats/PhotoCollage
   */

  /** @type {{ photos: string[] }} */
  let { photos } = $props();
</script>

<div class="collage">
  <div class="col-left">
    <div class="slot large">
      {#if photos[0]}
        <img src={photos[0]} alt="Foto 1" />
      {:else}
        <div class="placeholder"><span>1</span></div>
      {/if}
    </div>
    <div class="slot small">
      {#if photos[3]}
        <img src={photos[3]} alt="Foto 4" />
      {:else}
        <div class="placeholder"><span>4</span></div>
      {/if}
    </div>
  </div>
  <div class="col-right">
    <div class="slot small">
      {#if photos[1]}
        <img src={photos[1]} alt="Foto 2" />
      {:else}
        <div class="placeholder"><span>2</span></div>
      {/if}
    </div>
    <div class="slot large">
      {#if photos[2]}
        <img src={photos[2]} alt="Foto 3" />
      {:else}
        <div class="placeholder"><span>3</span></div>
      {/if}
    </div>
  </div>
</div>

<style>
  .collage {
    display: flex;
    gap: 12px;
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
    height: 100%;
  }

  .col-left, .col-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .slot {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.15);
  }

  .slot.large { flex: 2; }
  .slot.small { flex: 1; }

  .slot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder span {
    font-size: 36px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.2);
  }
</style>
