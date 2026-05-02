/**
 * QR-Code-Hilfsfunktionen.
 * @module lib/qrcode
 */

import QRCode from 'qrcode';

/**
 * Rendert einen QR-Code auf ein Canvas-Element.
 * @param {HTMLCanvasElement} canvas
 * @param {string} url
 * @param {number} [size=400]
 * @returns {Promise<void>}
 */
export async function renderQRCode(canvas, url, size = 400) {
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}
