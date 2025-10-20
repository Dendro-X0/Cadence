<script lang="ts">
  import type { SessionBlock, SessionTemplate } from '@cadence/core-domain/session-template'
  import { createEventDispatcher } from 'svelte'
  import { dominantType, totalMinutes } from '../../lib/templates-utils'
  import { colorForType } from '../../lib/colors'

  export let items: readonly SessionTemplate[] = []
  export let pinned: readonly string[] = []
  export let limit: number = 6

  const dispatch = createEventDispatcher<{ start: SessionTemplate }>()

  /** Dispatch start event */
  function start(tpl: SessionTemplate): void { dispatch('start', tpl) }
  /** Human time HH:mm for popover */
  function hhmm(): string { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  /**
   * Build a compact breakdown string like:
   * Focus 25m • Break 5m • x3
   */
  function breakdown(t: SessionTemplate): string {
    const by: Record<SessionBlock['type'], number> = { focus: 0, break: 0, meditation: 0, workout: 0, rest: 0, custom: 0 }
    for (const b of t.blocks) by[b.type] = (by[b.type] ?? 0) + b.durationMinutes
    const parts: string[] = []
    for (const k of Object.keys(by) as (keyof typeof by)[]) {
      const v = by[k]
      if (v > 0) parts.push(`${ucfirst(k)} ${v}m`)
    }
    const rep = Math.max(1, Math.floor(Number(t.repeat ?? 1)))
    return parts.join(' • ') + (rep > 1 ? ` • x${rep}` : '')
  }
  function ucfirst(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1) }

  // Delayed, edge-aware popover
  const SHOW_DELAY_MS: number = 140
  const SAFE_MARGIN_PX: number = 8
  let openIndex: number = -1
  let timer: number | null = null
  const btnEls: (HTMLButtonElement | null)[] = []
  const popEls: (HTMLDivElement | null)[] = []
  const shifts: number[] = []

  function onEnter(i: number): void {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => { openIndex = i; computeShift(i) }, SHOW_DELAY_MS)
  }
  function onLeave(): void {
    if (timer) { window.clearTimeout(timer); timer = null }
    openIndex = -1
  }
  function onFocus(i: number): void { if (timer) window.clearTimeout(timer); openIndex = i; computeShift(i) }
  function onBlur(): void { onLeave() }

  function computeShift(i: number): void {
    const btn = btnEls[i]
    const pop = popEls[i]
    if (!btn || !pop) return
    const br = btn.getBoundingClientRect()
    const pr = pop.getBoundingClientRect()
    const centerX: number = br.left + br.width / 2
    const defaultLeft: number = centerX - pr.width / 2
    let shift: number = 0
    const minLeft: number = SAFE_MARGIN_PX
    const maxLeft: number = window.innerWidth - SAFE_MARGIN_PX - pr.width
    if (defaultLeft < minLeft) shift = minLeft - defaultLeft
    else if (defaultLeft > maxLeft) shift = maxLeft - defaultLeft
    shifts[i] = Math.round(shift)
  }

  function onKey(i: number, e: KeyboardEvent): void {
    const key = e.key
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      e.preventDefault()
      const dir = key === 'ArrowRight' ? 1 : -1
      const max = Math.min(items.length, limit)
      let j = i
      for (let step = 0; step < max; step++) {
        j = (j + dir + max) % max
        if (btnEls[j]) break
      }
      const target = btnEls[j]
      if (target) {
        target.focus()
        openIndex = j
        computeShift(j)
      }
    } else if (key === 'Escape') {
      openIndex = -1
    }
  }

  function popId(i: number): string { return `qc-pop-${i}` }
</script>

<div class="chips">
  {#each items.slice(0, limit) as t, i}
    {#key (t.id ?? t.name)}
      <div class="chip-wrap" role="group" on:mouseenter={() => onEnter(i)} on:mouseleave={onLeave} on:focusin={() => onFocus(i)} on:focusout={onBlur}>
        <button
          class="chip {pinned.includes(t.name) ? 'pinned' : ''}"
          style={`background:${colorForType(dominantType(t))};color:#001018`}
          on:click={() => start(t)}
          bind:this={btnEls[i]}
          aria-describedby={popId(i)}
          on:keydown={(e) => onKey(i, e)}>
          {#if pinned.includes(t.name)}<span class="pin-ico">★</span>{/if}{t.name}{i < 9 ? ` [${i+1}]` : ''}
        </button>
        <div id={popId(i)} class="popover {openIndex===i?'show':''}" role="tooltip" bind:this={popEls[i]} style={`--shift-x:${(shifts[i] ?? 0)}px`}>
          <div class="row strong">{t.name}</div>
          <div class="row">Total: {totalMinutes(t)} min</div>
          <div class="row dim">{breakdown(t)}</div>
          <div class="row">Start at <span class="time">{hhmm()}</span></div>
        </div>
      </div>
    {/key}
  {/each}
  </div>

<style>
  .chips{position:relative;z-index:5;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}
  .chip-wrap{position:relative;z-index:6}
  .chip{position:relative;z-index:7;background:#1f2937;color:#e2e8f0;border:none;padding:8px 12px;border-radius:999px;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;line-height:1}
  .chip:hover{filter:brightness(1.1)}
  .chip:focus{outline:2px solid #0ea5e9;outline-offset:2px}
  .pin-ico{margin-right:6px;color:#ffd700}
  .pinned .pin-ico{color:#ffd700}
  .popover{position:absolute;left:50%;transform:translate(calc(-50% + var(--shift-x, 0px)),-6px) scale(.98);top:-2px;opacity:0;pointer-events:none;transition:opacity .12s ease, transform .12s ease;background:#0b1220;color:#e2e8f0;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px 10px;box-shadow:0 8px 30px rgba(0,0,0,.35);white-space:nowrap;visibility:hidden;z-index:8}
  .popover.show{opacity:1;transform:translate(calc(-50% + var(--shift-x, 0px)),-10px) scale(1);visibility:visible}
  .popover .row{font-size:12px;line-height:1.3}
  .popover .strong{font-weight:800}
  .popover .dim{opacity:.85}
  .popover .time{font-weight:800}

  /* Theme tweaks */
  :global(html[data-theme="light"]) .popover{background:#ffffff;color:#0b1220;border:1px solid rgba(0,0,0,.08);box-shadow:0 10px 30px rgba(0,0,0,.18)}
  :global(html[data-theme="amoled"]) .popover{background:#000000;color:#e2e8f0;border:1px solid rgba(255,255,255,.12);box-shadow:0 10px 30px rgba(0,0,0,.6)}
</style>
