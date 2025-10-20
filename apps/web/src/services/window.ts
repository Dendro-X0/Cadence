import { Platform } from '../utils/platform'

export type TauriWindow = {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  unmaximize: () => Promise<void>
  isMaximized: () => Promise<boolean>
  close: () => Promise<void>
}

/**
 * Initialize desktop-only window chrome (frameless custom controls).
 * No-op on web.
 */
export async function initDesktopWindowControls(): Promise<void> {
  if (!Platform.isDesktop) return
  document.documentElement.setAttribute('data-platform', 'desktop')

  // Reveal custom window buttons
  const controls = document.querySelector<HTMLDivElement>('.win-controls')
  if (controls) controls.style.display = 'flex'

  // Resolve current Tauri window
  let win: TauriWindow | null = null
  try {
    const mod: any = await import('@tauri-apps/api/window')
    win = (mod?.appWindow as TauriWindow) ?? (typeof mod?.getCurrent === 'function' ? (mod.getCurrent() as TauriWindow) : null)
  } catch {
    // ignore
  }

  const btnMin = document.querySelector<HTMLButtonElement>('#win-min')
  const btnMax = document.querySelector<HTMLButtonElement>('#win-max')
  const btnClose = document.querySelector<HTMLButtonElement>('#win-close')
  if (win && btnMin) btnMin.onclick = () => { try { void win!.minimize() } catch {} }
  if (win && btnMax) btnMax.onclick = async () => { try { (await win!.isMaximized()) ? void win!.unmaximize() : void win!.maximize() } catch {} }
  if (win && btnClose) btnClose.onclick = () => { try { void win!.close() } catch {} }

  // Header double-click toggles maximize/restore
  const header = document.querySelector<HTMLDivElement>('.header')
  if (win && header) header.ondblclick = async () => { try { (await win!.isMaximized()) ? void win!.unmaximize() : void win!.maximize() } catch {} }
}
