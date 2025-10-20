/**
 * CSS glass intensity controller for Windows (Option A).
 * Adds a class to documentElement: intensity-low|intensity-medium|intensity-high.
 */
export type GlassIntensity = 'low' | 'medium' | 'high'

export function applyGlassIntensity(intensity: GlassIntensity): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('intensity-low', 'intensity-medium', 'intensity-high')
  const cls = intensity === 'low' ? 'intensity-low' : intensity === 'high' ? 'intensity-high' : 'intensity-medium'
  root.classList.add(cls)
}
