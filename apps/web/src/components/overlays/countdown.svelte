<script lang="ts">
  export let seconds: number = 3
  export let visible: boolean = false
</script>

{#if visible}
  <div class="overlay" role="dialog" aria-modal="true" aria-label="Countdown">
    <div class="bubble">{seconds}</div>
  </div>
{/if}

<style>
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000}
  .bubble{width:160px;height:160px;border-radius:999px;background:linear-gradient(135deg,#0ea5e9,#22d3ee);color:#001018;display:flex;align-items:center;justify-content:center;font-size:72px;font-weight:900;box-shadow:0 18px 60px rgba(0,0,0,.35)}
</style>
