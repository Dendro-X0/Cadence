<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { settings } from '../../stores/settings'

  export let visible: boolean = false
  const dispatch = createEventDispatcher<{ close: void }>()

  function close(): void { dispatch('close') }
  function handleKey(e: KeyboardEvent): void { if (!visible) return; if (e.key === 'Escape' || e.key === 'Enter') close() }
</script>

<svelte:window on:keydown={handleKey} />

{#if visible}
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
    <button type="button" class="backdrop" aria-label="Close shortcuts" on:click={close}></button>
    <div class="card" role="document">
      <div id="shortcuts-title" class="title">Keyboard Shortcuts</div>
      <ul>
        <li><span>Start/Pause</span><kbd>{$settings.shortcutStartPause ?? 'Space'}</kbd></li>
        <li><span>Timer Tab</span><kbd>{$settings.shortcutTimerTab ?? 't'}</kbd></li>
        <li><span>Templates Tab</span><kbd>{$settings.shortcutTemplatesTab ?? 'e'}</kbd></li>
        <li><span>Settings Tab</span><kbd>{$settings.shortcutSettingsTab ?? 's'}</kbd></li>
        <li><span>Toggle This Help</span><kbd>{$settings.shortcutHelp ?? '?'}</kbd></li>
      </ul>
      <button class="btn" on:click={close}>Close</button>
    </div>
  </div>
{/if}

<style>
  .overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:1000}
  .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);border:0;padding:0;margin:0;cursor:default}
  .card{background:#111827;border:1px solid #1f2937;border-radius:16px;padding:16px;min-width:280px;color:#e2e8f0;position:relative;z-index:1}
  .title{font-weight:800;margin-bottom:8px}
  ul{list-style:none;padding:0;margin:0 0 12px 0;display:flex;flex-direction:column;gap:6px}
  li{display:flex;align-items:center;justify-content:space-between;gap:12px}
  kbd{background:#0f172a;border:1px solid #1f2937;border-radius:6px;padding:2px 6px}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700}
</style>
