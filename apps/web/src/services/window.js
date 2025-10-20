import { Platform } from '../utils/platform';
/**
 * Initialize desktop-only window chrome (frameless custom controls).
 * No-op on web.
 */
export async function initDesktopWindowControls() {
    if (!Platform.isDesktop)
        return;
    document.documentElement.setAttribute('data-platform', 'desktop');
    // Reveal custom window buttons
    const controls = document.querySelector('.win-controls');
    if (controls)
        controls.style.display = 'flex';
    // Resolve current Tauri window
    let win = null;
    try {
        const mod = await import('@tauri-apps/api/window');
        win = mod?.appWindow ?? (typeof mod?.getCurrent === 'function' ? mod.getCurrent() : null);
    }
    catch {
        // ignore
    }
    const btnMin = document.querySelector('#win-min');
    const btnMax = document.querySelector('#win-max');
    const btnClose = document.querySelector('#win-close');
    if (win && btnMin)
        btnMin.onclick = () => { try {
            void win.minimize();
        }
        catch { } };
    if (win && btnMax)
        btnMax.onclick = async () => { try {
            (await win.isMaximized()) ? void win.unmaximize() : void win.maximize();
        }
        catch { } };
    if (win && btnClose)
        btnClose.onclick = () => { try {
            void win.close();
        }
        catch { } };
    // Header double-click toggles maximize/restore
    const header = document.querySelector('.header');
    if (win && header)
        header.ondblclick = async () => { try {
            (await win.isMaximized()) ? void win.unmaximize() : void win.maximize();
        }
        catch { } };
}
