import type { SessionBlock } from '@cadence/core-domain/session-template'

/**
 * Map block type to accent color in hex.
 */
export function colorForType(type: SessionBlock['type'] | 'custom'): string {
  const map: Record<string, string> = {
    focus: '#38bdf8',
    break: '#22c55e',
    meditation: '#a855f7',
    workout: '#f59e0b',
    rest: '#14b8a6',
    custom: '#60a5fa'
  }
  return map[type] ?? '#38bdf8'
}

/**
 * Update CSS accent variable to match block type.
 */
export function setAccent(type: SessionBlock['type'] | 'custom'): void {
  document.documentElement.style.setProperty('--accent', colorForType(type))
}
