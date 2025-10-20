
/**
 * Compute total minutes for a template including repeat.
 */
export function totalMinutes(tpl: { blocks: readonly { durationMinutes: number }[]; repeat?: number }): number {
  const per = tpl.blocks.reduce((acc, b) => acc + b.durationMinutes, 0)
  return Math.round(per * (tpl.repeat ?? 1))
}

/** Escape a string for HTML text nodes/attributes. */
export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

import type { SessionBlock } from '@cadence/core-domain/session-template'

/**
 * Determine the dominant block type in a template (by total minutes).
 */
export function dominantType(tpl: { blocks: readonly { durationMinutes: number; type: SessionBlock['type'] }[] }): SessionBlock['type'] | 'custom' {
  const totals: Record<'focus'|'break'|'meditation'|'workout'|'rest'|'custom', number> = { focus: 0, break: 0, meditation: 0, workout: 0, rest: 0, custom: 0 }
  tpl.blocks.forEach((b) => { totals[b.type] = (totals[b.type] ?? 0) + b.durationMinutes })
  let best: keyof typeof totals = 'focus'
  let bestVal = -1
  for (const k in totals) {
    const key = k as keyof typeof totals
    const v = totals[key]
    if (v > bestVal) { bestVal = v; best = key }
  }
  return best
}
