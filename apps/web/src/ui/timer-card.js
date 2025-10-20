import { Time } from '../utils/time';
export function setupTimerCard(container) {
    const elTime = container.querySelector('#time');
    const elMinutes = container.querySelector('#minutes');
    const elStart = container.querySelector('#start');
    const elPause = container.querySelector('#pause');
    const elReset = container.querySelector('#reset');
    const elSkip = container.querySelector('#skip');
    const elExtend = container.querySelector('#extend');
    const elBlockNow = container.querySelector('#block-now');
    const elBlockNext = container.querySelector('#block-next');
    const elNowChip = container.querySelector('#now-chip');
    const circleWrap = container.querySelector('#circle');
    const circleProg = container.querySelector('#circle-prog');
    const circleCenter = container.querySelector('#circle-center');
    const elMini = document.querySelector('#mini');
    const elMiniTime = document.querySelector('#mini-time');
    const timerCard = container.querySelector('.card.timer');
    const totalCircumference = 2 * Math.PI * 100;
    circleProg.setAttribute('stroke-dasharray', String(totalCircumference));
    const setMode = (mode) => {
        timerCard.classList.add('mode-switch');
        window.setTimeout(() => timerCard.classList.remove('mode-switch'), 250);
        timerCard.classList.toggle('timer--digital', mode === 'digital');
        timerCard.classList.toggle('timer--circular', mode === 'circular');
        circleWrap.classList.toggle('show', mode === 'circular');
    };
    const setTimerSize = (size) => {
        timerCard.classList.toggle('timer-size-s', size === 's');
        timerCard.classList.toggle('timer-size-m', size === 'm');
        timerCard.classList.toggle('timer-size-l', size === 'l');
    };
    const setTime = (ms) => {
        const t = Time.toTime(ms);
        elTime.textContent = t;
        circleCenter.textContent = t;
        if (elMini && elMiniTime)
            elMiniTime.textContent = t;
        try {
            localStorage.setItem('cadence_tick', String(ms));
        }
        catch { }
        const emitFn = window.__emitTick;
        if (emitFn) {
            emitFn('cadence:tick', { ms }).catch(() => { });
        }
        const totalMs = Number(circleWrap.dataset.totalms || '0');
        if (totalMs > 0) {
            const progress = Math.min(1, Math.max(0, 1 - ms / totalMs));
            const offset = totalCircumference * progress;
            circleProg.setAttribute('stroke-dashoffset', String(offset));
        }
    };
    const onStart = (cb) => { elStart.onclick = () => { cb(); setTransport('running'); }; };
    const onPause = (cb) => { elPause.onclick = () => { cb(); setTransport('paused'); }; };
    const onReset = (cb) => { elReset.onclick = () => cb(sanitize(elMinutes.value)); };
    const onSkip = (cb) => { elSkip.onclick = () => cb(); };
    const onExtend = (cb) => { elExtend.onclick = () => cb(1); };
    const setBlockLabels = (now, next, type) => {
        elBlockNow.textContent = now ? `Now: ${now}` : '';
        elBlockNext.textContent = next ? `Next: ${next}` : '';
        if (now) {
            elNowChip.textContent = now;
            elNowChip.hidden = false;
            elNowChip.dataset.type = type ?? '';
        }
        else {
            elNowChip.hidden = true;
            elNowChip.textContent = '';
        }
    };
    const setTotal = (ms) => { circleWrap.dataset.totalms = String(ms); };
    const setTransport = (state) => {
        elStart.classList.toggle('active', state === 'running');
        elPause.classList.toggle('active', state === 'paused');
    };
    const pulseBlock = () => { circleWrap.classList.add('block-pop'); window.setTimeout(() => circleWrap.classList.remove('block-pop'), 260); };
    return { setTime, onStart, onPause, onReset, onSkip, onExtend, setBlockLabels, setTotal, setTransport, pulseBlock, setMode, setTimerSize };
}
function sanitize(raw) {
    const n = Math.max(1, Math.min(180, Math.floor(Number(raw) || 25)));
    return n;
}
