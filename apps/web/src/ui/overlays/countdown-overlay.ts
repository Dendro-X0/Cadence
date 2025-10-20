
/**
 * Show a countdown overlay before starting.
 */
export function showCountdownOverlay(seconds: number, onDone: () => void): void {
  const root = document.body
  const wrap = document.createElement('div')
  wrap.className = 'overlay'
  wrap.innerHTML = `
    <div class="overlay__card">
      <div class="overlay__title">Starting...</div>
      <div class="overlay__count" id="ov-count">${seconds}</div>
      <div class="overlay__actions">
        <button class="btn" id="ov-start-now">Start now</button>
        <button class="btn secondary" id="ov-cancel">Cancel</button>
      </div>
    </div>`
  root.appendChild(wrap)
  const elCount = wrap.querySelector<HTMLDivElement>('#ov-count')!
  const btnCancel = wrap.querySelector<HTMLButtonElement>('#ov-cancel')!
  const btnNow = wrap.querySelector<HTMLButtonElement>('#ov-start-now')!
  let left = seconds
  let done = false
  const cleanup = (): void => { if (wrap.parentElement) wrap.parentElement.removeChild(wrap) }
  const finish = (): void => { if (done) return; done = true; cleanup(); onDone() }
  const tick = (): void => {
    if (left <= 0) { finish(); return }
    elCount.textContent = String(left)
    left -= 1
    window.setTimeout(tick, 1000)
  }
  btnCancel.onclick = () => { done = true; cleanup() }
  btnNow.onclick = () => finish()
  window.setTimeout(tick, 1000)
}
