import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Zeigt unbehandelte JS-Fehler als Overlay an (kein DevTools im Kiosk-Modus).
window.addEventListener('error', (e) => {
  const div = document.createElement('div')
  div.style.cssText = 'position:absolute;top:20px;left:20px;color:red;background:white;padding:15px;font-size:24px;z-index:9999;border:3px solid red;'
  div.innerHTML = `JS FEHLER: ${e.message}<br>Datei: ${e.filename}:${e.lineno}`
  document.body.appendChild(div)
})

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
