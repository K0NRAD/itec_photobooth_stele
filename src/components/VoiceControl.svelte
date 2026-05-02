<script>
  /**
   * VoiceControl — startet Web Speech API und gibt Befehle weiter.
   * @module components/VoiceControl
   */
  import { onMount, onDestroy } from 'svelte';
  import { startSpeechRecognition } from '../services/speech.js';

  /** @type {{ onCommand: (cmd: string) => void }} */
  let { onCommand } = $props();

  /** @type {boolean} */
  let active = $state(false);
  /** @type {string} */
  let lastCommand = $state('');

  let stopRecognition = () => {};

  onMount(() => {
    stopRecognition = startSpeechRecognition((command, raw) => {
      lastCommand = command;
      active = true;
      setTimeout(() => { active = false; }, 1200);
      onCommand(command);
    });
  });

  onDestroy(() => stopRecognition());
</script>

<div class="voice-indicator" class:active>
  <div class="mic-icon">
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  </div>
  {#if lastCommand}
    <span class="last-command">{lastCommand}</span>
  {/if}
</div>

<style>
  .voice-indicator {
    position: fixed;
    bottom: 32px;
    right: 32px;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    padding: 12px 20px;
    color: rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
    z-index: 100;
  }

  .voice-indicator.active {
    color: #4ade80;
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
  }

  .mic-icon {
    width: 28px;
    height: 28px;
  }

  .last-command {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
</style>
