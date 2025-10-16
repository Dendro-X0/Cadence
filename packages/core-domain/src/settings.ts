export interface Settings {
  readonly sessionMinutes: number
  readonly autoStart: boolean
  readonly notificationsEnabled?: boolean
  readonly soundEnabled?: boolean
  readonly theme?: 'dark' | 'light' | 'amoled'
  readonly timerMode?: 'circular' | 'digital'
  readonly miniWindowEnabled?: boolean
}
