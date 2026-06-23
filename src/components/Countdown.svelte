<script>
  /**
   * Countdown — zeigt visuellen Rückwärtszähler vor der Auslösung.
   * @module components/Countdown
   */
  import { onMount, onDestroy, untrack } from "svelte";

  /** @type {{ seconds: number, onComplete: () => void }} */
  let { seconds = 3, onComplete } = $props();

  let remaining = $state(untrack(() => seconds));
  let interval = null;

  onMount(() => {
    remaining = seconds;
    interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);
  });

  onDestroy(() => clearInterval(interval));

  const progress = $derived(remaining / seconds);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = $derived(progress * circumference);
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
  <span class="number">{remaining}</span>
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
