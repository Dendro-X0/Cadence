<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { formatTime } from '../../lib/time'

  export let valueMs: number = 0
  export let totalMs: number = 25 * 60 * 1000
  export let mode: 'digital' | 'circular' = 'digital'
  export let size: 's' | 'm' | 'l' = 'l'
  export let running: boolean = false
  export let nowLabel: string = ''
  export let nextLabel: string = ''
  import { settings as settingsStore } from '../../stores/settings'
  $: shortcutStartPause = ($settingsStore.shortcutStartPause ?? 'Space') as string

  const dispatch = createEventDispatcher<{
    start: void
    pause: void
    reset: void
    skip: void
    extend: number
  }>()

  // methods exposed via bind:this
  export function setTime(ms: number): void { valueMs = ms }
  export function setTotal(ms: number): void { totalMs = ms }

  const circle = {
    r: 100,
    get c(): number { return 2 * Math.PI * this.r }
  }
  function progress(): number {
    const t = Math.max(0, Math.min(totalMs, valueMs))
    return totalMs > 0 ? 1 - t / totalMs : 0
  }
  function dashOffset(): number { return circle.c * progress() }

  $: display = formatTime(valueMs)
  $: circleDash = dashOffset()

  function classSize(): string {
    return size === 's' ? 'size-s' : size === 'm' ? 'size-m' : 'size-l'
  }
  function btn(cls: string, active: boolean): string { return `btn ${active ? 'active' : cls}` }

  let holdInterval: number | null = null
  let holdTimeout: number | null = null
  let held: boolean = false
  function onAdjustDown(delta: number): void {
    // start threshold timer; if user releases before threshold, treat as single tap
    clearAdjust()
    held = false
    holdTimeout = window.setTimeout(() => {
      held = true
      holdInterval = window.setInterval(() => dispatch('extend', delta), 100)
    }, 300)
  }
  function onAdjustUp(delta: number): void {
    if (!held) dispatch('extend', delta) // single tap
    clearAdjust()
  }
  function clearAdjust(): void {
    if (holdTimeout) { window.clearTimeout(holdTimeout); holdTimeout = null }
    if (holdInterval) { window.clearInterval(holdInterval); holdInterval = null }
  }

  function onAdjustKey(delta: number, e: KeyboardEvent): void {
    const k = (e.key || '').toLowerCase()
    if (k === 'enter' || k === ' ' || k === 'space' || k === 'spacebar') {
      e.preventDefault()
      dispatch('extend', delta)
    }
  }
</script>

<div class="timer {classSize()}">
  <div class="timer__display">
    {#if mode === 'digital'}
      <div class="time">{display}</div>
    {:else}
      <div class="circle-wrap show">
        <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true">
          <circle class="circle-bg" cx="120" cy="120" r="{circle.r}" />
          <circle class="circle-prog" cx="120" cy="120" r="{circle.r}"
            stroke-dasharray="{circle.c}" stroke-dashoffset="{circleDash}" />
        </svg>
        <div class="circle-center">{display}</div>
      </div>
    {/if}
  </div>
  <div class="meta">
    {#if nowLabel}
      <div class="now">Now: {nowLabel}</div>
    {/if}
    {#if nextLabel}
      <div class="next">Next: {nextLabel}</div>
    {/if}
  </div>
  <div class="controls">
    <button class={btn('primary', running)} on:click={() => (running ? dispatch('pause') : dispatch('start'))} aria-pressed={running} title="Start/Pause">
      {#if running}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M4 3h3v8H4zM8 3h3v8H8z"/></svg>
        <span>Pause</span>
      {:else}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M4 3l7 4-7 4V3z"/></svg>
        <span>Start</span>
      {/if}
      <kbd class="kbd">{shortcutStartPause}</kbd>
    </button>
    <button class="btn secondary" on:click={() => dispatch('reset')}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5a4 4 0 1 1 1 3"/><path d="M3 2v3h3"/></svg>
      <span>Reset</span>
    </button>
    <button class="btn secondary" on:click={() => dispatch('skip')}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M3 4l4 3-4 3V4zm5 0h2v6H8z"/></svg>
      <span>Skip</span>
    </button>
    <button class="btn secondary" on:pointerdown={() => onAdjustDown(-60_000)} on:pointerup={() => onAdjustUp(-60_000)} on:pointerleave={clearAdjust} on:keydown={(e) => onAdjustKey(-60_000, e)}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M4 7h6"/></svg>
      <span>-1m</span>
    </button>
    <button class="btn secondary" on:pointerdown={() => onAdjustDown(60_000)} on:pointerup={() => onAdjustUp(60_000)} on:pointerleave={clearAdjust} on:keydown={(e) => onAdjustKey(60_000, e)}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M7 4v3m0 0h3"/></svg>
      <span>+1m</span>
    </button>
  </div>
</div>

<style>
  .timer{display:flex;flex-direction:column;align-items:center;gap:16px}
  .timer__display{position:relative;height:320px;display:flex;align-items:center;justify-content:center;gap:24px;width:100%}
  .time{font-weight:800;letter-spacing:1px;font-size:64px}
  .controls{display:flex;gap:10px;justify-content:center;width:100%}
  .meta{display:flex;gap:16px;align-items:center;justify-content:center;color:#94a3b8;font-weight:600}
  .meta .now{color:#e2e8f0}
  .meta .next{opacity:.9}
  .btn{display:inline-flex;gap:6px;align-items:center;background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:10px 14px;border-radius:10px;cursor:pointer;font-weight:700;transition:transform .08s ease,background .2s ease,box-shadow .2s ease}
  .btn:hover{transform:translateY(-1px)}
  .btn:active{transform:translateY(0)}
  .btn.primary,.btn.active{background:#0ea5e9;color:#001018;border-color:transparent;box-shadow:0 4px 14px rgba(0,0,0,.25);background-image:linear-gradient(135deg,#0ea5e9,#22d3ee)}
  .btn.secondary{background:#1f2937;color:#e2e8f0}
  .btn .kbd{display:none;margin-left:6px;padding:2px 6px;border-radius:6px;background:rgba(0,0,0,.35);color:#e2e8f0;font-weight:800;font-size:10px}
  .btn:hover .kbd{display:inline-block}

  /* circular */
  .circle-wrap{width:240px;height:240px;position:relative;display:none}
  .circle-wrap.show{display:block}
  .circle-wrap svg{transform:rotate(-90deg)}
  .circle-bg{stroke:#1f2937;stroke-width:14;fill:none}
  .circle-prog{stroke:var(--accent, #38bdf8);stroke-linecap:round;stroke-width:14;fill:none;transition:stroke-dashoffset .2s linear}
  .circle-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800}

  /* size presets */
  .size-s .time{font-size:40px}
  .size-m .time{font-size:52px}
  .size-l .time{font-size:64px}
</style>
