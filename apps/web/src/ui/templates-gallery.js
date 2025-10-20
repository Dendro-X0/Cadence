import { builtInTemplates } from '@cadence/templates/defaults';
import { FocusRepository } from '@cadence/storage/focus-repository';
import { showToast } from '../services/pwa';
import { totalMinutes, escapeHtml } from './templates-utils';
export function renderTemplatesGallery(host, handlers) {
    const list = host.querySelector('#template-list');
    list.innerHTML = '';
    handlers.templates.forEach((tpl) => {
        const row = document.createElement('div');
        row.className = 'tpl-row';
        const total = totalMinutes(tpl);
        const isPinned = handlers.pinnedNames.includes(tpl.name);
        if (isPinned)
            row.classList.add('pinned');
        row.innerHTML = `
      <div class="tpl-left">
        <div class="tpl-title">${isPinned ? '<span class=\'pin-ico\'>★</span>' : ''}${escapeHtml(tpl.name)}</div>
        <div class="tpl-meta">${total} min total</div>
      </div>
      <div class="tpl-actions">
        <button class="btn" data-tpl-start>Start</button>
        <button class="btn secondary" data-tpl-save>Save</button>
        <button class="btn secondary" data-tpl-del style="display:none">Delete</button>
        <button class="btn secondary" data-tpl-pin></button>
      </div>`;
        const start = row.querySelector('button[data-tpl-start]');
        const save = row.querySelector('button[data-tpl-save]');
        const del = row.querySelector('button[data-tpl-del]');
        const pinBtn = row.querySelector('button[data-tpl-pin]');
        start.onclick = () => handlers.onStart(tpl);
        save.onclick = async () => { await handlers.onSave(tpl); };
        pinBtn.textContent = isPinned ? 'Unpin' : 'Pin';
        pinBtn.onclick = () => handlers.onTogglePin(tpl.name, !isPinned);
        const isSaved = Boolean(tpl.id && tpl.id.length > 0 && !builtInTemplates.some((b) => b.name === tpl.name));
        if (isSaved) {
            del.style.display = '';
            del.onclick = async () => {
                const ok = window.confirm(`Delete template "${tpl.name}"?`);
                if (!ok)
                    return;
                await FocusRepository.removeTemplate({ id: tpl.id });
                showToast('Template deleted.');
                const evt = new CustomEvent('cadence:refreshTemplates');
                window.dispatchEvent(evt);
            };
        }
        list.appendChild(row);
    });
}
