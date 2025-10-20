<script lang="ts">
  import { overlays, confirmAccept, confirmCancel } from '../../stores/overlays'
  import { fade, scale } from 'svelte/transition'
  export let visible: boolean = false
  function key(e: KeyboardEvent): void {
    if (e.key === 'Escape') { confirmCancel() }
    if (e.key === 'Enter') { confirmAccept() }
  }
  let acceptBtn: HTMLButtonElement | null = null
  $: if (visible && acceptBtn) { setTimeout(() => acceptBtn?.focus(), 0) }
  function handleWindowKey(e: KeyboardEvent): void { if (!visible) return; key(e) }
</script>

<svelte:window on:keydown={handleWindowKey} />

{#if visible}
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title" tabindex="-1">
    <button class="backdrop" aria-label="Close" on:click={confirmCancel} in:fade={{ duration: 120 }} out:fade={{ duration: 100 }}></button>
    <div class="card" role="document" on:pointerdown|stopPropagation in:scale={{ duration: 160, start: 0.98 }} out:fade={{ duration: 100 }}>
      {#if $overlays.confirmTitle}<div id="confirm-title" class="title">{$overlays.confirmTitle}</div>{/if}
      {#if $overlays.confirmText}<div class="text">{$overlays.confirmText}</div>{/if}
      {#if $overlays.confirmSummary}
        <ul class="summary">
          {#each $overlays.confirmSummary as item}
            <li>
              <div class="left">
                {#if item.type}
                  <span class="dot {item.type}"></span>
                {/if}
                <span class="label">{item.label}</span>
              </div>
              <div class="right">{item.minutes} min</div>
            </li>
          {/each}
        </ul>
        {#if $overlays.confirmRepeat && $overlays.confirmRepeat > 1}
          <div class="repeat">×{$overlays.confirmRepeat}</div>
        {/if}
      {/if}
      <div class="actions">
        <button class="btn secondary" on:click={confirmCancel}>{$overlays.confirmCancelLabel ?? 'Cancel'}</button>
        <button class="btn primary" on:click={confirmAccept} bind:this={acceptBtn}>{$overlays.confirmAcceptLabel ?? 'OK'}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:1000}
  .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);border:0;padding:0;margin:0;cursor:default;z-index:1}
  .card{position:relative;z-index:2;background:var(--surface-2);border:1px solid var(--border);border-radius:16px;padding:16px;min-width:320px;max-width:88vw;color:var(--fg);box-shadow:0 20px 60px rgba(0,0,0,.5)}
  .title{font-weight:800;margin-bottom:8px}
  .text{opacity:.9;margin-bottom:12px}
  .summary{list-style:none;margin:0 0 10px 0;padding:0;display:flex;flex-direction:column;gap:6px}
  .summary li{display:flex;justify-content:space-between;align-items:center}
  .summary .left{display:flex;gap:8px;align-items:center}
  .summary .right{opacity:.95;font-weight:700}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .dot.focus{background:#22c55e}
  .dot.break{background:#60a5fa}
  .dot.meditation{background:#a78bfa}
  .dot.workout{background:#f59e0b}
  .dot.rest{background:#94a3b8}
  .dot.custom{background:#eab308}
  .repeat{opacity:.85;margin-bottom:8px}
  .actions{display:flex;gap:8px;justify-content:flex-end}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700}
  .btn.primary{background:#0ea5e9;color:#001018;border-color:transparent}
  .btn.secondary{background:#111827;color:#e2e8f0;border:1px solid #1f2937}
  :global(html[data-theme="light"]) .card{background:#ffffff;border-color:#e2e8f0;color:#0b1220}
  :global(html[data-theme="light"]) .btn.secondary{background:#f1f5f9;color:#0b1220;border-color:#cbd5e1}
  :global(html[data-theme="amoled"]) .card{background:#000;border-color:#1a1a1a;color:#e2e8f0}
</style>
