<script lang="ts">
  import { onMount } from 'svelte'
  import type { SessionTemplate } from '@cadence/core-domain/session-template'
  import { loadAllTemplates, savedTemplates, removeTemplate } from '../stores/templates'
  import QuickChips from '../components/templates/quick-chips.svelte'
  import TemplatesGallery from '../components/templates/templates-gallery.svelte'
  import TemplateBuilder from '../components/templates/template-builder.svelte'
  import { totalMinutes } from '../lib/templates-utils'
  import { setAccent } from '../lib/colors'
  import { settings } from '../stores/settings'
  import { showCountdown, confirm } from '../stores/overlays'
  import { startTemplate } from '../stores/runner'

  let builtIn: readonly SessionTemplate[] = []
  let saved: readonly SessionTemplate[] = []
  let pinned: readonly string[] = []
  let deletableIds: readonly string[] = []

  function onlyIds(list: readonly SessionTemplate[]): string[] {
    return list.map((t) => t.id).filter((x): x is string => Boolean(x))
  }

  async function handleDeleteEvent(e: CustomEvent<SessionTemplate>): Promise<void> {
    const t = e.detail
    if (!t.id) return
    const ok = await confirm({ title: 'Delete Template', text: `Delete "${t.name}"? This cannot be undone.`, acceptLabel: 'Delete', cancelLabel: 'Cancel' })
    if (!ok) return
    await removeTemplate(t.id)
  }

  onMount(() => {
    void loadAllTemplates().then((all) => {
      builtIn = all.builtIn
      saved = all.saved
    })
    const unsub = savedTemplates.subscribe((v) => { saved = v; deletableIds = onlyIds(v) })
    return () => { unsub() }
  })

  async function onStart(t: SessionTemplate): Promise<void> {
    const mins = totalMinutes(t)
    setAccent('custom')
    // Always confirm before starting from Templates
    const summary = t.blocks.map((b) => ({ label: b.label, minutes: b.durationMinutes, type: b.type }))
    const ok = await confirm({ title: 'Start Session', text: `Start "${t.name}" (${mins} min)?`, acceptLabel: 'Start', cancelLabel: 'Cancel', summary, repeat: Number(t.repeat ?? 1) })
    if (!ok) return
    const countdown = Number($settings.startCountdownSeconds ?? 0)
    if (countdown > 0) { await showCountdown(countdown) }
    await startTemplate(t)
  }
</script>

<div class="card">
  <div class="title">Quick Start</div>
  <QuickChips items={[...builtIn, ...saved]} {pinned} on:start={(e) => onStart(e.detail)} />
</div>
<div class="card" style="margin-top:12px;">
  <div class="title">Templates</div>
  <TemplatesGallery items={[...builtIn, ...saved]} {deletableIds} on:start={(e) => onStart(e.detail)} on:delete={handleDeleteEvent} />
</div>
<div class="card" style="margin-top:12px;">
  <div class="title">New Custom Template</div>
  <TemplateBuilder />
</div>

<style>
  .title{font-weight:700;margin-bottom:8px}
</style>
