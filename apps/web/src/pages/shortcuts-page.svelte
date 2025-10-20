<script lang="ts">
  import { onMount } from 'svelte'
  import { loadSettings, saveSettings } from '../stores/settings'
  import type { Settings } from '@cadence/core-domain/settings'

  type ShortcutKey = keyof Pick<Settings,
    'shortcutStartPause' | 'shortcutTimerTab' | 'shortcutTemplatesTab' | 'shortcutSettingsTab' | 'shortcutShortcutsTab' | 'shortcutHelp'
  >
  type Row = { readonly key: ShortcutKey; readonly label: string; value: string; editing: boolean; error: string }

  let rows: Row[] = []
  let s: Settings
  const defaults: Record<ShortcutKey, string> = {
    shortcutStartPause: 'Space',
    shortcutTimerTab: 't',
    shortcutTemplatesTab: 'e',
    shortcutSettingsTab: 's',
    shortcutShortcutsTab: 'k',
    shortcutHelp: '?'
  }
  let isMac: boolean = false
  let exampleText: string = ''

  onMount(async () => {
    s = await loadSettings()
    const ua = (navigator.userAgent || '').toLowerCase()
    isMac = ua.includes('mac os') || ua.includes('macos') || ua.includes('darwin')
    exampleText = isMac ? 'Examples: ⌘K, Space, /, ?' : 'Examples: Ctrl+K, Space, /, ?'
    rows = [
      { key: 'shortcutStartPause', label: 'Start/Pause', value: s.shortcutStartPause ?? 'Space', editing: false, error: '' },
      { key: 'shortcutTimerTab', label: 'Timer Tab', value: s.shortcutTimerTab ?? 't', editing: false, error: '' },
      { key: 'shortcutTemplatesTab', label: 'Templates Tab', value: s.shortcutTemplatesTab ?? 'e', editing: false, error: '' },
      { key: 'shortcutSettingsTab', label: 'Settings Tab', value: s.shortcutSettingsTab ?? 's', editing: false, error: '' },
      { key: 'shortcutShortcutsTab', label: 'Shortcuts Tab', value: s.shortcutShortcutsTab ?? 'k', editing: false, error: '' },
      { key: 'shortcutHelp', label: 'Shortcut Help Overlay', value: s.shortcutHelp ?? '?', editing: false, error: '' }
    ]
  })

  function beginEdit(i: number): void {
    rows = rows.map((r, idx) => ({ ...r, editing: idx === i }))
    window.addEventListener('keydown', captureOnce)
  }
  function cancelEdit(): void {
    rows = rows.map((r) => ({ ...r, editing: false, error: '' }))
    window.removeEventListener('keydown', captureOnce)
  }
  async function captureOnce(e: KeyboardEvent): Promise<void> {
    e.preventDefault()
    // Build a normalized display string, e.g. Ctrl+K, Shift+/, Cmd+Enter
    const mods: string[] = []
    if (e.ctrlKey) mods.push('Ctrl')
    if (e.altKey) mods.push('Alt')
    if (e.shiftKey) mods.push('Shift')
    if (e.metaKey) mods.push(isMac ? 'Cmd' : 'Meta')
    let main = e.key
    if (main === ' ') main = 'Space'
    if (main.length === 1) {
      // Keep printable single characters as-is (e.g., '/', '?', 'k')
    } else {
      // Normalize casing for named keys
      const map: Record<string, string> = { escape: 'Escape', esc: 'Escape', enter: 'Enter', return: 'Enter', tab: 'Tab' }
      const low = main.toLowerCase()
      main = map[low] ?? main
    }
    const display = mods.length > 0 ? `${mods.join('+')}+${main}` : main
    rows = rows.map((r) => (r.editing ? ({ ...r, value: display, editing: false }) : r))
    window.removeEventListener('keydown', captureOnce)
    await persist()
  }

  function hasConflict(): boolean {
    const vals = new Map<string, string>()
    for (const r of rows) {
      const k = r.value.toLowerCase()
      if (vals.has(k)) return true
      vals.set(k, r.key)
    }
    return false
  }

  async function persist(): Promise<void> {
    // conflict detection
    if (hasConflict()) {
      rows = rows.map((r) => ({ ...r, error: 'Conflict with another shortcut' }))
      return
    } else {
      rows = rows.map((r) => ({ ...r, error: '' }))
    }
    const next: Settings = {
      ...s,
      shortcutStartPause: rows.find(r => r.key==='shortcutStartPause')?.value ?? s.shortcutStartPause,
      shortcutTimerTab: rows.find(r => r.key==='shortcutTimerTab')?.value ?? s.shortcutTimerTab,
      shortcutTemplatesTab: rows.find(r => r.key==='shortcutTemplatesTab')?.value ?? s.shortcutTemplatesTab,
      shortcutSettingsTab: rows.find(r => r.key==='shortcutSettingsTab')?.value ?? s.shortcutSettingsTab,
      shortcutShortcutsTab: rows.find(r => r.key==='shortcutShortcutsTab')?.value ?? s.shortcutShortcutsTab,
      shortcutHelp: rows.find(r => r.key==='shortcutHelp')?.value ?? s.shortcutHelp
    }
    await saveSettings(next)
    s = next
  }

  async function restoreDefaults(): Promise<void> {
    rows = rows.map((r) => ({ ...r, value: defaults[r.key], error: '' , editing: false }))
    const next: Settings = { ...s, ...defaults }
    await saveSettings(next)
    s = next
  }
</script>

<div class="card shortcuts">
  <div class="title">Shortcut Keys</div>
  <div class="desc">Click a key to change, then press the new key. Conflicts will be highlighted. <span class="hint">{exampleText}</span></div>
  <div class="actions">
    <button class="btn secondary" on:click={() => void restoreDefaults()}>Restore Defaults</button>
  </div>
  <div class="grid">
    {#each rows as r, i}
      <div class="row">
        <div class="label">{r.label}</div>
        <div class="value">
          {#if r.editing}
            <button class="btn editing" on:click={cancelEdit}><span>Press any key...</span></button>
          {:else}
            <button class="btn" on:click={() => beginEdit(i)} aria-label={`Edit ${r.label}`}>
              <kbd class="kbd">{r.value}</kbd>
            </button>
          {/if}
        </div>
      </div>
      {#if r.error}
        <div class="error">{r.error}</div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .shortcuts{display:flex;flex-direction:column;gap:10px}
  .title{font-weight:800;margin-bottom:6px}
  .desc{opacity:.85;margin-bottom:8px}
  .hint{opacity:.9;margin-left:8px}
  .actions{display:flex;justify-content:flex-end;margin-bottom:8px}
  .grid{display:grid;grid-template-columns: 1fr auto; gap:8px;align-items:center}
  .row{display:contents}
  .label{font-weight:600}
  .value{display:flex;justify-content:flex-end}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #334155;padding:6px 10px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
  .btn.secondary{background:#1f2937;color:#e2e8f0;border:1px solid #334155}
  .btn.editing{background:#0ea5e9;color:#001018;border-color:transparent}
  .kbd{padding:2px 8px;border-radius:6px;background:rgba(0,0,0,.35);color:#e2e8f0;font-weight:800;font-size:12px}
  .error{grid-column: 1 / -1; color:#f87171; font-size:12px}
  :global(html[data-theme="light"]) .btn{background:#f1f5f9;color:#0b1220;border-color:#cbd5e1}
  :global(html[data-theme="light"]) .kbd{background:#e2e8f0;color:#0b1220}
  :global(html[data-theme="amoled"]) .btn{background:#0b0b0b;color:#e2e8f0;border-color:#262626}
</style>
