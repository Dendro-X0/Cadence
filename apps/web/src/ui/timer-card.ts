import type { SessionBlock } from '@cadence/core-domain/session-template'
import { Time } from '../utils/time'

export type TransportState = 'idle'|'running'|'paused'

export type TimerUiApi = {
  setTime: (ms: number) => void
  onStart: (cb: () => void) => void
  onPause: (cb: () => void) => void
  onReset: (cb: (mins: number) => void) => void
  onSkip: (cb: () => void) => void
  onExtend: (cb: (minutes: number) => void) => void
  setBlockLabels: (now: string | null, next: string | null, type?: SessionBlock['type']) => void
  setTotal: (ms: number) => void
  setTransport: (state: TransportState) => void
  pulseBlock: () => void
  setMode: (mode: 'digital'|'circular') => void
  setTimerSize: (size: 's'|'m'|'l') => void
}

export function setupTimerCard(container: HTMLDivElement): TimerUiApi {
  const elTime = container.querySelector<HTMLDivElement>('#time')!
  const elMinutes = container.querySelector<HTMLInputElement>('#minutes')!
  const elStart = container.querySelector<HTMLButtonElement>('#start')!
  const elPause = container.querySelector<HTMLButtonElement>('#pause')!
  const elReset = container.querySelector<HTMLButtonElement>('#reset')!
  const elSkip = container.querySelector<HTMLButtonElement>('#skip')!
  const elExtend = container.querySelector<HTMLButtonElement>('#extend')!
  const elBlockNow = container.querySelector<HTMLDivElement>('#block-now')!
  const elBlockNext = container.querySelector<HTMLDivElement>('#block-next')!
  const elNowChip = container.querySelector<HTMLDivElement>('#now-chip')!
  const circleWrap = container.querySelector<HTMLDivElement>('#circle')!
  const circleProg = container.querySelector<SVGCircleElement>('#circle-prog')!
  const circleCenter = container.querySelector<HTMLDivElement>('#circle-center')!
  const elMini = document.querySelector<HTMLDivElement>('#mini')
  const elMiniTime = document.querySelector<HTMLSpanElement>('#mini-time')
  const timerCard = container.querySelector<HTMLDivElement>('.card.timer')!

  const totalCircumference = 2 * Math.PI * 100
  circleProg.setAttribute('stroke-dasharray', String(totalCircumference))

  const setMode = (mode: 'digital'|'circular'): void => {
    timerCard.classList.add('mode-switch'); window.setTimeout(() => timerCard.classList.remove('mode-switch'), 250)
    timerCard.classList.toggle('timer--digital', mode === 'digital')
    timerCard.classList.toggle('timer--circular', mode === 'circular')
    circleWrap.classList.toggle('show', mode === 'circular')
  }
  const setTimerSize = (size: 's'|'m'|'l'): void => {
    timerCard.classList.toggle('timer-size-s', size === 's')
    timerCard.classList.toggle('timer-size-m', size === 'm')
    timerCard.classList.toggle('timer-size-l', size === 'l')
  }
  const setTime = (ms: number): void => {
    const t = Time.toTime(ms)
    elTime.textContent = t
    circleCenter.textContent = t
    if (elMini && elMiniTime) elMiniTime.textContent = t
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
  const onStart = (cb: () => void): void => { elStart.onclick = () => { cb(); setTransport('running') } }
  const onPause = (cb: () => void): void => { elPause.onclick = () => { cb(); setTransport('paused') } }
  const onReset = (cb: (mins: number) => void): void => { elReset.onclick = () => cb(sanitize(elMinutes.value)) }
  const onSkip = (cb: () => void): void => { elSkip.onclick = () => cb() }
  const onExtend = (cb: (minutes: number) => void): void => { elExtend.onclick = () => cb(1) }
  const setBlockLabels = (now: string | null, next: string | null, type?: SessionBlock['type']): void => {
    elBlockNow.textContent = now ? `Now: ${now}` : ''
    elBlockNext.textContent = next ? `Next: ${next}` : ''
    if (now) { elNowChip.textContent = now; elNowChip.hidden = false; elNowChip.dataset.type = type ?? '' }
    else { elNowChip.hidden = true; elNowChip.textContent = '' }
  }
  const setTotal = (ms: number): void => { circleWrap.dataset.totalms = String(ms) }
  const setTransport = (state: TransportState): void => {
    elStart.classList.toggle('active', state === 'running')
    elPause.classList.toggle('active', state === 'paused')
  }
  const pulseBlock = (): void => { circleWrap.classList.add('block-pop'); window.setTimeout(() => circleWrap.classList.remove('block-pop'), 260) }
  return { setTime, onStart, onPause, onReset, onSkip, onExtend, setBlockLabels, setTotal, setTransport, pulseBlock, setMode, setTimerSize }
}

function sanitize(raw: string): number {
  const n = Math.max(1, Math.min(180, Math.floor(Number(raw) || 25)))
  return n
}
