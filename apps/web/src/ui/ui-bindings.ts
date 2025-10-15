import type { Task } from '../core/types'

export interface UIBindings {
  setTime: (ms: number) => void
  onStart: (cb: () => void) => void
  onPause: (cb: () => void) => void
  onReset: (cb: (mins: number) => void) => void
  renderTasks: (list: readonly Task[]) => void
}
