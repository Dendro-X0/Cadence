import { describe, it, expect, beforeEach } from 'vitest'
import { renderQuickChips } from '../templates-chips'
import type { SessionTemplate } from '@cadence/core-domain/session-template'

describe('renderQuickChips', () => {
  let host: HTMLDivElement
  beforeEach(() => {
    host = document.createElement('div')
    document.body.innerHTML = ''
    document.body.appendChild(host)
  })

  const mk = (name: string, mins: number): SessionTemplate => ({ id: name, name, repeat: 1, blocks: [{ label: 'b', durationMinutes: mins, type: 'focus' }] })

  it('renders chips and invokes onStart with correct template', () => {
    const items: SessionTemplate[] = [mk('A', 10), mk('B', 15)]
    let started: string | null = null
    renderQuickChips(host, { items, pinned: [], onStart: (tpl) => { started = tpl.name } })
    const btns = host.querySelectorAll<HTMLButtonElement>('button.chip')
    expect(btns.length).toBe(2)
    btns[1].click()
    expect(started).toBe('B')
  })

  it('adds pinned class to pinned templates', () => {
    const items: SessionTemplate[] = [mk('A', 10), mk('B', 15)]
    renderQuickChips(host, { items, pinned: ['A'], onStart: () => {} })
    const a = host.querySelector<HTMLButtonElement>('button.chip[data-name="A"]')!
    const b = host.querySelector<HTMLButtonElement>('button.chip[data-name="B"]')!
    expect(a.classList.contains('pinned')).toBe(true)
    expect(b.classList.contains('pinned')).toBe(false)
  })

  it('sets title tooltip with total minutes', () => {
    const items: SessionTemplate[] = [mk('A', 10)]
    renderQuickChips(host, { items, pinned: [], onStart: () => {} })
    const a = host.querySelector<HTMLButtonElement>('button.chip[data-name="A"]')!
    expect(a.title).toContain('10')
  })

  it('reports needsMore when items exceed limit', () => {
    const items: SessionTemplate[] = Array.from({ length: 7 }, (_, i) => mk(String(i+1), 5))
    const res = renderQuickChips(host, { items, pinned: [], onStart: () => {}, limit: 6 })
    expect(res.needsMore).toBe(true)
  })
})
