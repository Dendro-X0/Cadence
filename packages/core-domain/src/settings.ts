export interface Settings {
  readonly sessionMinutes: number
  readonly autoStart: boolean
  readonly notificationsEnabled?: boolean
  readonly soundEnabled?: boolean
  readonly soundPack?: 'beep' | 'chime'
  readonly theme?: 'dark' | 'light' | 'amoled'
  readonly timerMode?: 'circular' | 'digital'
  readonly miniWindowEnabled?: boolean
  readonly miniTransparent?: boolean
  readonly templatesCollapsed?: boolean
  readonly activeTab?: 'timer' | 'templates' | 'settings'
  readonly tabsPlacement?: 'top' | 'bottom'
  readonly timerSize?: 's' | 'm' | 'l'
  readonly pinnedTemplateNames?: readonly string[]
  readonly pinToTop?: boolean
  readonly askConfirmBeforeStart?: boolean
  readonly startCountdownSeconds?: number
  readonly shortcutStartPause?: string
  readonly shortcutTimerTab?: string
  readonly shortcutTemplatesTab?: string
  readonly shortcutSettingsTab?: string
  readonly shortcutShortcutsTab?: string
  readonly shortcutHelp?: string
  readonly compactHeader?: boolean
  readonly accentPreset?: 'default' | 'ocean' | 'violet' | 'sunset'
  readonly headerDensity?: 'normal' | 'compact' | 'ultra'
  readonly frameRadius?: number
  readonly frameShadow?: 'off' | 'light' | 'medium' | 'strong'
  readonly glassEffect?: 'off' | 'acrylic' | 'mica'
  readonly glassIntensity?: 'low' | 'medium' | 'high'
  readonly alwaysOnTop?: boolean
  readonly rememberWindowState?: boolean
  readonly windowBounds?: WindowBounds
}

/**
 * Window position and size persisted across sessions.
 */
export type WindowBounds = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}
