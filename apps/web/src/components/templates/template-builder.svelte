<script lang="ts">
  import type { SessionBlock, SessionTemplate } from '@cadence/core-domain/session-template'
  import { saveTemplate } from '../../stores/templates'

  let name: string = ''
  let repeat: number = 1
  let newMinutes: number = 5
  let blocks: SessionBlock[] = []

  function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)) }

  function addBlock(): void {
    blocks = [...blocks, { label: 'Block', durationMinutes: clamp(Math.floor(newMinutes)||5, 1, 180), type: 'custom' }]
  }
  function up(i: number): void { if (i > 0) { const c = [...blocks]; const t = c[i-1]; c[i-1] = c[i]; c[i] = t; blocks = c } }
  function down(i: number): void { if (i < blocks.length-1) { const c = [...blocks]; const t = c[i+1]; c[i+1] = c[i]; c[i] = t; blocks = c } }
  function del(i: number): void { blocks = blocks.filter((_, idx) => idx !== i) }

  function totalMinutes(): number {
    const per = blocks.reduce((acc, b) => acc + (Number(b.durationMinutes)||0), 0)
    return Math.round(per * clamp(Math.floor(repeat)||1, 1, 12))
  }

  async function save(): Promise<void> {
    const nm = name.trim()
    let out: SessionBlock[] = blocks
    if (out.length === 0) {
      const mins = clamp(Math.floor(newMinutes)||0, 1, 180)
      if (!nm || !mins) return
      out = [{ label: 'Block', durationMinutes: mins, type: 'custom' }]
    } else if (!nm) {
      return
    }
    const tpl: SessionTemplate = { id: crypto.randomUUID(), name: nm, blocks: out, repeat: clamp(Math.floor(repeat)||1, 1, 12) }
    await saveTemplate(tpl)
    name = ''
    repeat = 1
    newMinutes = 5
    blocks = []
  }
</script>

<div class="builder">
  <div class="row">
    <input class="input" placeholder="Name" title="Template name" bind:value={name} style="width:180px" />
    <input class="input" type="number" min="1" max="180" placeholder="Minutes" title="Default block minutes (1–180)" bind:value={newMinutes} style="width:120px" />
    <input class="input" type="number" min="1" max="12" placeholder="Repeat" title="Repeat count (1–12)" bind:value={repeat} style="width:100px" />
    <button class="btn" on:click={save}>Save Template</button>
  </div>
  <div class="blocks">
    {#each blocks as b, i}
      <div class="task-row">
        <input class="input" type="number" min="1" max="180" placeholder="Minutes" title="Block minutes (1–180)" bind:value={b.durationMinutes} style="width:90px" />
        <input class="input grow" placeholder="Label" title="Block label" bind:value={b.label} />
        <select class="select" bind:value={b.type}>
          <option value="focus">Focus</option>
          <option value="break">Break</option>
          <option value="meditation">Meditation</option>
          <option value="workout">Workout</option>
          <option value="rest">Rest</option>
          <option value="custom">Custom</option>
        </select>
        <button class="btn secondary" on:click={() => up(i)}>↑</button>
        <button class="btn secondary" on:click={() => down(i)}>↓</button>
        <button class="btn secondary" on:click={() => del(i)}>Remove</button>
      </div>
    {/each}
  </div>
  <div class="row">
    <button class="btn secondary" on:click={addBlock}>Add Block</button>
    <div class="total">Total: {totalMinutes()} min</div>
  </div>
</div>

<style>
  .builder{display:flex;flex-direction:column;gap:8px}
  .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .blocks{display:flex;flex-direction:column;gap:6px;margin-top:6px}
  .task-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937}
  .task-row:last-child{border-bottom:none}
  .input{background:#0f172a;color:#e2e8f0;border:1px solid #1f2937;border-radius:8px;padding:8px 10px}
  .input.grow{flex:1}
  .select{background:#0f172a;color:#e2e8f0;border:1px solid #1f2937;border-radius:8px;padding:6px 8px}
  .btn{background:#1f2937;color:#e2e8f0;border:1px solid #1f2937;padding:8px 12px;border-radius:8px;cursor:pointer;font-weight:700}
  .btn.secondary{background:#1f2937}
  .total{opacity:.85}
</style>
