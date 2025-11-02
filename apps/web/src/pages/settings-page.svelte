<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '../stores/settings'
  import type { Settings } from '@cadence/core-domain/settings'
  import { applyWindowEffect, type WindowEffect } from '../lib/window-effects'
  import { applyGlassIntensity } from '../lib/window-glass'

  let s: Settings = {
    sessionMinutes: 25,
    autoStart: false,
    theme: 'dark',
    timerMode: 'digital',
    timerSize: 'l',
    tabsPlacement: 'top',
    glassEffect: 'off'
  }
  async function openExternal(): Promise<void> {
    try {
      const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env
      const base = env?.VITE_PUBLIC_BASE_URL
      const url = base ? new URL('/?install=1', base).toString() : new URL('/?install=1', window.location.origin).toString()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {}
  }
  let deferred: BeforeInstallPromptEvent | null = null

  onMount(async () => {
    s = await loadSettings()
    // apply chosen window effect on desktop (no-op on web)
    try {
      await applyWindowEffect((s.glassEffect ?? 'off') as WindowEffect)
      applyGlassIntensity((s.glassIntensity ?? 'medium'))
      // Apply desktop window prefs if running in Tauri
      const wmod = await import('@tauri-apps/api/window') as any
      const win = wmod?.appWindow ?? (typeof wmod?.getCurrentWindow === 'function' ? wmod.getCurrentWindow() : null)
      if (win) {
        try { await win.setAlwaysOnTop(Boolean(s.alwaysOnTop)) } catch {}
        if (s.rememberWindowState && s.windowBounds) {
          try {
            await win.setSize({ width: s.windowBounds.width, height: s.windowBounds.height })
            await win.setPosition({ x: s.windowBounds.x, y: s.windowBounds.y })
          } catch {}
        }
        // Start listeners when remember is enabled
        if (s.rememberWindowState) { await startWindowStateListeners() }
      }
    } catch {}
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault?.()
      deferred = e as BeforeInstallPromptEvent
    })
  })

  async function onThemeChange(v: 'dark'|'light'|'amoled'): Promise<void> {
    const next: Settings = { ...s, theme: v }
    await saveSettings(next)
    s = next
    document.documentElement.setAttribute('data-theme', s.theme ?? 'dark')
  }
  async function onModeChange(v: 'digital'|'circular'): Promise<void> {
    const next: Settings = { ...s, timerMode: v }
    await saveSettings(next)
    s = next
  }
  async function onSizeChange(v: 's'|'m'|'l'): Promise<void> {
    const next: Settings = { ...s, timerSize: v }
    await saveSettings(next)
    s = next
  }
  async function onTabsPlacement(v: 'top'|'bottom'): Promise<void> {
    const next: Settings = { ...s, tabsPlacement: v }
    await saveSettings(next)
    s = next
  }
  async function onGlassEffect(v: 'off'|'acrylic'|'mica'): Promise<void> {
    const next: Settings = { ...s, glassEffect: v }
    await saveSettings(next)
    s = next
    await applyWindowEffect(v)
  }
  async function onGlassIntensity(v: 'low'|'medium'|'high'): Promise<void> {
    const next: Settings = { ...s, glassIntensity: v }
    await saveSettings(next)
    s = next
    applyGlassIntensity(v)
  }
  async function onAlwaysOnTop(flag: boolean): Promise<void> {
    const next: Settings = { ...s, alwaysOnTop: flag }
    await saveSettings(next)
    s = next
    try {
      const wmod = await import('@tauri-apps/api/window') as any
      const win = wmod?.appWindow ?? (typeof wmod?.getCurrentWindow === 'function' ? wmod.getCurrentWindow() : null)
      if (win) await win.setAlwaysOnTop(flag)
    } catch {}
  }
  let unlistenResize: (() => void) | null = null
  let unlistenMove: (() => void) | null = null
  async function startWindowStateListeners(): Promise<void> {
    try {
      const wmod = await import('@tauri-apps/api/window') as any
      const win = wmod?.appWindow ?? (typeof wmod?.getCurrentWindow === 'function' ? wmod.getCurrentWindow() : null)
      if (!win) return
      const offR = await win.onResized(async () => { await snapshotBounds() })
      const offM = await win.onMoved(async () => { await snapshotBounds() })
      unlistenResize = typeof offR === 'function' ? offR : (offR?.unlisten as (() => void) | undefined) ?? null
      unlistenMove = typeof offM === 'function' ? offM : (offM?.unlisten as (() => void) | undefined) ?? null
    } catch {}
  }
  async function stopWindowStateListeners(): Promise<void> {
    try { unlistenResize?.(); unlistenMove?.(); unlistenResize = null; unlistenMove = null } catch {}
  }
  async function snapshotBounds(): Promise<void> {
    try {
      const wmod = await import('@tauri-apps/api/window') as any
      const win = wmod?.appWindow ?? (typeof wmod?.getCurrentWindow === 'function' ? wmod.getCurrentWindow() : null)
      if (!win) return
      const size = await win.outerSize()
      const pos = await win.outerPosition()
      const next: Settings = { ...s, windowBounds: { x: pos.x, y: pos.y, width: size.width, height: size.height } }
      await saveSettings(next)
      s = next
    } catch {}
  }
  async function onRememberWindowState(flag: boolean): Promise<void> {
    const next: Settings = { ...s, rememberWindowState: flag }
    await saveSettings(next)
    s = next
    if (flag) { await startWindowStateListeners(); await snapshotBounds() } else { await stopWindowStateListeners() }
  }
  function glassChange(e: Event): void { const el = e.target as HTMLSelectElement; void onGlassEffect(el.value as any) }
  function glassIntensityChange(e: Event): void { const el = e.target as HTMLSelectElement; void onGlassIntensity(el.value as any) }
  function themeChange(e: Event): void { const el = e.target as HTMLSelectElement; void onThemeChange(el.value as any) }
  function modeChange(e: Event): void { const el = e.target as HTMLSelectElement; void onModeChange(el.value as any) }
  function sizeChange(e: Event): void { const el = e.target as HTMLSelectElement; void onSizeChange(el.value as any) }
  function tabsPlacementChange(e: Event): void { const el = e.target as HTMLSelectElement; void onTabsPlacement(el.value as any) }
  function alwaysOnTopChange(e: Event): void { const el = e.target as HTMLInputElement; void onAlwaysOnTop(Boolean(el.checked)) }
  function rememberWindowChange(e: Event): void { const el = e.target as HTMLInputElement; void onRememberWindowState(Boolean(el.checked)) }
  async function installApp(): Promise<void> {
    if (deferred) {
      try { await deferred.prompt(); await deferred.userChoice } catch {}
      deferred = null
      return
    }
    await openExternal()
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted'|'dismissed' }>
  }

  
