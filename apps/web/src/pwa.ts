/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'
import { showUpdateToast } from './stores/overlays'

export function setupPwa(): void {
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
