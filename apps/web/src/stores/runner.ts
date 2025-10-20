import { writable, type Writable, get } from 'svelte/store'
import type { SessionTemplate, SessionBlock } from '@cadence/core-domain/session-template'
import { engine, setTotalMs as engSetTotal, reset as engReset, start as engStart, pause as engPause } from './engine'

export type Segment = { readonly label: string; readonly type: SessionBlock['type']; readonly ms: number }
export type RunnerState = {
  readonly active: boolean
  readonly index: number
  readonly segments: readonly Segment[]
}

const runnerStore: Writable<RunnerState> = writable({ active: false, index: 0, segments: [] })
export const runner: Writable<RunnerState> = runnerStore

/**
 * Build segments list from template (applies repeat) in milliseconds.
 */
function buildSegments(t: SessionTemplate): readonly Segment[] {
  const list: Segment[] = []
  const repeat = Math.max(1, Math.floor(Number(t.repeat ?? 1)))
  for (let r = 0; r < repeat; r++) {
    for (const b of t.blocks) {
      const ms = Math.max(0, Math.floor(b.durationMinutes)) * 60_000
      if (ms <= 0) continue
      list.push({ label: b.label, type: b.type, ms })
    }
  }
  return list
}

/**
 * Start a segmented run from a template. Resets engine to the first segment and starts ticking.
 */
export async function startTemplate(t: SessionTemplate): Promise<void> {
  const segs = buildSegments(t)
  if (segs.length === 0) return
  runnerStore.set({ active: true, index: 0, segments: segs })
  engSetTotal(segs[0].ms)
  engReset()
  engStart()
}

/** Move to next segment; if last, stop runner and pause engine. */
export function nextSegment(): void {
  runnerStore.update((st) => {
    if (!st.active) return st
    const nextIdx = st.index + 1
    if (nextIdx >= st.segments.length) {
      engPause()
      return { ...st, active: false }
    }
    const seg = st.segments[nextIdx]
    engSetTotal(seg.ms)
    engReset()
    engStart()
    return { ...st, index: nextIdx }
  })
}

/** Stop the current segmented run; engine is paused. */
export function stopRunner(): void { engPause(); runnerStore.set({ active: false, index: 0, segments: [] }) }

// Auto-advance on engine completion
engine.subscribe((e) => {
  if (e.valueMs === 0 && e.running === false) {
    const local = get(runnerStore)
    if (local.active) {
      if (local.index < local.segments.length - 1) nextSegment()
      else stopRunner()
    }
  }
})
