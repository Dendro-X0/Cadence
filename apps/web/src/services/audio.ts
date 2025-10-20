/**
 * Simple audio helpers for UI feedback.
 */
export function beep(freq: number, ms: number): void {
  const Ctx: typeof AudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? AudioContext
  const ctx = new Ctx()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.value = freq
  o.connect(g); g.connect(ctx.destination)
  g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + ms / 1000)
  o.start(); o.stop(ctx.currentTime + ms / 1000)
}

export function chime(kind: 'end'|'complete'): void {
  if (kind === 'end') {
    beep(660, 100); window.setTimeout(() => beep(880, 130), 140)
  } else {
    beep(523.25, 120); window.setTimeout(() => beep(659.25, 120), 150); window.setTimeout(() => beep(783.99, 160), 300)
  }
}
