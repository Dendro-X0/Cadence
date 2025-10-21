<script lang="ts">
  import { onMount } from 'svelte'
  import WindowControls from './window-controls.svelte'
  import { toggleGetApp } from '../../stores/overlays'

  let canToggle: boolean = false
  let toggleMaxRestore: () => Promise<void> = async () => {}
  let showGetApp: boolean = true

  onMount(async () => {
    // Detect desktop (Tauri) via multiple signals
    const hasTauriGlobal: boolean = typeof window !== 'undefined' && (!!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__)
    if (hasTauriGlobal) showGetApp = false

    // Hide in installed PWA windows too (display-mode: standalone)
    try {
      const mm = window.matchMedia('(display-mode: standalone)')
      if (mm?.matches) showGetApp = false
      mm?.addEventListener?.('change', (e: MediaQueryListEvent) => { if (e.matches) showGetApp = false })
    } catch {}
    window.addEventListener('appinstalled', () => { showGetApp = false })
    try {
      const mod = await import('@tauri-apps/api/window') as any
      const win = mod?.appWindow ?? (typeof mod?.getCurrentWindow === 'function' ? mod.getCurrentWindow() : null)
      if (win) {
        showGetApp = false
        canToggle = true
        toggleMaxRestore = async () => {
          try {
            const maximized: boolean = await win.isMaximized()
            if (maximized) await win.unmaximize(); else await win.maximize()
          } catch {}
        }
      }
    } catch {}
  })
</script>

<div class="header" role="banner" data-tauri-drag-region="true" on:dblclick={() => { if (canToggle) void toggleMaxRestore() }}>
  <div class="brand">
    <img class="brand__logo" src="/favicon.svg" alt="" />
    <span class="brand__title">Focus Motive</span>
  </div>
  <div class="spacer"></div>
  <div class="no-drag" data-tauri-drag-region="false">
    {#if showGetApp}
      <button class="getapp" type="button" on:click={() => toggleGetApp()}>Get App</button>
    {/if}
    <WindowControls />
  </div>
</div>

<style>
  .header{display:flex;align-items:center;gap:12px;padding:12px 16px;background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,0));border-radius:16px;margin-bottom:16px;user-select:none}
  .brand{display:flex;gap:8px;align-items:center}
  .brand__logo{width:28px;height:28px}
  .brand__title{font-weight:700}
  .spacer{flex:1}
  :global(.no-drag){-webkit-app-region: no-drag;pointer-events:auto;position:relative;z-index:10}
  .getapp{margin-right:8px;background:#1f2937;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:6px 10px;cursor:pointer;font-weight:700}
  :global(html.tauri-desktop) .getapp{display:none}
  @media all and (display-mode: standalone){ .getapp{ display:none } }
</style>
