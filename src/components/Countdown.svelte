<script>
  /**
   * Countdown — zeigt visuellen Rückwärtszähler vor der Auslösung.
   * @module components/Countdown
   */
  import { onMount, onDestroy } from "svelte";

  /** @type {{ seconds: number, onComplete: () => void }} */
  let { seconds = 3, onComplete } = $props();

  // Startet einen über `seconds`, damit der Ring beim ersten Render leer ist.
  // onMount setzt ihn auf `seconds` → CSS-Transition animiert von leer auf 1/3.
  let remaining = $state(seconds + 1);
  let interval = null;
  let completeTimeout = null;

  onMount(() => {
    remaining = seconds;
    interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        interval = null;
        completeTimeout = setTimeout(() => onComplete(), 800);
      }
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
    clearTimeout(completeTimeout);
  });

  const circumference = 2 * Math.PI * 90;
  // 4 Schritte (3→2→1→0): Ring füllt sich je Sekunde um 1/4
  // remaining=4(init)→leer, 3→1/4, 2→2/4, 1→3/4, 0→voll
  const dashOffset = $derived((remaining / (seconds + 1)) * circumference);
</script>

<div class="countdown-container">
  <svg class="countdown-ring" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="90" class="ring-bg" />
    <circle
      cx="100"
      cy="100"
      r="90"
      class="ring-progress"
      stroke-dasharray={circumference}
      stroke-dashoffset={dashOffset}
    />
  </svg>
  <span class="number">{remaining <= seconds ? remaining : ''}</span>
</div>

<style>
  .countdown-container {
    position: relative;
    width: 220px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .countdown-ring {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.1);
    stroke-width: 8;
  }

  .ring-progress {
    fill: none;
    stroke: #f472b6;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.6s linear;
  }

  .number {
    font-size: 96px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1;
  }
</style>
