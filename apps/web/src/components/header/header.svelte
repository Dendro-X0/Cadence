<script lang="ts">
  import { onMount } from 'svelte'
  import WindowControls from './window-controls.svelte'

  let canToggle: boolean = false
  let toggleMaxRestore: () => Promise<void> = async () => {}

  onMount(async () => {
    try {
      const mod = await import('@tauri-apps/api/window') as any
      const win = mod?.appWindow
      if (win) {
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
</style>
