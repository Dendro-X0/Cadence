/**
 * Show a keyboard shortcuts overlay using current preferences.
 */
export function showShortcutsOverlay(prefs) {
    const root = document.body;
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    const items = [
        { label: 'Start/Pause', key: prefs.shortcutStartPause ?? 'Space' },
        { label: 'Timer Tab', key: prefs.shortcutTimerTab ?? 't' },
        { label: 'Templates Tab', key: prefs.shortcutTemplatesTab ?? 'e' },
        { label: 'Settings Tab', key: prefs.shortcutSettingsTab ?? 's' },
        { label: 'Template Chips', key: '1..9' }
    ];
    const list = items.map((i) => `<div class="sc-row"><span>${i.label}</span><kbd>${i.key}</kbd></div>`).join('');
    wrap.innerHTML = `
    <div class="overlay__card">
      <div class="overlay__title">Shortcuts</div>
      <div class="overlay__content">${list}</div>
      <div class="overlay__actions"><button class="btn" id="ov-close">Close</button></div>
    </div>`;
    root.appendChild(wrap);
    const close = wrap.querySelector('#ov-close');
    const remove = () => { if (wrap.parentElement)
        wrap.parentElement.removeChild(wrap); };
    close.onclick = () => remove();
    wrap.addEventListener('click', (e) => { if (e.target === wrap)
        remove(); });
    const onKey = (e) => { if (e.key === 'Escape') {
        remove();
        window.removeEventListener('keydown', onKey);
    } };
    window.addEventListener('keydown', onKey);
}
