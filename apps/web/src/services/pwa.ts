import { registerSW } from 'virtual:pwa-register'
import { appConstants } from '@cadence/core-domain/constants'

let _installDeferred: BeforeInstallPromptEvent | null = null

/**
 * Register service worker for the PWA and handle update flow.
 */
export function setupPwa(): void {
  const update = registerSW({
    onNeedRefresh() {
      showUpdateToast('Update available', 'Reload', () => update(true))
    },
    onOfflineReady() { showToast('App is ready to work offline.') },
    onRegisterError(err) { console.error('SW registration error', err) }
  })
  // Custom install banner using beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault?.()
    _installDeferred = e as BeforeInstallPromptEvent
    window.dispatchEvent(new CustomEvent('cadence:install-available'))
    showInstallBanner({ onInstall: async () => { void requestInstall(); }, onDismiss: () => { hideInstallBanner() } })
  })

  // Offline/online banner
  const applyOffline = (): void => { if (!navigator.onLine) showOfflineBanner(); else hideOfflineBanner() }
  window.addEventListener('offline', applyOffline)
  window.addEventListener('online', applyOffline)
  applyOffline()
}

/**
 * Show a lightweight toast near the bottom of the viewport.
 */
export function showToast(message: string): void {
  let el = document.querySelector<HTMLDivElement>('#toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast'
    el.className = 'toast'
    document.body.appendChild(el)
  }
  el.textContent = message
  el.classList.add('show')
  window.setTimeout(() => el && el.classList.remove('show'), appConstants.toastDurationMs)
}

/** Show a toast with an action button. */
function showUpdateToast(message: string, actionLabel: string, onAction: () => void): void {
  let host = document.querySelector<HTMLDivElement>('#toast-action')
  if (!host) {
    host = document.createElement('div')
    host.id = 'toast-action'
    host.className = 'toast toast--action'
    const msg = document.createElement('span')
    msg.className = 'toast__msg'
    const btn = document.createElement('button')
    btn.className = 'btn primary'
    btn.style.marginLeft = '8px'
    btn.onclick = () => { onAction(); host?.classList.remove('show') }
    host.appendChild(msg)
    host.appendChild(btn)
    document.body.appendChild(host)
  }
  const msgEl = host.querySelector<HTMLSpanElement>('.toast__msg')!
  const btnEl = host.querySelector<HTMLButtonElement>('button')!
  msgEl.textContent = message
  btnEl.textContent = actionLabel
  host.classList.add('show')
}

/** Lightweight types for beforeinstallprompt */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted'|'dismissed' }>
}

function showInstallBanner(args: { onInstall: () => void; onDismiss: () => void }): void {
  if (document.querySelector('#install-overlay')) return
  const overlay = document.createElement('div')
  overlay.id = 'install-overlay'
  overlay.className = 'overlay'
  const card = document.createElement('div')
  card.className = 'overlay__card'
  const title = document.createElement('div')
  title.className = 'overlay__title'
  title.textContent = 'Install Cadence?'
  const content = document.createElement('div')
  content.className = 'overlay__content'
  content.innerHTML = '<p>Install the app for a better, offline-first experience.</p>'
  const actions = document.createElement('div')
  actions.className = 'overlay__actions'
  const btnCancel = document.createElement('button')
  btnCancel.className = 'btn secondary'
  btnCancel.textContent = 'Not now'
  const btnInstall = document.createElement('button')
  btnInstall.className = 'btn primary'
  btnInstall.textContent = 'Install'
  btnCancel.onclick = () => { args.onDismiss(); overlay.remove() }
  btnInstall.onclick = () => { args.onInstall(); overlay.remove() }
  actions.appendChild(btnCancel); actions.appendChild(btnInstall)
  card.appendChild(title); card.appendChild(content); card.appendChild(actions)
  overlay.appendChild(card)
  document.body.appendChild(overlay)
}

function hideInstallBanner(): void {
  document.querySelector('#install-overlay')?.remove()
}

export function isInstallAvailable(): boolean { return _installDeferred != null }

export async function requestInstall(): Promise<'accepted'|'dismissed'|'unavailable'> {
  if (!_installDeferred) return 'unavailable'
  const d = _installDeferred
  _installDeferred = null
  try {
    await d.prompt()
    const res = await d.userChoice
    return res.outcome
  } catch { return 'dismissed' }
}

function showOfflineBanner(): void {
  let el = document.querySelector<HTMLDivElement>('#offline-banner')
  if (!el) {
    el = document.createElement('div')
    el.id = 'offline-banner'
    el.textContent = 'You are offline.'
    document.body.appendChild(el)
  }
  el.classList.add('show')
}
function hideOfflineBanner(): void {
  const el = document.querySelector<HTMLDivElement>('#offline-banner')
  el?.classList.remove('show')
}
