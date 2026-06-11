/** @type {MediaStream|null} */
let stream = null;

/**
 * @param {string|null} [deviceId]
 * @returns {MediaStreamConstraints}
 */
function buildConstraints(deviceId) {
  return {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    },
    audio: false,
  };
}

/**
 * Startet den Webcam-Stream und bindet ihn an ein Video-Element.
 * @param {HTMLVideoElement} videoEl
 * @param {string|null} [deviceId] Bevorzugte Kamera (deviceId von enumerateDevices)
 * @returns {Promise<void>}
 */
export async function initCamera(videoEl, deviceId = null) {
  try {
    stream = await navigator.mediaDevices.getUserMedia(buildConstraints(deviceId));
  } catch (err) {
    if (deviceId && err.name === 'OverconstrainedError') {
      // Gespeicherte Kamera nicht mehr verfügbar -> Standardkamera verwenden
      stream = await navigator.mediaDevices.getUserMedia(buildConstraints(null));
    } else {
      throw err;
    }
  }
  videoEl.srcObject = stream;
  await new Promise((resolve) => { videoEl.onloadedmetadata = resolve; });
  await videoEl.play();
}

/**
 * Liefert alle verfügbaren Kameras (Video-Eingabegeräte).
 * Liefert nur dann aussagekräftige `label`s, wenn die Kamera-Berechtigung
 * bereits erteilt wurde.
 * @returns {Promise<MediaDeviceInfo[]>}
 */
export async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
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
