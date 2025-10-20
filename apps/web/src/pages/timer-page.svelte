<script lang="ts">
  import { onMount } from 'svelte'
  import TimerCard from '../components/timer/timer-card.svelte'
  import QuickChips from '../components/templates/quick-chips.svelte'
  import { engine, start as engStart, pause as engPause, reset as engReset, skip as engSkip, extend as engExtend } from '../stores/engine'
  import { settings } from '../stores/settings'
  import { showCountdown, confirm } from '../stores/overlays'
  import { loadAllTemplates, savedTemplates } from '../stores/templates'
  import type { SessionTemplate } from '@cadence/core-domain/session-template'
  import { totalMinutes } from '../lib/templates-utils'
  import { setAccent } from '../lib/colors'
  import { runner, startTemplate } from '../stores/runner'

  $: st = $engine
  $: mode = ($settings.timerMode ?? 'digital') as ('digital'|'circular')
  $: size = ($settings.timerSize ?? 'l') as ('s'|'m'|'l')
  $: running = st.running
  let builtIn: readonly SessionTemplate[] = []
  let saved: readonly SessionTemplate[] = []
  let nowLabel: string = ''
  let nextLabel: string = ''
  $: {
    const r = $runner
    if (r.active) {
      nowLabel = r.segments[r.index]?.label ?? ''
      nextLabel = r.segments[r.index + 1]?.label ?? ''
    } else {
      nowLabel = ''
      nextLabel = ''
    }
  }

  async function start(): Promise<void> {
    const sec = Number($settings.startCountdownSeconds ?? 0)
    if (sec > 0) { await showCountdown(sec) }
    engStart()
  }
  function pause(): void { engPause() }
  function reset(): void { engReset() }
  function skip(): void { engSkip() }
  function extend(ms: number): void { engExtend(ms) }

  onMount(() => {
    const handler = () => { if (running) engPause(); else void start() }
    window.addEventListener('cadence:startpause', handler)
    void loadAllTemplates().then(({ builtIn: bi }) => { builtIn = bi })
    const unsub = savedTemplates.subscribe((list) => { saved = list })
    return () => { window.removeEventListener('cadence:startpause', handler); unsub() }
  })

  async function onStartTemplate(t: SessionTemplate): Promise<void> {
    const mins = totalMinutes(t)
    setAccent('custom')
    const summary = t.blocks.map((b) => ({ label: b.label, minutes: b.durationMinutes, type: b.type }))
    const ok = await confirm({ title: 'Start Session', text: `Start "${t.name}" (${mins} min)?`, acceptLabel: 'Start', cancelLabel: 'Choose Another', summary, repeat: Number(t.repeat ?? 1) })
    if (!ok) return
    const countdown = Number($settings.startCountdownSeconds ?? 0)
    if (countdown > 0) { await showCountdown(countdown) }
    await startTemplate(t)
  }
</script>

<div class="card timer-page">
  <div class="quick">
    <div class="quick__title">Quick Start</div>
    <QuickChips items={[...builtIn, ...saved]} pinned={$settings.pinnedTemplateNames ?? []} limit={6} on:start={(e) => void onStartTemplate(e.detail)} />
  </div>
  <div class="timer__display">
    <TimerCard
      valueMs={st.valueMs}
      totalMs={st.totalMs}
      running={st.running}
      nowLabel={nowLabel}
      nextLabel={nextLabel}
      {mode}
      {size}
      on:start={start}
      on:pause={pause}
      on:reset={reset}
      on:skip={skip}
      on:extend={(e) => extend(e.detail)}
    />
  </div>
</div>

<style>
  .timer-page{display:flex;flex-direction:column;gap:16px}
  .quick{width:100%;margin-bottom:8px}
  .quick__title{font-weight:800;margin-bottom:6px}
  .timer__display{position:relative;height:320px;display:flex;align-items:center;justify-content:center;gap:24px;width:100%}
</style>
