<script lang="ts">
  import type { SessionTemplate } from '@cadence/core-domain/session-template'
  import { createEventDispatcher } from 'svelte'
  import { totalMinutes, dominantType } from '../../lib/templates-utils'
  import { colorForType } from '../../lib/colors'

  export let items: readonly SessionTemplate[] = []
  export let deletableIds: readonly string[] = []
  export let pageSize: number = 8
  let page: number = 1

  const dispatch = createEventDispatcher<{ start: SessionTemplate; delete: SessionTemplate }>()

  $: totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  $: page = Math.min(page, totalPages)
  $: paged = items.slice((page - 1) * pageSize, page * pageSize)

  function start(t: SessionTemplate): void { dispatch('start', t) }
  function requestDelete(t: SessionTemplate): void { dispatch('delete', t) }
  function next(): void { if (page < totalPages) page += 1 }
  function prev(): void { if (page > 1) page -= 1 }
</script>

<div class="list">
  {#if paged.length === 0}
    <div class="empty">No templates yet.</div>
  {:else}
    {#each paged as t}
      <div class="tpl-row">
        <div class="tpl-left">
          <div class="tpl-title">
            <span class="dot" style={`background:${colorForType(dominantType(t))}`}></span>
            {t.name}
          </div>
          <div class="tpl-meta">{totalMinutes(t)} min total • {t.blocks.length} blocks</div>
        </div>
        <div class="tpl-actions">
          <button class="btn primary" on:click={() => start(t)}>Start</button>
          {#if t.id && deletableIds.includes(t.id)}
            <button class="btn danger" on:click={() => requestDelete(t)}>Delete</button>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>
<div class="pager" aria-label="Templates Pager">
  <button class="btn secondary" on:click={prev} disabled={page<=1}>Prev</button>
  <span class="info">{page} / {totalPages}</span>
  <button class="btn secondary" on:click={next} disabled={page>=totalPages}>Next</button>
</div>

<style>
  .list{display:flex;flex-direction:column}
  .empty{opacity:.7;padding:8px}
  .tpl-row{display:flex;align-items:center;justify-content:space-between;padding:12px 6px;border-bottom:1px solid #1f2937}
  .tpl-left{display:flex;flex-direction:column}
  .tpl-title{font-weight:700}
  .tpl-meta{color:#94a3b8;font-size:12px}
  .tpl-actions{display:flex;gap:8px}
  .dot{display:inline-block;width:10px;height:10px;border-radius:999px;margin-right:6px;vertical-align:middle}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700}
  .btn.primary{background:#0ea5e9;color:#001018;border-color:transparent}
  .btn.secondary{background:#1f2937}
  .btn.danger{background:#b91c1c;border-color:#7f1d1d;color:#fff}
  .pager{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:8px}
  .info{color:#94a3b8}
</style>
