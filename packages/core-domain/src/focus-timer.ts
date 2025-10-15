import { appConstants } from './constants'

type TimerStatus = 'idle' | 'running' | 'paused'

/**
 * FocusTimer implements a simple countdown timer.
 */
export class FocusTimer {
  private readonly onTick?: (msRemaining: number) => void
  private readonly onFinish?: () => void
  private durationMs: number
  private startMs: number | null = null
  private elapsedMs: number = 0
  private status: TimerStatus = 'idle'
  private intervalId: number | null = null

  constructor({ durationMs, onTick, onFinish }: { durationMs: number; onTick?: (ms: number) => void; onFinish?: () => void }) {
    this.durationMs = durationMs
    this.onTick = onTick
    this.onFinish = onFinish
  }

  /** Start or resume the countdown timer. */
  start(): void {
    if (this.status === 'running') return
    this.status = 'running'
    this.startMs = performance.now()
    this.intervalId = window.setInterval(() => this.tick(), appConstants.tickIntervalMs)
  }

  /** Pause the countdown timer. */
  pause(): void {
    if (this.status !== 'running') return
    if (this.startMs !== null) this.elapsedMs += performance.now() - this.startMs
    this.startMs = null
    this.status = 'paused'
    if (this.intervalId !== null) window.clearInterval(this.intervalId)
    this.intervalId = null
  }

  /** Reset the timer. */
  reset({ durationMs }: { durationMs?: number } = {}): void {
    if (durationMs !== undefined) this.durationMs = durationMs
    this.startMs = null
    this.elapsedMs = 0
    this.status = 'idle'
    if (this.intervalId !== null) window.clearInterval(this.intervalId)
    this.intervalId = null
    if (this.onTick) this.onTick(this.durationMs)
  }

  /** Milliseconds remaining. */
  remainingMs(): number {
    const runningElapsed = this.startMs ? performance.now() - this.startMs : 0
    const total = this.elapsedMs + runningElapsed
    const left = Math.max(0, Math.round(this.durationMs - total))
    return left
  }

  private tick(): void {
    const left = this.remainingMs()
    if (this.onTick) this.onTick(left)
    if (left <= 0) {
      if (this.intervalId !== null) window.clearInterval(this.intervalId)
      this.intervalId = null
      this.status = 'idle'
      this.startMs = null
      this.elapsedMs = 0
      if (this.onFinish) this.onFinish()
    }
  }
}
