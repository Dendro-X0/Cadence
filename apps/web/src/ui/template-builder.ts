import type { SessionBlock, SessionTemplate } from '@cadence/core-domain/session-template'
import { FocusRepository } from '@cadence/storage/focus-repository'
import { showToast } from '../services/pwa'
import { colorForType } from './colors'

/**
 * Wire the Template Builder panel inside the Templates page.
 * Expects the following IDs to exist in DOM: #tpl-name, #tpl-duration, #tpl-repeat,
 * #tpl-save, #tpl-add, #tpl-blocks, #tpl-total.
 */
export function setupTemplateBuilder(): void {
  const nameEl = document.querySelector<HTMLInputElement>('#tpl-name')!
  const durEl = document.querySelector<HTMLInputElement>('#tpl-duration')!
  const repEl = document.querySelector<HTMLInputElement>('#tpl-repeat')!
  const btnSave = document.querySelector<HTMLButtonElement>('#tpl-save')!
  const btnAdd = document.querySelector<HTMLButtonElement>('#tpl-add')!
  const list = document.querySelector<HTMLDivElement>('#tpl-blocks')!
  const totalEl = document.querySelector<HTMLDivElement>('#tpl-total')!

  const expWrap = document.createElement('div')
  expWrap.style.cssText = 'margin-top:8px;display:flex;gap:8px;'
  const btnExport = document.createElement('button')
  btnExport.className = 'btn secondary'
  btnExport.textContent = 'Export Templates'
  const btnImport = document.createElement('button')
  btnImport.className = 'btn secondary'
  btnImport.textContent = 'Import Templates'
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'application/json'
  fileInput.style.display = 'none'
  expWrap.appendChild(btnExport); expWrap.appendChild(btnImport); expWrap.appendChild(fileInput)
  list.parentElement?.appendChild(expWrap)

  let blocks: SessionBlock[] = []
  const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n))
  const totalMinutesLocal = (): number => {
    const per = blocks.reduce((acc, b) => acc + b.durationMinutes, 0)
    const repeat = clamp(Math.floor(Number(repEl.value)||1), 1, 12)
    return Math.round(per * repeat)
  }
  const updateTotal = (): void => { totalEl.textContent = `Total: ${totalMinutesLocal()} min` }

  const render = (): void => {
    list.innerHTML = ''
    blocks.forEach((b, i) => {
      const row = document.createElement('div')
      row.className = 'task-row'
      row.style.alignItems = 'center'
      row.style.borderLeft = `4px solid ${colorForType(b.type)}`
      row.innerHTML = `
        <span class="drag" title="Drag" style="cursor:grab;user-select:none;padding:0 6px;">≡</span>
        <input class="blk-mins" type="number" min="1" max="180" value="${b.durationMinutes}" style="width:90px" />
        <input class="blk-label input" placeholder="Label" value="${escapeHtml(b.label)}" style="flex:1" />
        <select class="blk-type select">
          <option value="focus" ${b.type==='focus'?'selected':''}>Focus</option>
          <option value="break" ${b.type==='break'?'selected':''}>Break</option>
          <option value="meditation" ${b.type==='meditation'?'selected':''}>Meditation</option>
          <option value="workout" ${b.type==='workout'?'selected':''}>Workout</option>
          <option value="rest" ${b.type==='rest'?'selected':''}>Rest</option>
          <option value="custom" ${b.type==='custom'?'selected':''}>Custom</option>
        </select>
        <button class="btn secondary" data-up>↑</button>
        <button class="btn secondary" data-down>↓</button>
        <button class="btn secondary" data-del>Remove</button>
      `
      const drag = row.querySelector<HTMLSpanElement>('span.drag')!
      drag.draggable = true
      drag.ondragstart = (ev: DragEvent) => { ev.dataTransfer?.setData('text/plain', String(i)) }
      row.ondragover = (ev: DragEvent) => { ev.preventDefault() }
      row.ondrop = (ev: DragEvent) => {
        ev.preventDefault()
        const from = Number(ev.dataTransfer?.getData('text/plain') || '-1')
        const to = i
        if (!Number.isNaN(from) && from >= 0 && from !== to) {
          const updated: SessionBlock[] = [...blocks]
          const [moved] = updated.splice(from, 1)
          updated.splice(to, 0, moved)
          blocks = updated
          render(); updateTotal()
        }
      }
      const mins = row.querySelector<HTMLInputElement>('.blk-mins')!
      const label = row.querySelector<HTMLInputElement>('.blk-label')!
      const type = row.querySelector<HTMLSelectElement>('.blk-type')!
      mins.onchange = () => { blocks[i] = { ...blocks[i], durationMinutes: clamp(Math.floor(Number(mins.value)||1), 1, 180) }; updateTotal() }
      label.oninput = () => { blocks[i] = { ...blocks[i], label: label.value } }
      type.onchange = () => { blocks[i] = { ...blocks[i], type: type.value as SessionBlock['type'] }; row.style.borderLeft = `4px solid ${colorForType(blocks[i].type)}` }
      row.querySelector<HTMLButtonElement>('[data-up]')!.onclick = () => { if (i>0) { const t=blocks[i-1]; blocks[i-1]=blocks[i]; blocks[i]=t; render(); updateTotal() } }
      row.querySelector<HTMLButtonElement>('[data-down]')!.onclick = () => { if (i<blocks.length-1) { const t=blocks[i+1]; blocks[i+1]=blocks[i]; blocks[i]=t; render(); updateTotal() } }
      row.querySelector<HTMLButtonElement>('[data-del]')!.onclick = () => { blocks = blocks.filter((_,j)=>j!==i); render(); updateTotal() }
      list.appendChild(row)
    })
  }

  btnAdd.onclick = () => { blocks = [...blocks, { label: 'Block', durationMinutes: clamp(Math.floor(Number(durEl.value)||5),1,180), type: 'custom' }]; render(); updateTotal() }

  btnSave.onclick = async () => {
    const name = nameEl.value.trim()
    const repeat = clamp(Math.floor(Number(repEl.value)||1), 1, 12)
    let outBlocks = blocks
    if (outBlocks.length === 0) {
      const mins = clamp(Math.floor(Number(durEl.value)||0), 1, 180)
      if (!name || !mins) return
      outBlocks = [{ label: 'Block', durationMinutes: mins, type: 'custom' }]
    } else if (!name) {
      return
    }
    const tpl: SessionTemplate = { id: crypto.randomUUID(), name, blocks: outBlocks, repeat }
    await FocusRepository.saveTemplate({ tpl })
    showToast('Template saved.')
    nameEl.value = ''
    durEl.value = ''
    repEl.value = '1'
    blocks = []
    render(); updateTotal()
  }

  render(); updateTotal()
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
