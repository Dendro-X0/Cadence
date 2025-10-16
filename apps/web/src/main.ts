import './styles.css'
import { appConstants } from '@cadence/core-domain/constants'
import type { Task } from '@cadence/core-domain/task'
import type { Settings } from '@cadence/core-domain/settings'
import { FocusTimer } from '@cadence/core-domain/focus-timer'
import { ScheduleEngine } from '@cadence/core-domain/schedule-engine'
import { TaskManager } from './core/task-manager'
import { FocusRepository } from '@cadence/storage/focus-repository'
import { builtInTemplates } from '@cadence/templates/defaults'
import { setupPwa, showToast } from './pwa'
import type { SessionTemplate } from '@cadence/core-domain/session-template'
import type { SessionBlock } from '@cadence/core-domain/session-template'
import { notify } from '@cadence/notifications/notifier'

const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`)
const toTime = (ms: number): string => {
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${pad(m)}:${pad(s)}`
}

const defaults: Settings = { sessionMinutes: appConstants.defaultSessionMinutes, autoStart: false }

async function main(): Promise<void> {
  const isMini = new URLSearchParams(window.location.search).get('mini') === '1'
  setupPwa()
  if (isMini) { renderMini(); return }
  const isDesktop = Boolean((window as unknown as { __TAURI__?: unknown }).__TAURI__)
  let tauriEmit: ((event: string, payload?: unknown) => Promise<void>) | null = null
  if (isDesktop) {
    try { const mod = await import('@tauri-apps/api/event') as unknown as { emit: (e:string,p?:unknown)=>Promise<void> }; tauriEmit = (mod as any).emit } catch {}
  }
  ;(window as unknown as { __emitTick?: (e: string, p?: unknown) => Promise<void> }).__emitTick = tauriEmit ?? undefined
  const { settings } = await FocusRepository.loadSettings(defaults)
  const tm = new TaskManager()
  const ui = buildUI({ settings, tm })
  let engine: ScheduleEngine | null = null
  const initialMs = settings.sessionMinutes * appConstants.msPerMinute
  const timer = new FocusTimer({ durationMs: initialMs, onTick: (ms: number) => ui.setTime(ms) })
  ui.setTotal(initialMs)
  ui.onStart(() => timer.start())
  ui.onPause(() => timer.pause())
  ui.onReset((mins) => { const ms = mins * appConstants.msPerMinute; ui.setTotal(ms); timer.reset({ durationMs: ms }) })
  ui.setTime(timer.remainingMs())
  const { tasks } = await tm.list()
  ui.renderTasks(tasks)
  // Templates Gallery
  const gallery = document.querySelector<HTMLDivElement>('#templates')!
  renderTemplatesGallery(gallery, {
    onStart: (tpl) => {
      engine?.reset()
      engine = new ScheduleEngine({
        template: tpl,
        events: {
          onBlockStart: (_i, b) => { ui.setBlockLabels(b.label, engine?.nextBlock()?.label ?? null); ui.setTotal(b.durationMinutes * appConstants.msPerMinute); setAccent(b.type) },
          onTick: (ms) => ui.setTime(ms),
          onBlockEnd: () => { if (settings.soundEnabled) beep(880, 140); notify({ title: 'Block complete', body: 'Next block starting' }).catch(() => {}) },
          onComplete: () => {
            ui.setBlockLabels('Done', null)
            ;(window as unknown as { __engine?: ScheduleEngine }).__engine = undefined
            showToast('Schedule complete.')
            if (settings.soundEnabled) { beep(880, 120); window.setTimeout(() => beep(660, 120), 150); window.setTimeout(() => beep(990, 120), 300) }
            notify({ title: 'Schedule complete', body: 'Great job!' }).catch(() => {})
          }
        }
      })
      ;(window as unknown as { __engine?: ScheduleEngine }).__engine = engine
      engine.start()
      // Hook transport controls to engine while running
      ui.onStart(() => engine?.start())
      ui.onPause(() => engine?.pause())
      ui.onReset((_mins) => engine?.reset())
    },
    onSave: async (tpl) => { await FocusRepository.saveTemplate({ tpl }); showToast('Template saved.') }
  })
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
      <div class="settings">
        <label for="minutes">Minutes</label><input id="minutes" class="input" type="number" min="${appConstants.minSessionMinutes}" max="${appConstants.maxSessionMinutes}" />
        <button id="gear" class="btn gear" title="Settings">⚙</button>
      </div>
    </div>
    <div class="card timer">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div class="time" id="time">00:00</div>
        <div class="circle-wrap" id="circle">
          <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
            <circle class="circle-bg" cx="80" cy="80" r="68" />
            <circle class="circle-prog" id="circle-prog" cx="80" cy="80" r="68" stroke-dasharray="427" stroke-dashoffset="0" />
          </svg>
          <div class="circle-center" id="circle-center">25:00</div>
        </div>
        <div style="text-align:right;">
          <div id="block-now" class="task-title"></div>
          <div id="block-next" class="task-title" style="opacity:.7"></div>
        </div>
      </div>
      <div class="controls">
        <button id="start" class="btn">Start</button>
        <button id="pause" class="btn secondary">Pause</button>
        <button id="reset" class="btn secondary">Reset</button>
        <button id="skip" class="btn secondary">Skip</button>
        <button id="extend" class="btn secondary">+1m</button>
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
        <div id="tpl-blocks" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;"></div>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button id="tpl-add" class="btn secondary">Add Block</button>
        </div>
      </div>
    </div>
    <div class="settings-panel" id="settings-panel">
      <div style="font-weight:700;margin-bottom:8px;">Settings</div>
      <div class="settings-row"><span>Theme</span>
        <select id="theme" class="select">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="amoled">AMOLED</option>
        </select>
      </div>
      <div class="settings-row"><span>Timer Mode</span>
        <select id="timer-mode" class="select">
          <option value="digital">Digital</option>
          <option value="circular">Circular</option>
        </select>
      </div>
      <div class="settings-row"><span>Sound</span>
        <input type="checkbox" id="sound-toggle" class="switch" />
      </div>
      <div class="settings-row"><span>Mini Bubble</span>
        <input type="checkbox" id="mini-toggle" class="switch" />
      </div>
    </div>
  `
  root.appendChild(container)
  const elTime = container.querySelector<HTMLDivElement>('#time')!
  const elMinutes = container.querySelector<HTMLInputElement>('#minutes')!
  const elStart = container.querySelector<HTMLButtonElement>('#start')!
  const elPause = container.querySelector<HTMLButtonElement>('#pause')!
  const elReset = container.querySelector<HTMLButtonElement>('#reset')!
  const elSkip = container.querySelector<HTMLButtonElement>('#skip')!
  const elExtend = container.querySelector<HTMLButtonElement>('#extend')!
  const elBlockNow = container.querySelector<HTMLDivElement>('#block-now')!
  const elBlockNext = container.querySelector<HTMLDivElement>('#block-next')!
  const elNewTask = container.querySelector<HTMLInputElement>('#new-task')!
  const elAddTask = container.querySelector<HTMLButtonElement>('#add-task')!
  const elTaskList = container.querySelector<HTMLDivElement>('#task-list')!
  const elGear = container.querySelector<HTMLButtonElement>('#gear')!
  const panel = container.querySelector<HTMLDivElement>('#settings-panel')!
  const selTheme = container.querySelector<HTMLSelectElement>('#theme')!
  const selMode = container.querySelector<HTMLSelectElement>('#timer-mode')!
  const chkMini = container.querySelector<HTMLInputElement>('#mini-toggle')!
  const chkSound = container.querySelector<HTMLInputElement>('#sound-toggle')!
  const circleWrap = container.querySelector<HTMLDivElement>('#circle')!
  const circleProg = container.querySelector<SVGCircleElement>('#circle-prog')!
  const circleCenter = container.querySelector<HTMLDivElement>('#circle-center')!
  const elMini = document.querySelector<HTMLDivElement>('#mini')!
  const elMiniTime = document.querySelector<HTMLSpanElement>('#mini-time')!
  elMinutes.value = String(settings.sessionMinutes)
  // hydrate settings
  document.documentElement.setAttribute('data-theme', settings.theme ?? 'dark')
  selTheme.value = settings.theme ?? 'dark'
  selMode.value = settings.timerMode ?? 'digital'
  chkMini.checked = Boolean(settings.miniWindowEnabled)
  chkSound.checked = Boolean(settings.soundEnabled)
  const totalCircumference = 2 * Math.PI * 68
  circleProg.setAttribute('stroke-dasharray', String(totalCircumference))
  const setTime = (ms: number): void => {
    const t = toTime(ms)
    elTime.textContent = t
    circleCenter.textContent = t
    if (elMini) elMiniTime.textContent = t
    try { localStorage.setItem('cadence_tick', String(ms)) } catch {}
    const emitFn = (window as unknown as { __emitTick?: (e: string, p?: unknown) => Promise<void> }).__emitTick
    if (emitFn) { emitFn('cadence:tick', { ms }).catch(() => {}) }
    const totalMs = Number(circleWrap.dataset.totalms || '0')
    if (totalMs > 0) {
      const progress = Math.min(1, Math.max(0, 1 - ms / totalMs))
      const offset = totalCircumference * progress
      circleProg.setAttribute('stroke-dashoffset', String(offset))
    }
  }
  const onStart = (cb: () => void): void => { elStart.onclick = () => cb() }
  const onPause = (cb: () => void): void => { elPause.onclick = () => cb() }
  const onReset = (cb: (mins: number) => void): void => { elReset.onclick = () => cb(sanitizeMinutes(elMinutes.value)) }
  elSkip.onclick = () => { (window as unknown as { __engine?: ScheduleEngine }).__engine?.skip() }
  elExtend.onclick = () => { (window as unknown as { __engine?: ScheduleEngine }).__engine?.extend({ minutes: 1 }) }
  const setBlockLabels = (now: string | null, next: string | null): void => {
    elBlockNow.textContent = now ? `Now: ${now}` : ''
    elBlockNext.textContent = next ? `Next: ${next}` : ''
  }
  // toggle settings panel
  elGear.onclick = () => panel.classList.toggle('show')
  selTheme.onchange = async () => {
    document.documentElement.setAttribute('data-theme', selTheme.value)
    await FocusRepository.saveSettings({ settings: { ...settings, theme: selTheme.value as 'dark'|'light'|'amoled' } })
  }
  selMode.onchange = async () => {
    const mode = selMode.value as 'digital'|'circular'
    circleWrap.classList.toggle('show', mode === 'circular')
    await FocusRepository.saveSettings({ settings: { ...settings, timerMode: mode } })
  }
  chkMini.onchange = async () => {
    const enabled = chkMini.checked
    elMini.classList.toggle('show', enabled)
    await FocusRepository.saveSettings({ settings: { ...settings, miniWindowEnabled: enabled } })
    try {
      // Desktop mini window management
      const isDesktop = Boolean((window as unknown as { __TAURI__?: unknown }).__TAURI__)
      if (isDesktop) {
        const mod = await import('@tauri-apps/api/webviewWindow') as unknown as { WebviewWindow: any }
        const WebviewWindow: any = (mod as any).WebviewWindow
        const existing = WebviewWindow.getByLabel ? WebviewWindow.getByLabel('mini') : undefined
        if (enabled) {
          if (!existing) new WebviewWindow('mini', { width: 240, height: 90, decorations: false, resizable: false, alwaysOnTop: true, url: '/?mini=1' })
        } else {
          if (existing) existing.close()
        }
      }
    } catch {}
  }
  chkSound.onchange = async () => { await FocusRepository.saveSettings({ settings: { ...settings, soundEnabled: chkSound.checked } }) }
  // reveal circle if selected
  circleWrap.classList.toggle('show', (settings.timerMode ?? 'digital') === 'circular')
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
  ;(window as unknown as { __engine?: ScheduleEngine }).__engine = undefined
  const setTotal = (ms: number): void => { circleWrap.dataset.totalms = String(ms) }
  return { setTime, onStart, onPause, onReset, renderTasks, setBlockLabels, setTotal }
}

function renderTemplatesGallery(host: HTMLDivElement, handlers: { onStart: (tpl: SessionTemplate) => void; onSave: (tpl: SessionTemplate) => Promise<void> }): void {
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
    start.onclick = () => handlers.onStart(tpl)
    save.onclick = async () => { await handlers.onSave(tpl) }
    list.appendChild(row)
  })
}

function bindTemplateBuilder(): void {
  const nameEl = document.querySelector<HTMLInputElement>('#tpl-name')!
  const durEl = document.querySelector<HTMLInputElement>('#tpl-duration')!
  const repEl = document.querySelector<HTMLInputElement>('#tpl-repeat')!
  const btnSave = document.querySelector<HTMLButtonElement>('#tpl-save')!
  const btnAdd = document.querySelector<HTMLButtonElement>('#tpl-add')!
  const list = document.querySelector<HTMLDivElement>('#tpl-blocks')!
  let blocks: SessionBlock[] = []

  const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n))

  const render = (): void => {
    list.innerHTML = ''
    blocks.forEach((b, i) => {
      const row = document.createElement('div')
      row.className = 'task-row'
      row.style.alignItems = 'center'
      row.innerHTML = `
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
      const mins = row.querySelector<HTMLInputElement>('.blk-mins')!
      const label = row.querySelector<HTMLInputElement>('.blk-label')!
      const type = row.querySelector<HTMLSelectElement>('.blk-type')!
      mins.onchange = () => { blocks[i] = { ...blocks[i], durationMinutes: clamp(Math.floor(Number(mins.value)||1), 1, 180) } }
      label.oninput = () => { blocks[i] = { ...blocks[i], label: label.value } }
      type.onchange = () => { blocks[i] = { ...blocks[i], type: type.value as SessionBlock['type'] } }
      row.querySelector<HTMLButtonElement>('[data-up]')!.onclick = () => { if (i>0) { const t=blocks[i-1]; blocks[i-1]=blocks[i]; blocks[i]=t; render() } }
      row.querySelector<HTMLButtonElement>('[data-down]')!.onclick = () => { if (i<blocks.length-1) { const t=blocks[i+1]; blocks[i+1]=blocks[i]; blocks[i]=t; render() } }
      row.querySelector<HTMLButtonElement>('[data-del]')!.onclick = () => { blocks = blocks.filter((_,j)=>j!==i); render() }
      list.appendChild(row)
    })
  }

  btnAdd.onclick = () => { blocks = [...blocks, { label: 'Block', durationMinutes: clamp(Math.floor(Number(durEl.value)||5),1,180), type: 'custom' }]; render() }

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
    render()
  }

  render()
}

