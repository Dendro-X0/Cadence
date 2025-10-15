import './styles.css'
import { appConstants } from '@cadence/core-domain/constants'
import type { Task } from '@cadence/core-domain/task'
import type { Settings } from '@cadence/core-domain/settings'
import { FocusTimer } from '@cadence/core-domain/focus-timer'
import { TaskManager } from './core/task-manager'
import { FocusRepository } from '@cadence/storage/focus-repository'
import { builtInTemplates } from '@cadence/templates/defaults'
import { setupPwa, showToast } from './pwa'
import type { SessionTemplate } from '@cadence/core-domain/session-template'

const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
const toTime = (ms: number): string => {
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${pad(m)}:${pad(s)}`
}

const defaults: Settings = { sessionMinutes: appConstants.defaultSessionMinutes, autoStart: false }

async function main(): Promise<void> {
  setupPwa()
  const { settings } = await FocusRepository.loadSettings(defaults)
  const tm = new TaskManager()
  const ui = buildUI({ settings, tm })
  const timer = new FocusTimer({ durationMs: settings.sessionMinutes * appConstants.msPerMinute, onTick: (ms: number) => ui.setTime(ms) })
  ui.onStart(() => timer.start())
  ui.onPause(() => timer.pause())
  ui.onReset((mins) => timer.reset({ durationMs: mins * appConstants.msPerMinute }))
  ui.setTime(timer.remainingMs())
  const { tasks } = await tm.list()
  ui.renderTasks(tasks)
  // Templates Gallery
  const gallery = document.querySelector<HTMLDivElement>('#templates')!
  renderTemplatesGallery(gallery)
  // Builder
  bindTemplateBuilder()
}

function buildUI({ settings, tm }: { settings: Settings; tm: TaskManager }) {
  const root = document.querySelector<HTMLDivElement>('#app')!
  const container = document.createElement('div')
  container.className = 'container'
  container.innerHTML = `
    <div class="header">
      <div class="brand"><img class="brand__logo" src="/favicon.svg" alt=""/><span class="brand__title">Focus Motive</span></div>
      <div class="settings"><label for="minutes">Minutes</label><input id="minutes" class="input" type="number" min="${appConstants.minSessionMinutes}" max="${appConstants.maxSessionMinutes}" /></div>
    </div>
    <div class="card timer">
      <div class="time" id="time">00:00</div>
      <div class="controls">
        <button id="start" class="btn">Start</button>
        <button id="pause" class="btn secondary">Pause</button>
        <button id="reset" class="btn secondary">Reset</button>
      </div>
    </div>
    <div class="card tasks">
      <div style="display:flex;gap:8px;align-items:center;">
        <input id="new-task" class="input" placeholder="New task..." />
        <button id="add-task" class="btn">Add</button>
      </div>
      <div id="task-list"></div>
    </div>
    <div class="card" id="templates">
      <div style="font-weight:700;margin-bottom:8px;">Templates</div>
      <div id="template-list"></div>
      <div style="margin-top:12px;border-top:1px solid #1f2937;padding-top:12px;">
        <div style="font-weight:700;margin-bottom:8px;">New Custom Template</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="tpl-name" class="input" placeholder="Name" style="width:180px" />
          <input id="tpl-duration" class="input" type="number" min="1" max="180" placeholder="Minutes" style="width:120px" />
          <input id="tpl-repeat" class="input" type="number" min="1" max="12" value="1" style="width:100px" />
          <button id="tpl-save" class="btn">Save Template</button>
        </div>
      </div>
    </div>
  `
  root.appendChild(container)
  const elTime = container.querySelector<HTMLDivElement>('#time')!
  const elMinutes = container.querySelector<HTMLInputElement>('#minutes')!
  const elStart = container.querySelector<HTMLButtonElement>('#start')!
  const elPause = container.querySelector<HTMLButtonElement>('#pause')!
  const elReset = container.querySelector<HTMLButtonElement>('#reset')!
  const elNewTask = container.querySelector<HTMLInputElement>('#new-task')!
  const elAddTask = container.querySelector<HTMLButtonElement>('#add-task')!
  const elTaskList = container.querySelector<HTMLDivElement>('#task-list')!
  elMinutes.value = String(settings.sessionMinutes)
  const setTime = (ms: number): void => { elTime.textContent = toTime(ms) }
  const onStart = (cb: () => void): void => { elStart.onclick = () => cb() }
  const onPause = (cb: () => void): void => { elPause.onclick = () => cb() }
  const onReset = (cb: (mins: number) => void): void => { elReset.onclick = () => cb(sanitizeMinutes(elMinutes.value)) }
  const onAdd = async (): Promise<void> => {
    const title = elNewTask.value.trim()
    if (!title) return
    const { task } = await tm.add({ title })
    renderTasks([task], true)
    elNewTask.value = ''
  }
  elAddTask.onclick = () => { onAdd() }
  elNewTask.onkeydown = (e) => { if (e.key === 'Enter') onAdd() }
  const renderTasks = (list: readonly Task[], append: boolean = false): void => {
    if (!append) elTaskList.innerHTML = ''
    list.forEach((t) => {
      const row = document.createElement('div')
      row.className = 'task-row'
      row.innerHTML = `
        <input type="checkbox" ${t.done ? 'checked' : ''} />
        <div class="task-title ${t.done ? 'done' : ''}">${escapeHtml(t.title)}</div>
        <button class="btn secondary" data-rm="1">Remove</button>
      `
      const cb = row.querySelector<HTMLInputElement>('input')!
      cb.onchange = async () => { await tm.toggle({ id: t.id }); row.querySelector('.task-title')!.classList.toggle('done') }
      const rm = row.querySelector<HTMLButtonElement>('button[data-rm="1"]')!
      rm.onclick = async () => { const { removed } = await tm.remove({ id: t.id }); if (removed) row.remove() }
      elTaskList.appendChild(row)
    })
  }
  return { setTime, onStart, onPause, onReset, renderTasks }
}

function renderTemplatesGallery(host: HTMLDivElement): void {
  const list = host.querySelector<HTMLDivElement>('#template-list')!
  list.innerHTML = ''
  builtInTemplates.forEach((tpl: SessionTemplate) => {
    const row = document.createElement('div')
    row.className = 'task-row'
    const total = totalMinutes(tpl)
    row.innerHTML = `
      <div style="flex:1;display:flex;gap:8px;align-items:center;">
        <div style="font-weight:600;">${escapeHtml(tpl.name)}</div>
        <div class="task-title">${total} min</div>
      </div>
      <div class="controls">
        <button class="btn" data-tpl-start>Start</button>
        <button class="btn secondary" data-tpl-save>Save</button>
      </div>`
    const start = row.querySelector<HTMLButtonElement>('button[data-tpl-start]')!
    const save = row.querySelector<HTMLButtonElement>('button[data-tpl-save]')!
    start.onclick = () => {
      const minutes = total
      const elMinutes = document.querySelector<HTMLInputElement>('#minutes')!
      elMinutes.value = String(minutes)
      const ev = new Event('click')
      document.querySelector<HTMLButtonElement>('#reset')!.dispatchEvent(ev)
    }
    save.onclick = async () => { await FocusRepository.saveTemplate({ tpl }); showToast('Template saved.') }
    list.appendChild(row)
  })
}

function bindTemplateBuilder(): void {
  const nameEl = document.querySelector<HTMLInputElement>('#tpl-name')!
  const durEl = document.querySelector<HTMLInputElement>('#tpl-duration')!
  const repEl = document.querySelector<HTMLInputElement>('#tpl-repeat')!
  const btn = document.querySelector<HTMLButtonElement>('#tpl-save')!
  btn.onclick = async () => {
    const name = nameEl.value.trim()
    const mins = Math.max(1, Math.min(180, Math.floor(Number(durEl.value) || 0)))
    const repeat = Math.max(1, Math.min(12, Math.floor(Number(repEl.value) || 1)))
    if (!name || !mins) return
    const tpl = { id: crypto.randomUUID(), name, blocks: [{ label: 'Block', durationMinutes: mins, type: 'custom' }] as const, repeat }
    await FocusRepository.saveTemplate({ tpl })
    showToast('Template saved.')
    nameEl.value = ''
    durEl.value = ''
    repEl.value = '1'
  }
}

function totalMinutes(tpl: { blocks: readonly { durationMinutes: number }[]; repeat?: number }): number {
  const per = tpl.blocks.reduce((acc, b) => acc + b.durationMinutes, 0)
  return Math.round(per * (tpl.repeat ?? 1))
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function sanitizeMinutes(raw: string): number {
  const n = Math.max(appConstants.minSessionMinutes, Math.min(appConstants.maxSessionMinutes, Math.floor(Number(raw) || appConstants.defaultSessionMinutes)))
  return n
}

main().catch((e) => console.error(e))
