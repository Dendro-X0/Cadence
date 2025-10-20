import { writable, type Writable } from 'svelte/store'
import type { Settings } from '@cadence/core-domain/settings'
import { FocusRepository } from '@cadence/storage/focus-repository'
import { appConstants } from '@cadence/core-domain/constants'

export const settings: Writable<Settings> = writable({} as Settings)

export async function loadSettings(): Promise<Settings> {
  const defaults: Settings = {
    sessionMinutes: appConstants.defaultSessionMinutes,
    autoStart: false,
    notificationsEnabled: false,
    soundEnabled: false,
    soundPack: 'beep',
    theme: 'dark',
    timerMode: 'digital',
    miniWindowEnabled: false,
    miniTransparent: false,
    templatesCollapsed: false,
    activeTab: 'timer',
    tabsPlacement: 'top',
    timerSize: 'l',
    pinnedTemplateNames: [],
    pinToTop: false,
    askConfirmBeforeStart: false,
    startCountdownSeconds: 0,
    shortcutStartPause: 'Space',
    shortcutTimerTab: 't',
    shortcutTemplatesTab: 'e',
    shortcutSettingsTab: 's',
    shortcutShortcutsTab: 'k',
    shortcutHelp: '?',
    compactHeader: false,
    accentPreset: 'default',
    headerDensity: 'normal',
    frameRadius: 16,
    frameShadow: 'medium',
    glassEffect: 'off',
    glassIntensity: 'medium',
    alwaysOnTop: false,
    rememberWindowState: false
  }
  const { settings: s } = await FocusRepository.loadSettings(defaults)
  settings.set(s)
  return s
}

export async function saveSettings(next: Settings): Promise<void> {
  await FocusRepository.saveSettings({ settings: next })
  settings.set(next)
}
