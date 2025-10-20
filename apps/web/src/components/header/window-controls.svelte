<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  type TauriWindow = {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    unmaximize: () => Promise<void>
    isMaximized: () => Promise<boolean>
    onResized?: (handler: () => void) => Promise<() => void> | (() => void)
    close: () => Promise<void>
  }
  let isDesktop: boolean = false
  let win: TauriWindow | null = null
  let isMax: boolean = false
  let unlistenResize: (() => void) | null = null

  onMount(async () => {
    try {
      const mod = await import('@tauri-apps/api/window') as unknown as { appWindow?: TauriWindow; getCurrentWindow?: () => TauriWindow }
      // v1 exports appWindow, v2 often prefers getCurrentWindow
      win = (mod.appWindow ?? mod.getCurrentWindow?.()) ?? null
      isDesktop = Boolean(win)
      if (win) {
        try { isMax = await win.isMaximized() } catch {}
        try {
          const maybe = win.onResized?.(async () => { try { isMax = await win!.isMaximized() } catch {} })
          if (typeof maybe === 'function') unlistenResize = maybe
          else if (maybe && typeof (maybe as Promise<() => void>).then === 'function') {
            unlistenResize = await (maybe as Promise<() => void>)
          }
        } catch {}
      }
    } catch {
      isDesktop = false
    }
  })

  async function minimize(): Promise<void> { try { await win?.minimize?.() } catch {} }
  async function toggleMax(): Promise<void> {
    try {
      const maximized = await win?.isMaximized?.()
      if (maximized) { await win?.unmaximize?.(); isMax = false } else { await win?.maximize?.(); isMax = true }
    } catch {}
  }
  async function close(): Promise<void> { try { await win?.close?.() } catch {} }

  onDestroy(() => { try { unlistenResize?.() } catch {} })
</script>

{#if isDesktop}
  <div class="win-controls no-drag" role="group" aria-label="Window Controls">
    <button class="btn secondary" title="Minimize" aria-label="Minimize" on:click={minimize}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="7" width="10" height="2" rx="1" fill="currentColor"/>
      </svg>
    </button>
    <button class="btn secondary" title={isMax ? 'Restore' : 'Maximize'} aria-label={isMax ? 'Restore' : 'Maximize'} on:click={toggleMax}>
      {#if isMax}
        <!-- Restore icon -->
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor"/>
          <path d="M5 5h6v6" stroke="currentColor"/>
        </svg>
      {:else}
        <!-- Maximize icon -->
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="2.5" width="9" height="9" rx="1.2" stroke="currentColor"/>
        </svg>
      {/if}
    </button>
    <button class="btn danger" title="Close" aria-label="Close" on:click={close}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
{/if}

<style>
  .win-controls{display:flex;gap:6px;margin-left:8px}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:6px 10px;border-radius:8px;cursor:pointer;font-weight:700;transition:transform .08s ease,background .2s ease,box-shadow .2s ease;backdrop-filter:saturate(120%) blur(2px)}
  .btn:hover{transform:translateY(-1px)}
  .btn:active{transform:translateY(0)}
  .btn.secondary{background:#1f2937}
  .btn.danger{background:#ef4444;color:#fff;border-color:transparent}
</style>
