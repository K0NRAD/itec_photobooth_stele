<script>
  /**
   * PolaroidPhoto — Vorschau des Polaroid-Formats.
   * @module components/formats/PolaroidPhoto
   */

  /** @type {{ photos: string[] }} */
  let { photos } = $props();
</script>

<div class="polaroid-wrapper">
  <div class="polaroid">
    <div class="photo-area">
      {#if photos[0]}
        <img src={photos[0]} alt="Polaroid Foto" />
      {:else}
        <div class="placeholder"><span>1</span></div>
      {/if}
    </div>
    <div class="caption-area">
      <span class="caption-text">✦  photobooth  ✦</span>
    </div>
  </div>
</div>

<style>
  .polaroid-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 24px;
    box-sizing: border-box;
  }

  .polaroid {
    background: #ffffff;
    border-radius: 4px;
    padding: 20px 20px 60px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    width: 90%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .photo-area {
    width: 100%;
    aspect-ratio: 1;
    background: #e5e5e5;
    overflow: hidden;
  }

  .photo-area img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder span {
    font-size: 64px;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.15);
  }

  .caption-area {
    padding: 16px 0 0;
    text-align: center;
  }

  .caption-text {
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 18px;
    color: #555;
    letter-spacing: 0.05em;
  }
</style>
