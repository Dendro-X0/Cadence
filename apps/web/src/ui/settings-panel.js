import { FocusRepository } from '@cadence/storage/focus-repository';
import { Platform } from '../utils/platform';
import { ensureNotifyPermission } from '@cadence/notifications/permission';
import { notify } from '@cadence/notifications/notifier';
import { showToast, isInstallAvailable, requestInstall } from '../services/pwa';
/**
 * Wire up and hydrate the Settings panel UI.
 */
export function setupSettingsPanel(container, opts) {
    let current = { ...opts.initial };
    const selTheme = container.querySelector('#theme');
    const selMode = container.querySelector('#timer-mode');
    const selTimerSize = container.querySelector('#timer-size');
    const selTabsPlacement = container.querySelector('#tabs-placement');
    const chkMini = container.querySelector('#mini-toggle');
    const chkSound = container.querySelector('#sound-toggle');
    const selSound = container.querySelector('#sound-pack');
    const chkNotify = container.querySelector('#notify-toggle');
    const btnNotifyTest = container.querySelector('#notify-test');
    const chkMiniTrans = container.querySelector('#mini-trans');
    const chkPinTop = container.querySelector('#pin-top');
    const chkConfirmStart = container.querySelector('#confirm-start');
    const inpCountdown = container.querySelector('#countdown-sec');
    const inpScStartPause = container.querySelector('#sc-startpause');
    const inpScTabTimer = container.querySelector('#sc-tab-timer');
    const inpScTabTemplates = container.querySelector('#sc-tab-templates');
    const inpScTabSettings = container.querySelector('#sc-tab-settings');
    const inpScHelp = container.querySelector('#sc-help');
    const selAccent = container.querySelector('#accent-preset');
    const chkCompactHeader = container.querySelector('#compact-header');
    const selGlass = container.querySelector('#glass-effect');
    const selDensity = container.querySelector('#header-density');
    const inpRadius = container.querySelector('#frame-radius');
    const selShadow = container.querySelector('#frame-shadow');
    const elMini = document.querySelector('#mini');
    const btnInstall = container.querySelector('#btn-install') || null;
    const save = async (next) => {
        current = { ...next };
        await FocusRepository.saveSettings({ settings: current });
        if (opts.onChange)
            opts.onChange(current);
    };
    if (btnInstall) {
        const updateInstallBtn = () => { if (btnInstall)
            btnInstall.style.display = isInstallAvailable() ? '' : 'none'; };
        window.addEventListener('cadence:install-available', updateInstallBtn);
        updateInstallBtn();
        btnInstall.onclick = async () => {
            const res = await requestInstall();
            if (res === 'accepted')
                showToast('App installed.');
            else if (res === 'dismissed')
                showToast('Install dismissed.');
            else
                showToast('Install not available.');
            updateInstallBtn();
        };
    }
    const hydrate = (s) => {
        document.documentElement.setAttribute('data-theme', s.theme ?? 'dark');
        document.documentElement.setAttribute('data-accent', s.accentPreset ?? 'default');
        if (s.compactHeader)
            document.documentElement.setAttribute('data-compact-header', '1');
        else
            document.documentElement.removeAttribute('data-compact-header');
        const density = (s.headerDensity ?? (s.compactHeader ? 'compact' : 'normal'));
        document.documentElement.setAttribute('data-header-density', density);
        const radius = Number.isFinite(s.frameRadius ?? 0) ? s.frameRadius : 16;
        document.documentElement.style.setProperty('--frame-radius', `${Math.max(4, Math.min(28, radius))}px`);
        const defaultShadow = Platform.isDesktop ? 'medium' : 'medium';
        document.documentElement.setAttribute('data-frame-shadow', (s.frameShadow ?? defaultShadow));
        document.documentElement.setAttribute('data-glass', (s.glassEffect ?? 'off'));
        selTheme.value = s.theme ?? 'dark';
        selMode.value = s.timerMode ?? 'digital';
        selTimerSize.value = s.timerSize ?? 'l';
        selTabsPlacement.value = s.tabsPlacement ?? 'top';
        chkMini.checked = Boolean(s.miniWindowEnabled);
        chkSound.checked = Boolean(s.soundEnabled);
        chkNotify.checked = Boolean(s.notificationsEnabled);
        chkMiniTrans.checked = Boolean(s.miniTransparent);
        selSound.value = (s.soundPack ?? 'beep');
        chkPinTop.checked = Boolean(s.pinToTop ?? true);
        chkConfirmStart.checked = Boolean(s.askConfirmBeforeStart ?? true);
        inpCountdown.value = String(Number.isFinite(s.startCountdownSeconds ?? 0) ? (s.startCountdownSeconds ?? 0) : 0);
        inpScStartPause.value = s.shortcutStartPause ?? 'Space';
        inpScTabTimer.value = s.shortcutTimerTab ?? 't';
        inpScTabTemplates.value = s.shortcutTemplatesTab ?? 'e';
        inpScTabSettings.value = s.shortcutSettingsTab ?? 's';
        inpScHelp.value = s.shortcutHelp ?? '?';
        selAccent.value = s.accentPreset ?? 'default';
        chkCompactHeader.checked = Boolean(s.compactHeader);
        selGlass.value = s.glassEffect ?? 'off';
        selDensity.value = (s.headerDensity ?? (s.compactHeader ? 'compact' : 'normal'));
        inpRadius.value = String(Number.isFinite(s.frameRadius ?? 0) ? (s.frameRadius ?? 16) : 16);
        selShadow.value = s.frameShadow ?? 'medium';
        elMini.classList.toggle('show', Boolean(s.miniWindowEnabled));
        if (btnInstall)
            btnInstall.style.display = isInstallAvailable() ? '' : 'none';
    };
    // Bind handlers
    selTheme.onchange = () => { void save({ ...current, theme: selTheme.value }); };
    selAccent.onchange = () => { document.documentElement.setAttribute('data-accent', selAccent.value); void save({ ...current, accentPreset: selAccent.value }); };
    chkCompactHeader.onchange = () => { const next = { ...current, compactHeader: chkCompactHeader.checked }; if (chkCompactHeader.checked)
        document.documentElement.setAttribute('data-compact-header', '1');
    else
        document.documentElement.removeAttribute('data-compact-header'); void save(next); };
    selGlass.onchange = () => { document.documentElement.setAttribute('data-glass', selGlass.value); void save({ ...current, glassEffect: selGlass.value }); };
    selDensity.onchange = () => { document.documentElement.setAttribute('data-header-density', selDensity.value); void save({ ...current, headerDensity: selDensity.value }); };
    inpRadius.onchange = () => { const n = Math.max(4, Math.min(28, Math.floor(Number(inpRadius.value) || 16))); inpRadius.value = String(n); document.documentElement.style.setProperty('--frame-radius', `${n}px`); void save({ ...current, frameRadius: n }); };
    selShadow.onchange = () => { document.documentElement.setAttribute('data-frame-shadow', selShadow.value); void save({ ...current, frameShadow: selShadow.value }); };
    selMode.onchange = () => { void save({ ...current, timerMode: selMode.value }); };
    selTimerSize.onchange = () => { void save({ ...current, timerSize: selTimerSize.value }); };
    // Tabs placement onchange is handled by tabs.ts, but keep hydration
    chkMini.onchange = async () => {
        const enabled = chkMini.checked;
        elMini.classList.toggle('show', enabled);
        await save({ ...current, miniWindowEnabled: enabled });
        try {
            if (Platform.isDesktop) {
                const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
                const existing = WebviewWindow.getByLabel ? WebviewWindow.getByLabel('mini') : undefined;
                if (enabled) {
                    if (!existing)
                        new WebviewWindow('mini', { width: 240, height: 90, decorations: false, resizable: false, alwaysOnTop: true, transparent: Boolean(current.miniTransparent), url: '/?mini=1' });
                }
                else {
                    if (existing)
                        existing.close();
                }
            }
        }
        catch { }
    };
    chkMiniTrans.onchange = async () => {
        await save({ ...current, miniTransparent: chkMiniTrans.checked });
        try {
            if (Platform.isDesktop && current.miniWindowEnabled) {
                const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
                const existing = WebviewWindow.getByLabel ? WebviewWindow.getByLabel('mini') : undefined;
                if (existing)
                    await existing.close();
                new WebviewWindow('mini', { width: 240, height: 90, decorations: false, resizable: false, alwaysOnTop: true, transparent: Boolean(current.miniTransparent), url: '/?mini=1' });
            }
        }
        catch { }
    };
    chkSound.onchange = () => { void save({ ...current, soundEnabled: chkSound.checked }); };
    selSound.onchange = () => { void save({ ...current, soundPack: selSound.value }); };
    chkPinTop.onchange = () => { void save({ ...current, pinToTop: chkPinTop.checked }); };
    chkConfirmStart.onchange = () => { void save({ ...current, askConfirmBeforeStart: chkConfirmStart.checked }); };
    inpCountdown.onchange = () => { const n = Math.max(0, Math.min(10, Math.floor(Number(inpCountdown.value) || 0))); inpCountdown.value = String(n); void save({ ...current, startCountdownSeconds: n }); };
    inpScStartPause.onchange = () => { void save({ ...current, shortcutStartPause: inpScStartPause.value }); };
    inpScTabTimer.onchange = () => { void save({ ...current, shortcutTimerTab: inpScTabTimer.value }); };
    inpScTabTemplates.onchange = () => { void save({ ...current, shortcutTemplatesTab: inpScTabTemplates.value }); };
    inpScTabSettings.onchange = () => { void save({ ...current, shortcutSettingsTab: inpScTabSettings.value }); };
    inpScHelp.onchange = () => { void save({ ...current, shortcutHelp: inpScHelp.value }); };
    btnNotifyTest.onclick = async () => {
        const granted = await ensureNotifyPermission();
        if (!granted) {
            showToast('Notifications permission denied');
            return;
        }
        await notify({ title: 'Cadence: Test', body: 'Notification test' });
    };
    chkNotify.onchange = async () => {
        if (chkNotify.checked) {
            const proceed = window.confirm('Enable system notifications? You can change this later in Settings.');
            if (!proceed) {
                chkNotify.checked = false;
                return;
            }
            const granted = await ensureNotifyPermission();
            if (!granted) {
                chkNotify.checked = false;
                showToast('Notifications permission denied');
                return;
            }
        }
        await save({ ...current, notificationsEnabled: chkNotify.checked });
    };
    hydrate(current);
    return { get: () => current };
}
