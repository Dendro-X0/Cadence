/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'
import { showUpdateToast } from './stores/overlays'

export function setupPwa(): void {
  // Never register SW in development: avoids dev-sw cache/control issues during local debugging
  if (import.meta.env.DEV) return
  // Diagnostic: allow disabling SW with ?nosw=1 to bypass stale/broken workers after routing changes
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.get('cleanup') === '1') {
      // Self-cleanup: unregister workers and clear caches, then reload without the flag
      ;(async () => {
        try {
          const regs = await navigator.serviceWorker?.getRegistrations?.()
          if (regs && regs.length) await Promise.allSettled(regs.map(r => r.unregister()))
        } catch {}
        try {
          const names = await caches?.keys?.()
          if (names && names.length) await Promise.allSettled(names.map(n => caches.delete(n)))
        } catch {}
        url.searchParams.delete('cleanup')
        location.replace(url.toString())
      })()
      return
    }
    if (url.searchParams.get('nosw') === '1') return
  } catch {}
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      showUpdateToast('An update is available.', () => updateSW(true))
    },
    onOfflineReady() {
      // Optional: show a small note or toast that the app is ready offline
      console.info('App ready for offline use')
    },
    onRegisterError(err: unknown) {
      console.error('SW registration error', err)
    }
  })
}
