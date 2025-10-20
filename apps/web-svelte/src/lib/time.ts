export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  const pad = (n: number): string => (n < 10 ? `0${n}` : String(n))
  return `${pad(m)}:${pad(s)}`
}
