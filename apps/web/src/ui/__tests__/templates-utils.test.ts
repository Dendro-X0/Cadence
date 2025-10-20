import { describe, it, expect } from 'vitest'
import { totalMinutes, escapeHtml, dominantType } from '../templates-utils'

describe('templates-utils', () => {
  it('totalMinutes computes minutes including repeat', () => {
    const tpl = { blocks: [{ durationMinutes: 10 }, { durationMinutes: 5 }], repeat: 3 }
    expect(totalMinutes(tpl)).toBe(45)
  })

  it('totalMinutes handles missing repeat as 1', () => {
    const tpl = { blocks: [{ durationMinutes: 7 }, { durationMinutes: 8 }] }
    expect(totalMinutes(tpl)).toBe(15)
  })

  it('escapeHtml escapes special characters', () => {
    expect(escapeHtml('<div>"x" & y\'s</div>')).toBe('&lt;div&gt;&quot;x&quot; &amp; y&#39;s&lt;/div&gt;')
  })

  it('dominantType returns the type with greatest total minutes', () => {
    const tpl = { blocks: [
      { durationMinutes: 15, type: 'focus' as const },
      { durationMinutes: 10, type: 'break' as const },
      { durationMinutes: 20, type: 'meditation' as const }
    ] }
    expect(dominantType(tpl)).toBe('meditation')
  })

  it('dominantType returns custom when custom dominates', () => {
    const tpl = { blocks: [
      { durationMinutes: 5, type: 'focus' as const },
      { durationMinutes: 30, type: 'custom' as const }
    ] }
    expect(dominantType(tpl)).toBe('custom')
  })
})
