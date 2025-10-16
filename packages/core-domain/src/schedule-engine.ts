import { appConstants } from './constants'
import { FocusTimer } from './focus-timer'
import type { SessionBlock, SessionTemplate } from './session-template'

export type EngineStatus = 'idle' | 'running' | 'paused'

export interface ScheduleEvents {
  readonly onBlockStart?: (index: number, block: SessionBlock) => void
  readonly onTick?: (msRemaining: number) => void
  readonly onBlockEnd?: (index: number, block: SessionBlock) => void
  readonly onComplete?: () => void
}

/**
 * ScheduleEngine runs a template's blocks sequentially with optional repeats.
 */
export class ScheduleEngine {
  private template: SessionTemplate
  private readonly events: ScheduleEvents
  private timer: FocusTimer | null = null
  private blockIndex: number = 0
  private remainingCycles: number
  private status: EngineStatus = 'idle'

  constructor({ template, events }: { template: SessionTemplate; events?: ScheduleEvents }) {
    this.template = template
    this.events = events ?? {}
    this.remainingCycles = Math.max(1, template.repeat ?? 1)
  }

  currentBlock(): SessionBlock {
    return this.template.blocks[this.blockIndex]
  }

  nextBlock(): SessionBlock | null {
    const i = this.blockIndex + 1
    if (i < this.template.blocks.length) return this.template.blocks[i]
    if ((this.remainingCycles - 1) > 0) return this.template.blocks[0]
    return null
  }

  start(): void {
    if (this.status === 'running') return
    if (!this.timer) this.startCurrentBlock()
    else this.timer.start()
    this.status = 'running'
  }

  pause(): void {
    if (this.status !== 'running') return
    this.timer?.pause()
    this.status = 'paused'
  }

  reset({ template }: { template?: SessionTemplate } = {}): void {
    if (template) {
      this.template = template
      this.blockIndex = 0
      this.remainingCycles = Math.max(1, template.repeat ?? 1)
    }
    if (this.timer) this.timer.reset()
    this.timer = null
    this.status = 'idle'
    if (this.events.onTick) {
      const ms = this.currentBlock().durationMinutes * appConstants.msPerMinute
      this.events.onTick(ms)
    }
  }

  skip(): void {
    this.finishBlock()
  }

  extend({ minutes }: { minutes: number }): void {
    if (!this.timer) return
    const extra = Math.max(1, Math.floor(minutes)) * appConstants.msPerMinute
    const newDuration = this.timer.remainingMs() + extra
    this.timer.reset({ durationMs: newDuration })
    this.timer.start()
  }

  private startCurrentBlock(): void {
    const block = this.currentBlock()
    const durationMs = block.durationMinutes * appConstants.msPerMinute
    if (this.events.onBlockStart) this.events.onBlockStart(this.blockIndex, block)
    this.timer = new FocusTimer({
      durationMs,
      onTick: (ms) => this.events.onTick && this.events.onTick(ms),
      onFinish: () => this.finishBlock()
    })
    this.timer.start()
  }

  private finishBlock(): void {
    const block = this.currentBlock()
    if (this.events.onBlockEnd) this.events.onBlockEnd(this.blockIndex, block)
    this.timer = null
    this.blockIndex++
    if (this.blockIndex >= this.template.blocks.length) {
      this.blockIndex = 0
      this.remainingCycles--
      if (this.remainingCycles <= 0) {
        this.status = 'idle'
        if (this.events.onComplete) this.events.onComplete()
        return
      }
    }
    this.startCurrentBlock()
  }
}