</script>

<div class="card settings">
  <div class="title">Settings</div>
  <div class="row">
    <span>Theme</span>
    <select class="select" bind:value={s.theme} on:change={themeChange}>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
      <option value="amoled">AMOLED</option>
    </select>
  </div>
  <div class="row">
    <span>Timer Mode</span>
    <select class="select" bind:value={s.timerMode} on:change={modeChange}>
      <option value="digital">Digital</option>
      <option value="circular">Circular</option>
    </select>
  </div>
  <div class="row">
    <span>Timer Size</span>
    <select class="select" bind:value={s.timerSize} on:change={sizeChange}>
      <option value="s">Small</option>
      <option value="m">Medium</option>
      <option value="l">Large</option>
    </select>
  </div>
  <div class="row">
    <span>Tabs Placement</span>
    <select class="select" bind:value={s.tabsPlacement} on:change={tabsPlacementChange}>
      <option value="top">Top</option>
      <option value="bottom">Bottom</option>
    </select>
  </div>
  <div class="row">
    <span>Install</span>
    <button class="btn secondary" on:click={installApp}>Install App</button>
  </div>
  <div class="row">
    <span>Window Effect</span>
    <select class="select" bind:value={s.glassEffect} on:change={glassChange}>
      <option value="off">Off</option>
      <option value="acrylic">Acrylic</option>
      <option value="mica">Mica</option>
    </select>
  </div>
  <div class="row">
    <span>Glass Intensity</span>
    <select class="select" bind:value={s.glassIntensity} on:change={glassIntensityChange}>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  </div>
  <div class="row">
    <span>Always on Top</span>
    <input class="switch" type="checkbox" checked={Boolean(s.alwaysOnTop)} on:change={alwaysOnTopChange} />
  </div>
  <div class="row">
    <span>Remember Window Size/Position</span>
    <input class="switch" type="checkbox" checked={Boolean(s.rememberWindowState)} on:change={rememberWindowChange} />
  </div>
</div>

<style>
  .settings{display:flex;flex-direction:column;gap:10px}
  .title{font-weight:800;margin-bottom:8px}
  .row{display:flex;justify-content:space-between;align-items:center}
  .select{background:#0f172a;color:#e2e8f0;border:1px solid #1f2937;border-radius:8px;padding:6px 8px}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700}
  .btn.secondary{background:#1f2937}
  .switch{appearance:none;width:42px;height:22px;background:#1f2937;border:1px solid #334155;border-radius:999px;position:relative;cursor:pointer}
  .switch:after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:999px;background:#e2e8f0;transition:left .15s ease}
  .switch:checked{background:#0ea5e9;border-color:transparent}
  .switch:checked:after{left:22px;background:#001018}
</style>
