import './styles.css'
import { appConstants } from './core/constants'
import type { Task } from './core/types'
import type { Settings } from './core/settings'
import { FocusTimer } from './core/focus-timer'
import { TaskManager } from './core/task-manager'
import { FocusRepository } from './data/focus-repository'
import { setupPwa } from './pwa'

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
  const timer = new FocusTimer({ durationMs: settings.sessionMinutes * appConstants.msPerMinute, onTick: (ms) => ui.setTime(ms) })
  ui.onStart(() => timer.start())
  ui.onPause(() => timer.pause())
  ui.onReset((mins) => timer.reset({ durationMs: mins * appConstants.msPerMinute }))
  ui.setTime(timer.remainingMs())
  const { tasks } = await tm.list()
  ui.renderTasks(tasks)
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

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function sanitizeMinutes(raw: string): number {
  const n = Math.max(appConstants.minSessionMinutes, Math.min(appConstants.maxSessionMinutes, Math.floor(Number(raw) || appConstants.defaultSessionMinutes)))
  return n
}

main().catch((e) => console.error(e))
