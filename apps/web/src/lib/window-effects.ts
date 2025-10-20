import { invoke } from '@tauri-apps/api/core'

export type WindowEffect = 'off' | 'acrylic' | 'mica'

export async function applyWindowEffect(effect: WindowEffect): Promise<void> {
  setEffectClass(effect)
  try {
    await invoke('set_window_effect', { effect })
  } catch (e) {
    // In web build or unsupported platform, this will throw. Ignore.
    console.warn('applyWindowEffect failed', e)
  }
}

/**
 * Toggle a root DOM class so CSS can adapt backgrounds when native effects are on.
 */
function setEffectClass(effect: WindowEffect): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('effect-off', 'effect-acrylic', 'effect-mica')
  if (effect === 'off') root.classList.add('effect-off')
  if (effect === 'acrylic') root.classList.add('has-window-effect', 'effect-acrylic')
  else if (effect === 'mica') root.classList.add('has-window-effect', 'effect-mica')
  else root.classList.remove('has-window-effect')
}
