import { writable, type Writable } from 'svelte/store'
import type { Settings } from '@cadence/core-domain/settings'
import { loadSettings } from './settings'

export type EngineState = {
  readonly totalMs: number
  readonly valueMs: number
  readonly running: boolean
}

const ONE_SECOND: number = 1000

const initial: EngineState = { totalMs: 25 * 60 * ONE_SECOND, valueMs: 25 * 60 * ONE_SECOND, running: false }
export const engine: Writable<EngineState> = writable(initial)

let ticker: number | null = null

export async function initEngine(): Promise<void> {
  const s: Settings = await loadSettings()
  const totalMs = Math.max(1, Math.floor((s.sessionMinutes ?? 25)) ) * 60 * ONE_SECOND
  engine.set({ totalMs, valueMs: totalMs, running: false })
}

export function start(): void {
  engine.update((st) => {
    if (st.running) return st
    if (ticker) window.clearInterval(ticker)
    ticker = window.setInterval(() => {
      engine.update((cur) => {
        const next = Math.max(0, cur.valueMs - ONE_SECOND)
        if (next === 0) {
          if (ticker) { window.clearInterval(ticker); ticker = null }
          return { ...cur, valueMs: 0, running: false }
        }
        return { ...cur, valueMs: next }
      })
    }, ONE_SECOND)
    return { ...st, running: true }
  })
}

export function pause(): void {
  if (ticker) { window.clearInterval(ticker); ticker = null }
  engine.update((st) => ({ ...st, running: false }))
}

export function reset(): void {
  pause()
  engine.update((st) => ({ ...st, valueMs: st.totalMs }))
}

export function skip(): void {
  pause()
  engine.update((st) => ({ ...st, valueMs: 0 }))
}

export function extend(ms: number): void {
  engine.update((st) => {
    const minTotal: number = 60_000
    const totalMs: number = Math.max(minTotal, st.totalMs + ms)
    const nextValue: number = Math.max(0, Math.min(totalMs, st.valueMs + ms))
    return { ...st, totalMs, valueMs: nextValue }
  })
}

export function setTotalMs(totalMs: number): void {
  engine.update((st) => ({ ...st, totalMs, valueMs: Math.min(totalMs, st.valueMs) }))
}
