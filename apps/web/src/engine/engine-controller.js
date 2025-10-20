import { appConstants } from '@cadence/core-domain/constants';
import { FocusTimer } from '@cadence/core-domain/focus-timer';
import { ScheduleEngine } from '@cadence/core-domain/schedule-engine';
import { notify } from '@cadence/notifications/notifier';
import { beep, chime } from '../services/audio';
export function wireEngineAndTimer(args) {
    const { ui, onActiveLabelChange, onBlockTypeChange } = args;
    let prefs = { ...args.prefs };
    const initialMs = (prefs.sessionMinutes ?? args.defaultMinutes) * appConstants.msPerMinute;
    const timer = new FocusTimer({ durationMs: initialMs, onTick: (ms) => ui.setTime(ms) });
    window.__timer = timer;
    ui.setTotal(initialMs);
    ui.onStart(() => timer.start());
    ui.onPause(() => timer.pause());
    ui.onReset((mins) => { const ms = mins * appConstants.msPerMinute; ui.setTotal(ms); timer.reset({ durationMs: ms }); });
    ui.setTime(timer.remainingMs());
    ui.setTransport('idle');
    let engine = null;
    let activeLabel = null;
    const startWithTemplate = (tpl) => {
        engine?.reset();
        engine = new ScheduleEngine({
            template: tpl,
            events: {
                onBlockStart: (_i, b) => {
                    activeLabel = b.label;
                    if (onActiveLabelChange)
                        onActiveLabelChange(activeLabel);
                    ui.setBlockLabels(b.label, engine?.nextBlock()?.label ?? null, b.type);
                    ui.setTotal(b.durationMinutes * appConstants.msPerMinute);
                    ui.pulseBlock();
                    if (onBlockTypeChange)
                        onBlockTypeChange(b.type);
                },
                onTick: (ms) => ui.setTime(ms),
                onBlockEnd: () => {
                    if (prefs.soundEnabled) {
                        if ((prefs.soundPack ?? 'beep') === 'chime')
                            chime('end');
                        else
                            beep(880, 140);
                    }
                    if (prefs.notificationsEnabled)
                        notify({ title: 'Block complete', body: 'Next block starting' }).catch(() => { });
                },
                onComplete: () => {
                    activeLabel = 'Done';
                    if (onActiveLabelChange)
                        onActiveLabelChange(activeLabel);
                    ui.setBlockLabels('Done', null);
                    window.__engine = undefined;
                    ui.setTransport('idle');
                }
            }
        });
        window.__engine = engine;
        engine.start();
        // Hook transport controls to engine while running
        ui.onStart(() => engine?.start());
        ui.onPause(() => engine?.pause());
        ui.onReset((_mins) => { engine?.reset(); ui.setTransport('idle'); });
        ui.setTransport('running');
    };
    return {
        startWithTemplate,
        timer,
        setPrefs: (p) => { prefs = { ...p }; },
        hasEngine: () => Boolean(engine),
        startOrResume: () => { if (engine)
            engine.start();
        else
            timer.start(); },
        pauseCurrent: () => { if (engine)
            engine.pause();
        else
            timer.pause(); },
        skip: () => { engine?.skip(); },
        extend: (minutes) => { if (engine)
            engine.extend({ minutes }); }
    };
}
