import { describe, it, expect, beforeEach } from 'vitest';
import { renderQuickChips } from '../templates-chips';
describe('renderQuickChips', () => {
    let host;
    beforeEach(() => {
        host = document.createElement('div');
        document.body.innerHTML = '';
        document.body.appendChild(host);
    });
    const mk = (name, mins) => ({ id: name, name, repeat: 1, blocks: [{ label: 'b', durationMinutes: mins, type: 'focus' }] });
    it('renders chips and invokes onStart with correct template', () => {
        const items = [mk('A', 10), mk('B', 15)];
        let started = null;
        renderQuickChips(host, { items, pinned: [], onStart: (tpl) => { started = tpl.name; } });
        const btns = host.querySelectorAll('button.chip');
        expect(btns.length).toBe(2);
        btns[1].click();
        expect(started).toBe('B');
    });
    it('adds pinned class to pinned templates', () => {
        const items = [mk('A', 10), mk('B', 15)];
        renderQuickChips(host, { items, pinned: ['A'], onStart: () => { } });
        const a = host.querySelector('button.chip[data-name="A"]');
        const b = host.querySelector('button.chip[data-name="B"]');
        expect(a.classList.contains('pinned')).toBe(true);
        expect(b.classList.contains('pinned')).toBe(false);
    });
    it('sets title tooltip with total minutes', () => {
        const items = [mk('A', 10)];
        renderQuickChips(host, { items, pinned: [], onStart: () => { } });
        const a = host.querySelector('button.chip[data-name="A"]');
        expect(a.title).toContain('10');
    });
    it('reports needsMore when items exceed limit', () => {
        const items = Array.from({ length: 7 }, (_, i) => mk(String(i + 1), 5));
        const res = renderQuickChips(host, { items, pinned: [], onStart: () => { }, limit: 6 });
        expect(res.needsMore).toBe(true);
    });
});
