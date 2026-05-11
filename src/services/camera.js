/** @type {MediaStream|null} */
let stream = null;

/**
 * Startet den Webcam-Stream und bindet ihn an ein Video-Element.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<void>}
 */
export async function initCamera(videoEl) {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });
  videoEl.srcObject = stream;
  await new Promise((resolve) => { videoEl.onloadedmetadata = resolve; });
  await videoEl.play();
}

/**
 * Nimmt ein Standbild vom Video-Element auf und gibt eine Blob-URL zurück.
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<string>} Object-URL
 */
export async function captureFrame(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext('2d').drawImage(videoEl, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  return URL.createObjectURL(blob);
}

/**
 * Stoppt den laufenden Webcam-Stream.
 */
export function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}
