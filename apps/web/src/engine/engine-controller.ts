import { appConstants } from '@cadence/core-domain/constants'
import type { Settings } from '@cadence/core-domain/settings'
import { FocusTimer } from '@cadence/core-domain/focus-timer'
import { ScheduleEngine } from '@cadence/core-domain/schedule-engine'
import type { SessionTemplate, SessionBlock } from '@cadence/core-domain/session-template'
import { notify } from '@cadence/notifications/notifier'
import { beep, chime } from '../services/audio'

export type TransportState = 'idle'|'running'|'paused'

export interface UiApi {
  setTime: (ms: number) => void
  onStart: (cb: () => void) => void
  onPause: (cb: () => void) => void
  onReset: (cb: (mins: number) => void) => void
  setBlockLabels: (now: string | null, next: string | null, type?: SessionBlock['type']) => void
  setTotal: (ms: number) => void
  setTransport: (state: TransportState) => void
  pulseBlock: () => void
}

export function wireEngineAndTimer(args: { ui: UiApi; prefs: Settings; defaultMinutes: number; onActiveLabelChange?: (label: string | null) => void; onBlockTypeChange?: (t: SessionBlock['type']) => void }): {
  startWithTemplate: (tpl: SessionTemplate) => void
  timer: FocusTimer
  setPrefs: (p: Settings) => void
  hasEngine: () => boolean
  startOrResume: () => void
  pauseCurrent: () => void
  skip: () => void
  extend: (minutes: number) => void
} {
  const { ui, onActiveLabelChange, onBlockTypeChange } = args
  let prefs: Settings = { ...args.prefs }
  const initialMs = (prefs.sessionMinutes ?? args.defaultMinutes) * appConstants.msPerMinute
  const timer = new FocusTimer({ durationMs: initialMs, onTick: (ms: number) => ui.setTime(ms) })
  ;(window as unknown as { __timer?: FocusTimer }).__timer = timer
  ui.setTotal(initialMs)
  ui.onStart(() => timer.start())
  ui.onPause(() => timer.pause())
  ui.onReset((mins) => { const ms = mins * appConstants.msPerMinute; ui.setTotal(ms); timer.reset({ durationMs: ms }) })
  ui.setTime(timer.remainingMs())
  ui.setTransport('idle')

  let engine: ScheduleEngine | null = null
  let activeLabel: string | null = null

  const startWithTemplate = (tpl: SessionTemplate): void => {
      engine?.reset()
      engine = new ScheduleEngine({
        template: tpl,
        events: {
          onBlockStart: (_i, b) => {
            activeLabel = b.label
            if (onActiveLabelChange) onActiveLabelChange(activeLabel)
            ui.setBlockLabels(b.label, engine?.nextBlock()?.label ?? null, b.type)
            ui.setTotal(b.durationMinutes * appConstants.msPerMinute)
            ui.pulseBlock()
            if (onBlockTypeChange) onBlockTypeChange(b.type)
          },
          onTick: (ms) => ui.setTime(ms),
          onBlockEnd: () => {
            if (prefs.soundEnabled) { if ((prefs.soundPack ?? 'beep') === 'chime') chime('end'); else beep(880, 140) }
            if (prefs.notificationsEnabled) notify({ title: 'Block complete', body: 'Next block starting' }).catch(() => {})
          },
          onComplete: () => {
            activeLabel = 'Done'
            if (onActiveLabelChange) onActiveLabelChange(activeLabel)
            ui.setBlockLabels('Done', null)
            ;(window as unknown as { __engine?: ScheduleEngine }).__engine = undefined
            ui.setTransport('idle')
          }
        }
      })
      ;(window as unknown as { __engine?: ScheduleEngine }).__engine = engine
      engine.start()
      // Hook transport controls to engine while running
      ui.onStart(() => engine?.start())
      ui.onPause(() => engine?.pause())
      ui.onReset((_mins: number) => { engine?.reset(); ui.setTransport('idle') })
      ui.setTransport('running')
    
  }

  return {
    startWithTemplate,
    timer,
    setPrefs: (p: Settings) => { prefs = { ...p } },
    hasEngine: () => Boolean(engine),
    startOrResume: () => { if (engine) engine.start(); else timer.start() },
    pauseCurrent: () => { if (engine) engine.pause(); else timer.pause() },
    skip: () => { engine?.skip() },
    extend: (minutes: number) => { if (engine) engine.extend({ minutes }) }
  }
}