function totalMinutes(tpl: { blocks: readonly { durationMinutes: number }[]; repeat?: number }): number {
  const per = tpl.blocks.reduce((acc, b) => acc + b.durationMinutes, 0)
  return Math.round(per * (tpl.repeat ?? 1))
}

function setAccent(type: 'focus'|'break'|'meditation'|'workout'|'rest'|'custom'): void {
  const map: Record<string,string> = { focus: '#38bdf8', break: '#22c55e', meditation: '#a855f7', workout: '#f59e0b', rest: '#14b8a6', custom: '#60a5fa' }
  document.documentElement.style.setProperty('--accent', map[type] ?? '#38bdf8')
}

function beep(freq: number, ms: number): void {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  o.connect(g); g.connect(ctx.destination)
  g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + ms / 1000)
  o.start(); o.stop(ctx.currentTime + ms / 1000)
}

function renderMini(): void {
  const root = document.querySelector<HTMLDivElement>('#app')!
  root.innerHTML = ''
  const box = document.createElement('div')
  box.id = 'mini-standalone'
  box.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:28px;padding:8px;'
  box.setAttribute('data-tauri-drag-region', 'true')
  root.appendChild(box)
  const update = (ms: number): void => { box.textContent = toTime(ms) }
  try { const ms = Number(localStorage.getItem('cadence_tick') || '0'); if (ms) update(ms) } catch {}
  window.addEventListener('storage', (e) => { if (e.key === 'cadence_tick' && e.newValue) update(Number(e.newValue)) })
  const isDesktop = Boolean((window as unknown as { __TAURI__?: unknown }).__TAURI__)
  if (isDesktop) {
    try {
      // dynamic import to avoid bundling for web
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      import('@tauri-apps/api/event').then((mod: any) => {
        const listen = (mod as any).listen as (ev: string, cb: (e: any) => void) => Promise<() => void>
        listen('cadence:tick', (e: any) => {
          const ms = (e?.payload?.ms as number) ?? 0
          if (ms > 0) update(ms)
        }).catch(() => {})
      }).catch(() => {})
    } catch {}
  }
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function sanitizeMinutes(raw: string): number {
  const n = Math.max(appConstants.minSessionMinutes, Math.min(appConstants.maxSessionMinutes, Math.floor(Number(raw) || appConstants.defaultSessionMinutes)))
  return n
}

main().catch((e) => console.error(e))
