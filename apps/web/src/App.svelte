<script lang="ts">
  import { onMount } from 'svelte'
  import Header from './components/header/header.svelte'
  import PageTabs from './components/tabs/page-tabs.svelte'
  import TimerPage from './pages/timer-page.svelte'
  import SettingsPage from './pages/settings-page.svelte'
  import ShortcutsPage from './pages/shortcuts-page.svelte'
  import TemplatesPage from './pages/templates-page.svelte'
  import { loadSettings } from './stores/settings'
  import { initEngine } from './stores/engine'
  import CountdownOverlay from './components/overlays/countdown.svelte'
  import ShortcutsOverlay from './components/overlays/shortcuts.svelte'
  import ConfirmOverlay from './components/overlays/confirm.svelte'
  import { overlays, hideShortcuts, toggleShortcuts } from './stores/overlays'

  let active: 'timer'|'templates'|'settings'|'shortcuts' = 'timer'
  let isMobile: boolean = false
  function onTabChange(page: 'timer'|'templates'|'settings'|'shortcuts'): void {
    if (isMobile && page === 'shortcuts') return
    active = page
  }

  onMount(async () => {
    const s = await loadSettings()
    document.documentElement.setAttribute('data-theme', s.theme ?? 'dark')
    await initEngine()

    function parseShortcut(spec?: string | null): (e: KeyboardEvent) => boolean {
      const raw = (spec ?? '').trim()
      if (!raw) return () => false
      const parts = raw.split('+').map(p => p.trim().toLowerCase()).filter(Boolean)
      let needCtrl = false, needAlt = false, needShift = false, needMeta = false
      const isMod = (p: string): boolean => {
        if (p === 'ctrl' || p === 'control') { needCtrl = true; return true }
        if (p === 'alt' || p === 'option') { needAlt = true; return true }
        if (p === 'shift') { needShift = true; return true }
        if (p === 'meta' || p === 'cmd' || p === 'command' || p === '⌘') { needMeta = true; return true }
        return false
      }
      const mains = parts.filter(p => !isMod(p))
      const main = (mains[mains.length - 1] ?? '').toLowerCase()
      function matchMain(e: KeyboardEvent): boolean {
        const k = (e.key || '').toLowerCase()
        if (main === '') return false
        if (main === 'space' || main === 'spacebar' || main === ' ') return k === ' ' || k === 'space'
        if (main === 'enter' || main === 'return') return k === 'enter'
        if (main === 'esc' || main === 'escape') return k === 'escape'
        if (main === 'tab') return k === 'tab'
        if (main === '?' ) return k === '?'
        if (main === '/' ) return k === '/' || k === '?'
        return k === main
      }
      return (e: KeyboardEvent): boolean => needCtrl === e.ctrlKey && needAlt === e.altKey && needShift === e.shiftKey && needMeta === e.metaKey && matchMain(e)
    }

    const onStartPause = parseShortcut(s.shortcutStartPause)
    const onTimer = parseShortcut(s.shortcutTimerTab)
    const onTemplates = parseShortcut(s.shortcutTemplatesTab)
    const onSettings = parseShortcut(s.shortcutSettingsTab)
    const onShortcuts = parseShortcut(s.shortcutShortcutsTab)
    const onHelp = parseShortcut(s.shortcutHelp)

    const handler = (e: KeyboardEvent): void => {
      if (onHelp(e)) { e.preventDefault(); toggleShortcuts(); return }
      if (onTimer(e)) { active = 'timer'; hideShortcuts(); return }
      if (onTemplates(e)) { active = 'templates'; hideShortcuts(); return }
      if (onSettings(e)) { active = 'settings'; hideShortcuts(); return }
      if (onShortcuts(e) && !isMobile) { active = 'shortcuts'; hideShortcuts(); return }
      if (onStartPause(e)) {
        // TimerPage handles the action bound to Start/Pause button; we dispatch a custom event
        const ev = new CustomEvent('cadence:startpause')
        window.dispatchEvent(ev)
        hideShortcuts()
      }
    }
    window.addEventListener('keydown', handler)

    // Desktop (Tauri v2): make html/body transparent so the window chrome is fully custom
    try {
      const mod = await import('@tauri-apps/api/window') as any
      if (mod?.appWindow || mod?.getCurrentWindow) {
        document.body.classList.add('tauri-desktop')
        document.documentElement.classList.add('tauri-desktop')
      }
    } catch {}

    // Detect platform to scope CSS effects (Windows uses CSS glass, macOS uses native vibrancy)
    try {
      const root = document.documentElement
      const ua = (navigator.userAgent || '').toLowerCase()
      isMobile = /mobi|android|iphone|ipad/.test(ua)
      if (isMobile && active === 'shortcuts') active = 'settings'
      if (ua.includes('windows')) root.classList.add('platform-windows')
      else if (ua.includes('mac os') || ua.includes('macos') || ua.includes('darwin')) root.classList.add('platform-macos')
    } catch {}
  })
</script>

<div class="frame">
  <Header />
  <div class="container">
    <PageTabs active={active} on:change={(e) => onTabChange(e.detail)} showShortcuts={!isMobile} />
    {#if active === 'timer'}
      <TimerPage />
    {:else if active === 'templates'}
      <TemplatesPage />
    {:else if active === 'settings'}
      <SettingsPage />
    {:else}
      <ShortcutsPage />
    {/if}
  </div>

<CountdownOverlay visible={$overlays.countdownVisible} seconds={$overlays.countdownSeconds} />
<ShortcutsOverlay visible={$overlays.shortcutsVisible} on:close={() => hideShortcuts()} />
<ConfirmOverlay visible={$overlays.confirmVisible} />
</div>

<style>
  :global(html, body, #app){height:100%}
  :global(body){margin:0;font-family:system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;background:var(--bg);color:var(--fg)}
  :global(html.tauri-desktop){background:transparent}
  :global(body.tauri-desktop){background:transparent;overflow:hidden}
  .frame{min-height:100vh;display:flex;flex-direction:column;background:var(--surface-1);border-radius:var(--radius-l);box-shadow:0 24px 80px rgba(0,0,0,.45), 0 2px 16px rgba(0,0,0,.35);margin:0;overflow:hidden}
  .container{max-width:860px;margin:0 auto;padding:24px;width:100%}
  :global(.card){background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-l);padding:var(--space-4)}

  /* Windows CSS glass for Acrylic/Mica (Option A) */
  :global(html.platform-windows){
    --glass-blur: 22px;
    --glass-alpha: .72;
  }
  :global(html.platform-windows.intensity-low){ --glass-blur: 14px; --glass-alpha: .60 }
  :global(html.platform-windows.intensity-medium){ --glass-blur: 22px; --glass-alpha: .72 }
  :global(html.platform-windows.intensity-high){ --glass-blur: 30px; --glass-alpha: .82 }
  :global(html.platform-windows.effect-acrylic) .frame{
    background: rgba(15,23,42,var(--glass-alpha));
    backdrop-filter: blur(var(--glass-blur)) saturate(140%) brightness(1.03);
    border: 1px solid rgba(255,255,255,.06);
  }
  :global(html.platform-windows.effect-mica) .frame{
    background: linear-gradient(180deg, rgba(30,41,59,calc(var(--glass-alpha) + .08)), rgba(14,23,42,var(--glass-alpha)));
    backdrop-filter: blur(calc(var(--glass-blur) + 4px)) saturate(140%) brightness(1.02);
    border: 1px solid rgba(255,255,255,.07);
  }
</style>
