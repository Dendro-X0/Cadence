import { registerSW } from 'virtual:pwa-register';
import { appConstants } from '@cadence/core-domain/constants';
/**
 * Setup PWA service worker with simple update prompt.
 */
export function setupPwa() {
    const update = registerSW({
        onNeedRefresh() {
            const should = window.confirm('New version available. Reload to update?');
            if (should)
                update(true);
        },
        onOfflineReady() { showToast('App is ready to work offline.'); },
        onRegisterError(err) { console.error('SW registration error', err); }
    });
}
export function showToast(message) {
    let el = document.querySelector('#toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    window.setTimeout(() => el && el.classList.remove('show'), appConstants.toastDurationMs);
}
