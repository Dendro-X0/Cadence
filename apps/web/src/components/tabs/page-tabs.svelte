<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { settings as settingsStore } from '../../stores/settings'

  export let active: 'timer'|'templates'|'settings'|'shortcuts' = 'timer'
  export let showShortcuts: boolean = true
  const dispatch = createEventDispatcher<{ change: 'timer'|'templates'|'settings'|'shortcuts' }>()

  function set(page: 'timer'|'templates'|'settings'|'shortcuts'): void {
    if (page !== active) {
      active = page
      dispatch('change', page)
    }
  }

  $: keyTimer = ($settingsStore.shortcutTimerTab ?? 't') as string
  $: keyTemplates = ($settingsStore.shortcutTemplatesTab ?? 'e') as string
  $: keySettings = ($settingsStore.shortcutSettingsTab ?? 's') as string
  $: keyShortcuts = ($settingsStore.shortcutShortcutsTab ?? 'k') as string
</script>

<div class="tabs">
  <button class="tab {active==='timer'?'active':''}" aria-keyshortcuts={keyTimer} on:click={() => set('timer')}>
    <span>Timer</span><kbd class="kbd">{keyTimer}</kbd>
  </button>
  <button class="tab {active==='templates'?'active':''}" aria-keyshortcuts={keyTemplates} on:click={() => set('templates')}>
    <span>Templates</span><kbd class="kbd">{keyTemplates}</kbd>
  </button>
  <button class="tab {active==='settings'?'active':''}" aria-keyshortcuts={keySettings} on:click={() => set('settings')}>
    <span>Settings</span><kbd class="kbd">{keySettings}</kbd>
  </button>
  {#if showShortcuts}
    <button class="tab {active==='shortcuts'?'active':''}" aria-keyshortcuts={keyShortcuts} on:click={() => set('shortcuts')}>
      <span>Shortcuts</span><kbd class="kbd">{keyShortcuts}</kbd>
    </button>
  {/if}
</div>

<style>
  .tabs{display:flex;gap:8px;margin:8px 0 16px}
  .tab{display:inline-flex;align-items:center;gap:8px;background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:600}
  .tab.active{background:#0ea5e9;color:#001018;border-color:transparent}
  .kbd{display:none;margin-left:2px;padding:2px 6px;border-radius:6px;background:rgba(0,0,0,.35);color:#e2e8f0;font-weight:800;font-size:10px}
  .tab:hover .kbd{display:inline-block}
</style>
