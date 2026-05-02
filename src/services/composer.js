/**
 * Canvas-basierte Bildkomposition für alle Ausgabeformate.
 * Alle Ausgaben sind im Portrait-Format (1080×1920).
 * @module services/composer
 */

/** @typedef {'stripe'|'collage'|'polaroid'|'grid'} PhotoFormat */
/** @typedef {{ type: 'color'|'image', value: string }} Background */

const WIDTH = 1080;
const HEIGHT = 1920;

/**
 * Erstellt das fertige Ausgabebild als JPEG-Blob.
 * @param {string[]} photoUrls - Blob-URLs der Fotos
 * @param {PhotoFormat} format
 * @param {Background} background
 * @returns {Promise<Blob>}
 */
export async function composeImage(photoUrls, format, background) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  await drawBackground(ctx, background);

  const images = await loadImages(photoUrls);

  switch (format) {
    case 'stripe':   drawStripe(ctx, images);   break;
    case 'collage':  drawCollage(ctx, images);  break;
    case 'polaroid': drawPolaroid(ctx, images); break;
    case 'grid':     drawGrid(ctx, images);     break;
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Background} bg
 */
async function drawBackground(ctx, bg) {
  if (bg.type === 'color') {
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    const img = await loadImage(bg.value);
    ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
  }
}

/**
 * Photo Stripe: 3 Fotos vertikal gestapelt mit weißem Rahmen.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement[]} images
 */
function drawStripe(ctx, images) {
  const padding = 24;
  const innerWidth = WIDTH - padding * 2;
  const slotHeight = Math.floor((HEIGHT - padding * 4) / 3);

  images.slice(0, 3).forEach((img, i) => {
    const y = padding + i * (slotHeight + padding);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding - 8, y - 8, innerWidth + 16, slotHeight + 16);
    drawFill(ctx, img, padding, y, innerWidth, slotHeight);
  });
}

/**
 * Photo Collage: 4 Fotos asymmetrisch angeordnet.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement[]} images
 */
function drawCollage(ctx, images) {
  const pad = 20;
  const half = Math.floor((WIDTH - pad * 3) / 2);
  const tall = Math.floor((HEIGHT - pad * 3) * 0.55);
  const short = HEIGHT - pad * 3 - tall;

  const positions = [
    { x: pad,          y: pad,           w: half, h: tall  },
    { x: pad * 2 + half, y: pad,         w: half, h: short },
    { x: pad * 2 + half, y: pad * 2 + short, w: half, h: tall - short + short },
    { x: pad,          y: pad * 2 + tall, w: half, h: short },
  ];

  images.slice(0, 4).forEach((img, i) => {
    const p = positions[i];
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.x - 8, p.y - 8, p.w + 16, p.h + 16);
    drawFill(ctx, img, p.x, p.y, p.w, p.h);
  });
}

/**
 * Polaroid: 1 Foto mit breitem weißem Rahmen und Caption-Bereich.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement[]} images
 */
function drawPolaroid(ctx, images) {
  const frameW = WIDTH - 120;
  const frameH = Math.floor(frameW * 1.25);
  const frameX = 60;
  const frameY = Math.floor((HEIGHT - frameH) / 2);
  const borderSide = 32;
  const borderTop = 32;
  const borderBottom = Math.floor(frameW * 0.18);

  // Weißer Polaroid-Rahmen mit leichtem Schatten
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.shadowBlur = 0;

  const photoX = frameX + borderSide;
  const photoY = frameY + borderTop;
  const photoW = frameW - borderSide * 2;
  const photoH = frameH - borderTop - borderBottom;

  drawFill(ctx, images[0], photoX, photoY, photoW, photoH);

  // Caption-Bereich
  ctx.fillStyle = '#333333';
  ctx.font = `italic 36px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('✦  photobooth  ✦', frameX + frameW / 2, frameY + frameH - borderBottom / 2 + 10);
}

/**
 * Photo Grid: 4 Fotos in 2×2 Raster.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement[]} images
 */
function drawGrid(ctx, images) {
  const pad = 20;
  const cellW = Math.floor((WIDTH - pad * 3) / 2);
  const cellH = Math.floor((HEIGHT - pad * 3) / 2);

  images.slice(0, 4).forEach((img, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = pad + col * (cellW + pad);
    const y = pad + row * (cellH + pad);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 6, y - 6, cellW + 12, cellH + 12);
    drawFill(ctx, img, x, y, cellW, cellH);
  });
}

/**
 * Zeichnet ein Bild mit object-fit: cover in den angegebenen Bereich.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function drawFill(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const sx = x + (w - sw) / 2;
  const sy = y + (h - sh) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh);
  ctx.restore();
}

/**
 * @param {string[]} urls
 * @returns {Promise<HTMLImageElement[]>}
 */
function loadImages(urls) {
  return Promise.all(urls.map(loadImage));
}

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
