<script lang="ts">
  import { overlays, acceptUpdate, dismissUpdate } from '../../stores/overlays'
  export let visible: boolean = false
</script>

{#if visible}
  <div class="toast" role="status" aria-live="polite">
    <div class="msg">{$overlays.updateMessage ?? 'Update available'}</div>
    <div class="actions">
      <button class="btn secondary" on:click={dismissUpdate}>Later</button>
      <button class="btn primary" on:click={acceptUpdate}>Reload</button>
    </div>
  </div>
{/if}

<style>
  .toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:12px;align-items:center;background:var(--surface-2);color:var(--fg);border:1px solid var(--border);border-radius:12px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);z-index:1100}
  .msg{font-weight:600}
  .actions{display:flex;gap:8px}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:6px 10px;border-radius:8px;cursor:pointer;font-weight:700}
  .btn.primary{background:#0ea5e9;color:#001018;border-color:transparent}
  .btn.secondary{background:#111827;color:#e2e8f0;border:1px solid #1f2937}
  :global(html[data-theme="light"]) .toast{background:#ffffff;border-color:#e2e8f0;color:#0b1220}
  :global(html[data-theme="amoled"]) .toast{background:#000;border-color:#1a1a1a;color:#e2e8f0}
</style>
