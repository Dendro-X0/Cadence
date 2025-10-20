/**
 * Show a countdown overlay before starting.
 */
export function showCountdownOverlay(seconds, onDone) {
    const root = document.body;
    const wrap = document.createElement('div');
    wrap.className = 'overlay';
    wrap.innerHTML = `
    <div class="overlay__card">
      <div class="overlay__title">Starting...</div>
      <div class="overlay__count" id="ov-count">${seconds}</div>
      <div class="overlay__actions">
        <button class="btn" id="ov-start-now">Start now</button>
        <button class="btn secondary" id="ov-cancel">Cancel</button>
      </div>
    </div>`;
    root.appendChild(wrap);
    const elCount = wrap.querySelector('#ov-count');
    const btnCancel = wrap.querySelector('#ov-cancel');
    const btnNow = wrap.querySelector('#ov-start-now');
    let left = seconds;
    let done = false;
    const cleanup = () => { if (wrap.parentElement)
        wrap.parentElement.removeChild(wrap); };
    const finish = () => { if (done)
        return; done = true; cleanup(); onDone(); };
    const tick = () => {
        if (left <= 0) {
            finish();
            return;
        }
        elCount.textContent = String(left);
        left -= 1;
        window.setTimeout(tick, 1000);
    };
    btnCancel.onclick = () => { done = true; cleanup(); };
    btnNow.onclick = () => finish();
    window.setTimeout(tick, 1000);
}
