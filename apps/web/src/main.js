import './styles.css';
import { appConstants } from '@cadence/core-domain/constants';
// Engine/timer are handled by engine-controller
import { FocusRepository } from '@cadence/storage/focus-repository';
import { builtInTemplates } from '@cadence/templates/defaults';
import { setupPwa, showToast } from './services/pwa';
// notifications handled within settings panel
import { Time } from './utils/time';
import { Platform } from './utils/platform';
import { showCountdownOverlay } from './ui/overlays/countdown-overlay';
import { showShortcutsOverlay } from './ui/overlays/shortcuts-overlay';
import { initDesktopWindowControls } from './services/window';
import { wireEngineAndTimer } from './engine/engine-controller';
import { renderTemplatesGallery } from './ui/templates-gallery';
import { setAccent } from './ui/colors';
import { setupTimerCard } from './ui/timer-card';
import { setupTabs } from './ui/tabs';
import { renderQuickChips } from './ui/templates-chips';
import { setupSettingsPanel } from './ui/settings-panel';
import { setupTemplateBuilder } from './ui/template-builder';
// time formatting moved to utils/time
// ensures pager container exists within gallery card
function ensurePager(galleryCard) {
    let pager = galleryCard.querySelector('.pager-host');
    if (!pager) {
        pager = document.createElement('div');
        pager.className = 'pager-host';
        galleryCard.appendChild(pager);
    }
    return pager;
}
const defaults = { sessionMinutes: appConstants.defaultSessionMinutes, autoStart: false };
export async function main() {
    const isMini = new URL(location.href).searchParams.get('mini') === '1';
    setupPwa();
    if (isMini) {
        renderMini();
        return;
    }
    const isDesktop = Platform.isDesktop;
    let tauriEmit = null;
    let tauriInvoke = null;
    let activeLabel = null;
    if (isDesktop) {
        try {
            const { emit, listen } = await import('@tauri-apps/api/event');
            tauriEmit = emit;
            const { invoke } = await import('@tauri-apps/api/core');
            tauriInvoke = invoke;
            // Listen for tray actions
            await listen('cadence:tray', async (ev) => {
                const action = ev?.payload?.action;
                switch (action) {
                    case 'start':
                        controller.startOrResume();
                        break;
                    case 'pause':
                        controller.pauseCurrent();
                        break;
                    case 'skip':
                        controller.skip();
                        break;
                    case 'extend': {
                        const mins = ev?.payload?.minutes ?? 1;
                        controller.extend(mins);
                        break;
                    }
                    case 'toggle_mini': {
                        try {
                            const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
                            const existing = WebviewWindow.getByLabel ? WebviewWindow.getByLabel('mini') : undefined;
                            const enable = !Boolean(window.__mini);
                            if (enable && !existing)
                                new WebviewWindow('mini', { width: 240, height: 90, decorations: false, resizable: false, alwaysOnTop: true, url: '/?mini=1' });
                            if (!enable && existing)
                                existing.close();
                            window.__mini = enable;
                            // persist setting
                            const next = { ...prefs, miniWindowEnabled: enable };
                            await FocusRepository.saveSettings({ settings: next });
                            prefs = next;
                        }
                        catch { }
                        break;
                    }
                    default:
                        break;
                }
            });
        }
        catch { }
    }
    ;
    window.__emitTick = async (e, p) => {
        if (tauriEmit) {
            await tauriEmit(e, p);
        }
        if (e === 'cadence:tick' && tauriInvoke) {
            const ms = p?.ms ?? 0;
            const text = `${Time.toTime(ms)}${activeLabel ? ` - ${activeLabel}` : ''}`;
            try {
                await tauriInvoke('set_tray_tooltip', { text });
            }
            catch { }
        }
    };
    const { settings } = await FocusRepository.loadSettings(defaults);
    let prefs = { ...settings };
    const ui = buildUI({ settings });
    ui.onPrefsChanged?.((s) => { prefs = s; void refreshTemplatesUI?.(); });
    // Re-render templates UI when requested (e.g., delete)
    window.addEventListener('cadence:refreshTemplates', () => { void refreshTemplatesUI?.(); });
    // Engine + Timer controller
    const controller = wireEngineAndTimer({
        ui,
        prefs: settings,
        defaultMinutes: appConstants.defaultSessionMinutes,
        onActiveLabelChange: (label) => { activeLabel = label; },
        onBlockTypeChange: (t) => setAccent(t)
    });
    ui.onPrefsChanged?.((s) => { prefs = s; controller.setPrefs(s); void refreshTemplatesUI?.(); });
    // Wire transport extras
    ui.onSkip(() => controller.skip());
    ui.onExtend((minutes) => controller.extend(minutes));
    // Wrapper adds confirm + optional countdown before delegating to controller
    const startTemplateWithConfirm = (tpl) => {
        const needConfirm = (prefs.askConfirmBeforeStart ?? true);
        if (needConfirm) {
            const ok = window.confirm(`Start "${tpl.name}" now?`);
            if (!ok)
                return;
        }
        const delaySec = Math.max(0, Number(prefs.startCountdownSeconds ?? 3));
        const go = () => controller.startWithTemplate(tpl);
        if (delaySec > 0)
            showCountdownOverlay(delaySec, go);
        else
            go();
    };
    // No tasks section anymore
    // Templates UI: chips + gallery with pin support
    let chipsExpanded = false;
    let lastChips = [];
    let shortcutsBound = false;
    const isTimerActive = () => {
        const el = document.querySelector('#view-timer');
        return Boolean(el && el.style.display !== 'none');
    };
    const norm = (s) => {
        const v = s.trim();
        if (v.toLowerCase() === 'space')
            return ' ';
        return v.length === 1 ? v.toLowerCase() : v;
    };
    const togglePlay = () => {
        if (controller.hasEngine()) {
            controller.pauseCurrent();
        }
        else {
            controller.startOrResume();
        }
    };
    const bindShortcuts = () => {
        if (shortcutsBound)
            return;
        shortcutsBound = true;
        document.addEventListener('keydown', (e) => {
            const helpKey = norm(prefs.shortcutHelp ?? '?');
            const spKey = norm(prefs.shortcutStartPause ?? 'Space');
            const tabT = norm(prefs.shortcutTimerTab ?? 't');
            const tabTpl = norm(prefs.shortcutTemplatesTab ?? 'e');
            const tabSet = norm(prefs.shortcutSettingsTab ?? 's');
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable)
                return;
            if (e.ctrlKey || e.altKey || e.metaKey)
                return;
            const key = e.key;
            if (norm(key) === helpKey) {
                e.preventDefault();
                showShortcutsOverlay(prefs);
                return;
            }
            if (norm(key) === spKey) {
                e.preventDefault();
                togglePlay();
                return;
            }
            const clickTab = (page) => {
                const btn = document.querySelector(`button.tab[data-page="${page}"]`);
                btn?.click();
            };
            if (norm(key) === tabT) {
                e.preventDefault();
                clickTab('timer');
                return;
            }
            if (norm(key) === tabTpl) {
                e.preventDefault();
                clickTab('templates');
                return;
            }
            if (norm(key) === tabSet) {
                e.preventDefault();
                clickTab('settings');
                return;
            }
            if (!isTimerActive())
                return;
            if (key >= '1' && key <= '9') {
                const idx = Number(key) - 1;
                const tpl = lastChips[idx];
                if (tpl) {
                    e.preventDefault();
                    startTemplateWithConfirm(tpl);
                }
            }
        });
    };
    let galleryPage = 1;
    const PER_PAGE = 10;
    const refreshTemplatesUI = async () => {
        const quickEl = document.querySelector('#quick-templates');
        const btnMore = document.querySelector('#chips-more');
        const gallery = document.querySelector('#templates');
        const pagerHost = ensurePager(gallery);
        const { templates: savedTpls } = await FocusRepository.listTemplates();
        // Merge and de-duplicate by name: built-ins first, then saved
        const byName = new Map();
        const order = [];
        const pushUnique = (arr) => {
            arr.forEach((t) => { if (!byName.has(t.name)) {
                byName.set(t.name, t);
                order.push(t.name);
            } });
        };
        pushUnique(builtInTemplates);
        pushUnique(savedTpls);
        const pinned = prefs.pinnedTemplateNames ?? [];
        const pinFirst = (prefs.pinToTop ?? true);
        const orderedAll = pinFirst
            ? [
                ...pinned.map((n) => byName.get(n)).filter(Boolean),
                ...order.filter((n) => !pinned.includes(n)).map((n) => byName.get(n)).filter(Boolean)
            ]
            : order.map((n) => byName.get(n)).filter(Boolean);
        // Render chips with color code and tooltip
        if (quickEl) {
            const LIMIT = 6;
            const sliceForCollapsed = () => {
                // Ensure all pinned are visible when collapsed; fill remaining slots with next templates
                const pinnedTpls = orderedAll.filter((t) => pinned.includes(t.name));
                const rest = orderedAll.filter((t) => !pinned.includes(t.name));
                const out = [...pinnedTpls];
                for (const t of rest) {
                    if (out.length >= LIMIT)
                        break;
                    out.push(t);
                }
                return out;
            };
            const items = chipsExpanded ? orderedAll : sliceForCollapsed();
            lastChips = items;
            renderQuickChips(quickEl, { items, pinned, onStart: (tpl) => startTemplateWithConfirm(tpl) });
            if (btnMore) {
                const needsMore = orderedAll.length > LIMIT;
                btnMore.style.display = needsMore ? '' : 'none';
                btnMore.textContent = chipsExpanded ? 'Less' : 'More';
                if (!btnMore.onclick) {
                    btnMore.onclick = () => { chipsExpanded = !chipsExpanded; void refreshTemplatesUI(); };
                }
            }
        }
        // Paginate for gallery (orderedAll includes built-ins + saved)
        const totalPages = Math.max(1, Math.ceil(orderedAll.length / PER_PAGE));
        galleryPage = Math.min(Math.max(1, galleryPage), totalPages);
        const pageStart = (galleryPage - 1) * PER_PAGE;
        const pageItems = orderedAll.slice(pageStart, pageStart + PER_PAGE);
        // Render gallery with pin state and delete for saved
        renderTemplatesGallery(gallery, {
            templates: pageItems,
            onStart: (tpl) => { startTemplateWithConfirm(tpl); },
            onSave: async (tpl) => { await FocusRepository.saveTemplate({ tpl }); showToast('Template saved.'); await refreshTemplatesUI(); },
            pinnedNames: pinned,
            onTogglePin: async (name, nextPinned) => {
                const curr = new Set(prefs.pinnedTemplateNames ?? []);
                if (nextPinned)
                    curr.add(name);
                else
                    curr.delete(name);
                const updated = { ...prefs, pinnedTemplateNames: Array.from(curr) };
                await FocusRepository.saveSettings({ settings: updated });
                prefs = updated;
                await refreshTemplatesUI();
            }
        });
        // Render pager
        pagerHost.innerHTML = `
      <div class="pager">
        <button class="btn secondary" data-prev ${galleryPage <= 1 ? 'disabled' : ''}>Prev</button>
        <span class="pager__info">Page ${galleryPage} / ${totalPages}</span>
        <button class="btn secondary" data-next ${galleryPage >= totalPages ? 'disabled' : ''}>Next</button>
      </div>`;
        const prev = pagerHost.querySelector('button[data-prev]');
        const next = pagerHost.querySelector('button[data-next]');
        prev.onclick = () => { if (galleryPage > 1) {
            galleryPage--;
            void refreshTemplatesUI();
        } };
        next.onclick = () => { if (galleryPage < totalPages) {
            galleryPage++;
            void refreshTemplatesUI();
        } };
    };
    await refreshTemplatesUI();
    // Builder
    setupTemplateBuilder();
    // Enable global shortcuts
    bindShortcuts();
    // Desktop window controls
    if (isDesktop) {
        await initDesktopWindowControls();
    }
}
function buildUI({ settings }) {
    const root = document.querySelector('#app');
    const container = document.createElement('div');
    container.className = 'frame';
    container.innerHTML = `
    <div class="header" data-tauri-drag-region="true">
      <div class="brand"><img class="brand__logo" src="/favicon.svg" alt=""/><span class="brand__title">Focus Motive</span></div>
      <div class="settings">
        <label for="minutes">Minutes</label><input id="minutes" class="input no-drag" type="number" min="${appConstants.minSessionMinutes}" max="${appConstants.maxSessionMinutes}" />
        <button id="gear" class="btn gear no-drag" title="Settings">⚙</button>
        <div class="win-controls no-drag">
          <button id="win-min" class="btn secondary" title="Minimize" aria-label="Minimize">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="7" width="10" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button id="win-max" class="btn secondary" title="Maximize" aria-label="Maximize">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2.5" y="2.5" width="9" height="9" rx="1.2" stroke="currentColor"/>
            </svg>
          </button>
          <button id="win-close" class="btn danger" title="Close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="container">
    <div class="tabs" id="tabs-top">
      <button class="tab active" data-page="timer">Timer</button>
      <button class="tab" data-page="templates">Templates</button>
      <button class="tab" data-page="settings">Settings</button>
    </div>
    <div id="view-timer" class="page">
    <div class="card timer">
      <div class="timer__display">
        <div class="now-chip" id="now-chip" hidden></div>
        <div class="time" id="time">00:00</div>
        <div class="circle-wrap" id="circle">
          <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true">
            <circle class="circle-bg" cx="120" cy="120" r="100" />
            <circle class="circle-prog" id="circle-prog" cx="120" cy="120" r="100" stroke-dasharray="628" stroke-dashoffset="0" />
          </svg>
          <div class="circle-center" id="circle-center">25:00</div>
        </div>
      </div>
      <div class="block-labels">
        <div id="block-now" class="task-title"></div>
        <div id="block-next" class="task-title" style="opacity:.7"></div>
      </div>
      <div class="controls">
        <button id="start" class="btn">Start</button>
        <button id="pause" class="btn secondary">Pause</button>
        <button id="reset" class="btn secondary">Reset</button>
        <button id="skip" class="btn secondary">Skip</button>
        <button id="extend" class="btn secondary">+1m</button>
      </div>
      <div class="chips" id="quick-templates"></div>
      <div class="chips-actions">
        <button id="chips-more" class="btn secondary">More</button>
      </div>
    </div>
    <div class="card tasks">
      <div style="display:flex;justify-content:center;">
        <button id="manage-templates-bottom" class="btn secondary">Manage Templates</button>
      </div>
    </div>
    </div><!-- /view-timer -->
    <div class="tabs tabs-bottom" id="tabs-bottom">
      <button class="tab active" data-page="timer">Timer</button>
      <button class="tab" data-page="templates">Templates</button>
      <button class="tab" data-page="settings">Settings</button>
    </div>
    <div id="view-templates" class="page">
    <div class="card" id="templates">
      <div style="font-weight:700;margin-bottom:8px;">Templates</div>
      <div id="template-list"></div>
      <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px;">
          <div style="font-weight:700;margin-bottom:8px;">New Custom Template</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input id="tpl-name" class="input" placeholder="Name" style="width:180px" />
          <input id="tpl-duration" class="input" type="number" min="1" max="180" placeholder="Minutes" style="width:120px" />
          <input id="tpl-repeat" class="input" type="number" min="1" max="12" value="1" style="width:100px" />
          <button id="tpl-save" class="btn">Save Template</button>
          </div>
          <div id="tpl-blocks" style="margin-top:8px;display:flex;flex-direction:column;gap:6px;"></div>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <button id="tpl-add" class="btn secondary">Add Block</button>
            <div id="tpl-total" class="task-title" style="margin-top:6px;opacity:.85">Total: 0 min</div>
          </div>
        </div>
      </div>
    </div><!-- /view-templates -->
    <div id="view-settings" class="page">
    <div class="settings-panel" id="settings-panel">
      <div style="font-weight:700;margin-bottom:8px;">Settings</div>
      <div class="settings-row"><span>Theme</span>
        <select id="theme" class="select">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="amoled">AMOLED</option>
        </select>
      </div>
      <div class="settings-row"><span>Timer Mode</span>
        <select id="timer-mode" class="select">
          <option value="digital">Digital</option>
          <option value="circular">Circular</option>
        </select>
      </div>
      <div class="settings-row"><span>Timer Size</span>
        <select id="timer-size" class="select">
          <option value="s">Small</option>
          <option value="m">Medium</option>
          <option value="l">Large</option>
        </select>
      </div>
      <div class="settings-row"><span>Tabs Placement</span>
        <select id="tabs-placement" class="select">
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>
      <div class="settings-row"><span>Sound</span>
        <input type="checkbox" id="sound-toggle" class="switch" />
      </div>
      <div class="settings-row"><span>Sound Pack</span>
        <select id="sound-pack" class="select">
          <option value="beep">Beep</option>
          <option value="chime">Chime</option>
        </select>
      </div>
      <div class="settings-row"><span>Notifications</span>
        <input type="checkbox" id="notify-toggle" class="switch" />
        <button id="notify-test" class="btn secondary" style="margin-left:8px;">Test</button>
      </div>
      <div class="settings-row"><span>Mini Bubble</span>
        <input type="checkbox" id="mini-toggle" class="switch" />
      </div>
      <div class="settings-row"><span>Mini Transparent</span>
        <input type="checkbox" id="mini-trans" class="switch" />
      </div>
      <div class="settings-row"><span>Pin Templates to Top</span>
        <input type="checkbox" id="pin-top" class="switch" />
      </div>
      <div class="settings-row"><span>Confirm Start</span>
        <input type="checkbox" id="confirm-start" class="switch" />
      </div>
      <div class="settings-row"><span>Countdown (s)</span>
        <input id="countdown-sec" class="input" type="number" min="0" max="10" style="width:90px" />
      </div>
      <div style="font-weight:700;margin:12px 0 6px;">Shortcuts</div>
      <div class="settings-row"><span>Start/Pause</span>
        <input id="sc-startpause" class="input" placeholder="e.g., Space" style="width:140px" />
      </div>
      <div class="settings-row"><span>Timer Tab</span>
        <input id="sc-tab-timer" class="input" placeholder="e.g., T" style="width:140px" />
      </div>
      <div class="settings-row"><span>Templates Tab</span>
        <input id="sc-tab-templates" class="input" placeholder="e.g., E" style="width:140px" />
      </div>
      <div class="settings-row"><span>Settings Tab</span>
        <input id="sc-tab-settings" class="input" placeholder="e.g., S" style="width:140px" />
      </div>
      <div class="settings-row"><span>Shortcuts Help</span>
        <input id="sc-help" class="input" placeholder="e.g., ?" style="width:140px" />
      </div>
      <div style="font-weight:700;margin:12px 0 6px;">Window</div>
      <div class="settings-row"><span>Glass Effect</span>
        <select id="glass-effect" class="select">
          <option value="off">Off</option>
          <option value="acrylic">Acrylic</option>
        </select>
      </div>
      <div class="settings-row"><span>Header Density</span>
        <select id="header-density" class="select">
          <option value="normal">Normal</option>
          <option value="compact">Compact</option>
          <option value="ultra">Ultra</option>
        </select>
      </div>
      <div class="settings-row"><span>Frame Radius</span>
        <input id="frame-radius" class="input" type="number" min="4" max="28" style="width:90px" />
      </div>
      <div class="settings-row"><span>Shadow Strength</span>
        <select id="frame-shadow" class="select">
          <option value="off">Off</option>
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="strong">Strong</option>
        </select>
      </div>
      <div class="settings-row"><span>Accent Preset</span>
        <select id="accent-preset" class="select">
          <option value="default">Default</option>
          <option value="ocean">Ocean</option>
          <option value="violet">Violet</option>
          <option value="sunset">Sunset</option>
        </select>
      </div>
      <div class="settings-row"><span>Compact Header</span>
        <input type="checkbox" id="compact-header" class="switch" />
      </div><!-- /view-settings -->
      <div class="settings-row"><span>Install</span>
        <button id="btn-install" class="btn secondary" style="display:none;">Install App</button>
      </div>
    </div><!-- /.container -->
  `;
    root.appendChild(container);
    const elMinutes = container.querySelector('#minutes');
    // tasks removed
    const elGear = container.querySelector('#gear');
    const panel = container.querySelector('#settings-panel');
    // Tabs wiring (top and bottom toolbars)
    const tabs = setupTabs(container, {
        panel,
        current: () => current,
        save: async (next) => { current = next; await FocusRepository.saveSettings({ settings: current }); if (onPrefs)
            onPrefs(current); }
    });
    const switchTo = (page) => tabs.switchTo(page);
    // Manage Templates button (bottom card)
    const btnManage = container.querySelector('#manage-templates-bottom');
    if (btnManage)
        btnManage.onclick = () => switchTo('templates');
    const timerUi = setupTimerCard(container);
    // mini bubble handled via settings panel + timer card; no direct refs here
    // local mutable copy of settings inside UI
    let current = { ...settings };
    let onPrefs;
    elMinutes.value = String(current.sessionMinutes);
    // Delegate settings hydration and handlers to settings-panel
    setupSettingsPanel(container, {
        initial: current,
        onChange: (s) => {
            current = s;
            timerUi.setMode(s.timerMode ?? 'digital');
            timerUi.setTimerSize(s.timerSize ?? 'l');
            if (onPrefs)
                onPrefs(current);
            tabs.applyTabsPlacement();
        }
    });
    timerUi.setMode(current.timerMode ?? 'digital');
    timerUi.setTimerSize(current.timerSize ?? 'l');
    tabs.applyTabsPlacement();
    // Initialize to last active tab (persisted)
    switchTo((current.activeTab ?? 'timer'));
    const setTime = (ms) => timerUi.setTime(ms);
    const onStart = (cb) => timerUi.onStart(cb);
    const onPause = (cb) => timerUi.onPause(cb);
    const onReset = (cb) => timerUi.onReset(cb);
    const onSkip = (cb) => timerUi.onSkip(cb);
    const onExtend = (cb) => timerUi.onExtend(cb);
    const setBlockLabels = (now, next, type) => timerUi.setBlockLabels(now, next, type);
    const setTransport = (state) => timerUi.setTransport(state);
    const pulseBlock = () => timerUi.pulseBlock();
    // gear opens Settings tab
    elGear.onclick = () => switchTo('settings');
    // settings change handlers are in settings-panel; only tabs placement resize is here
    window.addEventListener('resize', tabs.applyTabsPlacement);
    // engine state is managed by controller; no global assignment
    const setTotal = (ms) => { timerUi.setTotal(ms); };
    // expose settings change listener to outer scope
    const onPrefsChanged = (cb) => { onPrefs = cb; };
    return { setTime, onStart, onPause, onReset, onSkip, onExtend, setBlockLabels, setTotal, onPrefsChanged, setTransport, pulseBlock };
}
// audio helpers moved to services/audio and are used inside engine-controller
function renderMini() {
    const root = document.querySelector('#app');
    root.innerHTML = '';
    // make background transparent for Tauri transparent windows
    try {
        document.body.style.background = 'transparent';
    }
    catch { }
    const box = document.createElement('div');
    box.id = 'mini-standalone';
    box.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:28px;padding:8px;';
    box.setAttribute('data-tauri-drag-region', 'true');
    root.appendChild(box);
    const close = document.createElement('button');
    close.textContent = '×';
    close.title = 'Close';
    close.style.cssText = 'position:absolute;top:6px;right:6px;font-size:14px;line-height:14px;padding:4px 8px;border:none;border-radius:6px;background:rgba(0,0,0,0.25);color:#fff;cursor:pointer;';
    close.setAttribute('data-tauri-drag-region', 'false');
    close.onclick = async () => {
        if (Platform.isDesktop) {
            try {
                const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
                const w = WebviewWindow.getByLabel ? WebviewWindow.getByLabel('mini') : undefined;
                if (w)
                    await w.close();
            }
            catch { }
        }
        else {
            try {
                const { FocusRepository } = await import('./data/focus-repository');
                const { settings } = await FocusRepository.loadSettings(defaults);
                await FocusRepository.saveSettings({ settings: { ...settings, miniWindowEnabled: false } });
            }
            catch { }
        }
    };
    box.appendChild(close);
    const timeEl = document.createElement('div');
    timeEl.style.cssText = 'pointer-events:none;';
    box.appendChild(timeEl);
    const update = (ms) => { timeEl.textContent = Time.toTime(ms); };
    try {
        const ms = Number(localStorage.getItem('cadence_tick') || '0');
        if (ms)
            update(ms);
    }
    catch { }
    window.addEventListener('storage', (e) => { if (e.key === 'cadence_tick' && e.newValue)
        update(Number(e.newValue)); });
    if (Platform.isDesktop) {
        try {
            // dynamic import to avoid bundling for web
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            import('@tauri-apps/api/event').then((mod) => {
                const listen = mod.listen;
                listen('cadence:tick', (e) => {
                    const ms = e?.payload?.ms ?? 0;
                    if (ms > 0)
                        update(ms);
                }).catch(() => { });
            }).catch(() => { });
        }
        catch { }
    }
}
// escapeHtml moved to ./ui/templates-utils
// sanitizeMinutes moved to timer-card
// overlays moved to ./ui/overlays
