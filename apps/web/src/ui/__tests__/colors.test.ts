import { describe, it, expect } from 'vitest'
import { colorForType } from '../colors'

describe('ui/colors', () => {
  it('colorForType returns known hex for focus', () => {
    expect(colorForType('focus')).toMatch(/^#([0-9a-f]{6})$/i)
  })

  it('colorForType falls back to focus color for unknown types', () => {
    // @ts-expect-error testing fallback path
    expect(colorForType('unknown')).toBe(colorForType('focus'))
  })
})
