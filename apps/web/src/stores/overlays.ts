import { writable, type Writable } from 'svelte/store'

export type OverlaysState = {
  readonly countdownVisible: boolean
  readonly countdownSeconds: number
  readonly shortcutsVisible: boolean
  readonly confirmVisible?: boolean
  readonly confirmTitle?: string
  readonly confirmText?: string
  readonly confirmAcceptLabel?: string
  readonly confirmCancelLabel?: string
  readonly confirmSummary?: readonly { label: string; minutes: number; type?: string }[]
  readonly confirmRepeat?: number
  readonly updateVisible?: boolean
  readonly updateMessage?: string
}

const initial: OverlaysState = { countdownVisible: false, countdownSeconds: 3, shortcutsVisible: false, confirmVisible: false, updateVisible: false, updateMessage: undefined }
export const overlays: Writable<OverlaysState> = writable(initial)

export async function showCountdown(seconds: number): Promise<void> {
  const secs: number = Math.max(0, Math.floor(seconds))
  if (secs <= 0) return
  overlays.set({ countdownVisible: true, countdownSeconds: secs, shortcutsVisible: false })
  await new Promise<void>((resolve) => {
    let cur = secs
    const id = window.setInterval(() => {
      cur -= 1
      overlays.update((o) => ({ ...o, countdownSeconds: Math.max(0, cur) }))
      if (cur <= 0) { window.clearInterval(id); resolve() }
    }, 1000)
  })
  overlays.update((o) => ({ ...o, countdownVisible: false }))
}

export function toggleShortcuts(): void {
  overlays.update((o) => ({ ...o, shortcutsVisible: !o.shortcutsVisible }))
}

export function hideShortcuts(): void { overlays.update((o) => ({ ...o, shortcutsVisible: false })) }

// Confirm overlay
let confirmResolver: ((ok: boolean) => void) | null = null
export type ConfirmOptions = {
  title?: string
  text?: string
  acceptLabel?: string
  cancelLabel?: string
  summary?: readonly { label: string; minutes: number; type?: string }[]
  repeat?: number
}
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  overlays.update((o) => ({
    ...o,
    confirmVisible: true,
    confirmTitle: opts.title ?? 'Confirm',
    confirmText: opts.text ?? '',
    confirmAcceptLabel: opts.acceptLabel ?? 'OK',
    confirmCancelLabel: opts.cancelLabel ?? 'Cancel',
    confirmSummary: opts.summary ?? undefined,
    confirmRepeat: opts.repeat ?? undefined
  }))
  return new Promise<boolean>((resolve) => { confirmResolver = resolve })
}
export function confirmAccept(): void {
  if (confirmResolver) { confirmResolver(true); confirmResolver = null }
  overlays.update((o) => ({ ...o, confirmVisible: false }))
}
export function confirmCancel(): void {
  if (confirmResolver) { confirmResolver(false); confirmResolver = null }
  overlays.update((o) => ({ ...o, confirmVisible: false }))
}

// Update toast (PWA SW refresh)
let updateApply: (() => void) | null = null
export function showUpdateToast(message: string, apply: () => void): void {
  updateApply = apply
  overlays.update((o) => ({ ...o, updateVisible: true, updateMessage: message }))
}
export function acceptUpdate(): void {
  const fn = updateApply; updateApply = null
  overlays.update((o) => ({ ...o, updateVisible: false }))
  if (fn) fn()
}
export function dismissUpdate(): void {
  updateApply = null
  overlays.update((o) => ({ ...o, updateVisible: false }))
}
