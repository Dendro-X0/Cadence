import type { Settings } from '@cadence/core-domain/settings'
import { FocusRepository } from '@cadence/storage/focus-repository'
import { Platform } from '../utils/platform'
import { ensureNotifyPermission } from '@cadence/notifications/permission'
import { notify } from '@cadence/notifications/notifier'
import { showToast, isInstallAvailable, requestInstall } from '../services/pwa'

export interface SettingsPanelOptions {
  initial: Settings
  onChange?: (next: Settings) => void
}

/**
 * Wire up and hydrate the Settings panel UI.
 */
export function setupSettingsPanel(container: HTMLDivElement, opts: SettingsPanelOptions): { get: () => Settings } {
  let current: Settings = { ...opts.initial }
  const selTheme = container.querySelector<HTMLSelectElement>('#theme')!
  const selMode = container.querySelector<HTMLSelectElement>('#timer-mode')!
  const selTimerSize = container.querySelector<HTMLSelectElement>('#timer-size')!
  const selTabsPlacement = container.querySelector<HTMLSelectElement>('#tabs-placement')!
  const chkMini = container.querySelector<HTMLInputElement>('#mini-toggle')!
  const chkSound = container.querySelector<HTMLInputElement>('#sound-toggle')!
  const selSound = container.querySelector<HTMLSelectElement>('#sound-pack')!
  const chkNotify = container.querySelector<HTMLInputElement>('#notify-toggle')!
  const btnNotifyTest = container.querySelector<HTMLButtonElement>('#notify-test')!
  const chkMiniTrans = container.querySelector<HTMLInputElement>('#mini-trans')!
  const chkPinTop = container.querySelector<HTMLInputElement>('#pin-top')!
  const chkConfirmStart = container.querySelector<HTMLInputElement>('#confirm-start')!
  const inpCountdown = container.querySelector<HTMLInputElement>('#countdown-sec')!
  const inpScStartPause = container.querySelector<HTMLInputElement>('#sc-startpause')!
  const inpScTabTimer = container.querySelector<HTMLInputElement>('#sc-tab-timer')!
  const inpScTabTemplates = container.querySelector<HTMLInputElement>('#sc-tab-templates')!
  const inpScTabSettings = container.querySelector<HTMLInputElement>('#sc-tab-settings')!
  const inpScHelp = container.querySelector<HTMLInputElement>('#sc-help')!
  const selAccent = container.querySelector<HTMLSelectElement>('#accent-preset')!
  const chkCompactHeader = container.querySelector<HTMLInputElement>('#compact-header')!
  const selGlass = container.querySelector<HTMLSelectElement>('#glass-effect')!
  const selDensity = container.querySelector<HTMLSelectElement>('#header-density')!
  const inpRadius = container.querySelector<HTMLInputElement>('#frame-radius')!
  const selShadow = container.querySelector<HTMLSelectElement>('#frame-shadow')!
  const elMini = document.querySelector<HTMLDivElement>('#mini')!
  const btnInstall = container.querySelector<HTMLButtonElement>('#btn-install') || null

  const save = async (next: Settings): Promise<void> => {
    current = { ...next }
    await FocusRepository.saveSettings({ settings: current })
    if (opts.onChange) opts.onChange(current)
  }

  if (btnInstall) {
    const updateInstallBtn = (): void => { if (btnInstall) btnInstall.style.display = isInstallAvailable() ? '' : 'none' }
    window.addEventListener('cadence:install-available', updateInstallBtn)
    updateInstallBtn()
    btnInstall.onclick = async () => {
      const res = await requestInstall()
      if (res === 'accepted') showToast('App installed.');
      else if (res === 'dismissed') showToast('Install dismissed.');
      else showToast('Install not available.')
      updateInstallBtn()
    }
  }

  const hydrate = (s: Settings): void => {
    document.documentElement.setAttribute('data-theme', s.theme ?? 'dark')
    document.documentElement.setAttribute('data-accent', s.accentPreset ?? 'default')
    if (s.compactHeader) document.documentElement.setAttribute('data-compact-header','1'); else document.documentElement.removeAttribute('data-compact-header')
    const density: 'normal'|'compact'|'ultra' = (s.headerDensity ?? (s.compactHeader ? 'compact' : 'normal'))
    document.documentElement.setAttribute('data-header-density', density)
    const radius = Number.isFinite(s.frameRadius ?? 0) ? (s.frameRadius as number) : 16
    document.documentElement.style.setProperty('--frame-radius', `${Math.max(4, Math.min(28, radius))}px`)
    const defaultShadow: 'off'|'light'|'medium'|'strong' = Platform.isDesktop ? 'medium' : 'medium'
    document.documentElement.setAttribute('data-frame-shadow', (s.frameShadow ?? defaultShadow))
    document.documentElement.setAttribute('data-glass', (s.glassEffect ?? 'off'))

    selTheme.value = s.theme ?? 'dark'
    selMode.value = s.timerMode ?? 'digital'
    selTimerSize.value = s.timerSize ?? 'l'
    selTabsPlacement.value = s.tabsPlacement ?? 'top'
    chkMini.checked = Boolean(s.miniWindowEnabled)
    chkSound.checked = Boolean(s.soundEnabled)
    chkNotify.checked = Boolean(s.notificationsEnabled)
    chkMiniTrans.checked = Boolean(s.miniTransparent)
    selSound.value = (s.soundPack ?? 'beep')
    chkPinTop.checked = Boolean(s.pinToTop ?? true)
    chkConfirmStart.checked = Boolean(s.askConfirmBeforeStart ?? true)
    inpCountdown.value = String(Number.isFinite(s.startCountdownSeconds ?? 0) ? (s.startCountdownSeconds ?? 0) : 0)
    inpScStartPause.value = s.shortcutStartPause ?? 'Space'
    inpScTabTimer.value = s.shortcutTimerTab ?? 't'
    inpScTabTemplates.value = s.shortcutTemplatesTab ?? 'e'
    inpScTabSettings.value = s.shortcutSettingsTab ?? 's'
    inpScHelp.value = s.shortcutHelp ?? '?'
    selAccent.value = s.accentPreset ?? 'default'
    chkCompactHeader.checked = Boolean(s.compactHeader)
    selGlass.value = s.glassEffect ?? 'off'
    selDensity.value = (s.headerDensity ?? (s.compactHeader ? 'compact' : 'normal'))
    inpRadius.value = String(Number.isFinite(s.frameRadius ?? 0) ? (s.frameRadius ?? 16) : 16)
    selShadow.value = s.frameShadow ?? 'medium'
    elMini.classList.toggle('show', Boolean(s.miniWindowEnabled))
    if (btnInstall) btnInstall.style.display = isInstallAvailable() ? '' : 'none'
  }

  // Bind handlers
  selTheme.onchange = () => { void save({ ...current, theme: selTheme.value as ('dark'|'light'|'amoled') }) }
  selAccent.onchange = () => { document.documentElement.setAttribute('data-accent', selAccent.value); void save({ ...current, accentPreset: selAccent.value as ('default'|'ocean'|'violet'|'sunset') }) }
  chkCompactHeader.onchange = () => { const next = { ...current, compactHeader: chkCompactHeader.checked }; if (chkCompactHeader.checked) document.documentElement.setAttribute('data-compact-header','1'); else document.documentElement.removeAttribute('data-compact-header'); void save(next) }
  selGlass.onchange = () => { document.documentElement.setAttribute('data-glass', selGlass.value); void save({ ...current, glassEffect: selGlass.value as ('off'|'acrylic') }) }
  selDensity.onchange = () => { document.documentElement.setAttribute('data-header-density', selDensity.value); void save({ ...current, headerDensity: selDensity.value as ('normal'|'compact'|'ultra') }) }
  inpRadius.onchange = () => { const n = Math.max(4, Math.min(28, Math.floor(Number(inpRadius.value) || 16))); inpRadius.value = String(n); document.documentElement.style.setProperty('--frame-radius', `${n}px`); void save({ ...current, frameRadius: n }) }
  selShadow.onchange = () => { document.documentElement.setAttribute('data-frame-shadow', selShadow.value); void save({ ...current, frameShadow: selShadow.value as ('off'|'light'|'medium'|'strong') }) }

  selMode.onchange = () => { void save({ ...current, timerMode: selMode.value as ('digital'|'circular') }) }
  selTimerSize.onchange = () => { void save({ ...current, timerSize: selTimerSize.value as ('s'|'m'|'l') }) }
  // Tabs placement onchange is handled by tabs.ts, but keep hydration

  chkMini.onchange = async () => {
    const enabled = chkMini.checked
    elMini.classList.toggle('show', enabled)
    await save({ ...current, miniWindowEnabled: enabled })
    try {
      if (Platform.isDesktop) {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow') as typeof import('@tauri-apps/api/webviewWindow')
        const existing = WebviewWindow.getByLabel ? WebviewWindow.getByLabel('mini') : undefined
        if (enabled) { if (!existing) new WebviewWindow('mini', { width: 240, height: 90, decorations: false, resizable: false, alwaysOnTop: true, transparent: Boolean(current.miniTransparent), url: '/?mini=1' }) }
        else { if (existing) existing.close() }
      }
    } catch {}
  }
  chkMiniTrans.onchange = async () => {
    await save({ ...current, miniTransparent: chkMiniTrans.checked })
    try {
      if (Platform.isDesktop && current.miniWindowEnabled) {
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow') as typeof import('@tauri-apps/api/webviewWindow')
        const existing = WebviewWindow.getByLabel ? WebviewWindow.getByLabel('mini') : undefined
        if (existing) await existing.close()
        new WebviewWindow('mini', { width: 240, height: 90, decorations: false, resizable: false, alwaysOnTop: true, transparent: Boolean(current.miniTransparent), url: '/?mini=1' })
      }
    } catch {}
  }

  chkSound.onchange = () => { void save({ ...current, soundEnabled: chkSound.checked }) }
  selSound.onchange = () => { void save({ ...current, soundPack: selSound.value as ('beep'|'chime') }) }
  chkPinTop.onchange = () => { void save({ ...current, pinToTop: chkPinTop.checked }) }
  chkConfirmStart.onchange = () => { void save({ ...current, askConfirmBeforeStart: chkConfirmStart.checked }) }
  inpCountdown.onchange = () => { const n = Math.max(0, Math.min(10, Math.floor(Number(inpCountdown.value) || 0))); inpCountdown.value = String(n); void save({ ...current, startCountdownSeconds: n }) }

  inpScStartPause.onchange = () => { void save({ ...current, shortcutStartPause: inpScStartPause.value }) }
  inpScTabTimer.onchange = () => { void save({ ...current, shortcutTimerTab: inpScTabTimer.value }) }
  inpScTabTemplates.onchange = () => { void save({ ...current, shortcutTemplatesTab: inpScTabTemplates.value }) }
  inpScTabSettings.onchange = () => { void save({ ...current, shortcutSettingsTab: inpScTabSettings.value }) }
  inpScHelp.onchange = () => { void save({ ...current, shortcutHelp: inpScHelp.value }) }

  btnNotifyTest.onclick = async () => {
    const granted = await ensureNotifyPermission()
    if (!granted) { showToast('Notifications permission denied'); return }
    await notify({ title: 'Cadence: Test', body: 'Notification test' })
  }
  chkNotify.onchange = async () => {
    if (chkNotify.checked) {
      const proceed = window.confirm('Enable system notifications? You can change this later in Settings.')
      if (!proceed) { chkNotify.checked = false; return }
      const granted = await ensureNotifyPermission()
      if (!granted) { chkNotify.checked = false; showToast('Notifications permission denied'); return }
    }
    await save({ ...current, notificationsEnabled: chkNotify.checked })
  }

  hydrate(current)

  return { get: () => current }
}
