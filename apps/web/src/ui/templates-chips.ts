import type { SessionTemplate } from '@cadence/core-domain/session-template'
import { dominantType } from './templates-utils'
import { colorForType } from './colors'
import { totalMinutes, escapeHtml } from './templates-utils'

export function renderQuickChips(host: HTMLDivElement, args: {
  items: readonly SessionTemplate[]
  pinned: readonly string[]
  onStart: (tpl: SessionTemplate) => void
  limit?: number
}): { needsMore: boolean } {
  const LIMIT = args.limit ?? 6
  const html = args.items.map((t, i) => {
    const dom = dominantType(t)
    const color = colorForType(dom)
    const total = totalMinutes(t)
    const isPinned = args.pinned.includes(t.name)
    const hotkey = i < 9 ? ` [${i+1}]` : ''
    return `<button class="chip${isPinned ? ' pinned' : ''}" data-name="${t.name}" title="${total} min total" style="background:${color};color:#001018">${isPinned ? '<span class=\'pin-ico\'>★</span>' : ''}${escapeHtml(t.name)}${hotkey}</button>`
  }).join(' ')
  host.innerHTML = html
  Array.from(host.querySelectorAll<HTMLButtonElement>('.chip')).forEach((c) => { c.classList.add('pop'); window.setTimeout(() => c.classList.remove('pop'), 400) })
  Array.from(host.querySelectorAll<HTMLButtonElement>('.chip')).forEach((btn) => {
    btn.onclick = () => {
      const name = btn.dataset.name
      const tpl = args.items.find((t) => t.name === name)
      if (tpl) args.onStart(tpl)
    }
  })
  return { needsMore: args.items.length > LIMIT }
}
