export async function ensureNotifyPermission(): Promise<boolean> {
  const isDesktop = Boolean((window as unknown as { __TAURI__?: unknown }).__TAURI__)
  if (isDesktop) {
    try {
      const api = await import('@tauri-apps/plugin-notification') as typeof import('@tauri-apps/plugin-notification')
      if (await api.isPermissionGranted()) return true
      const res = await api.requestPermission()
      return res === 'granted'
    } catch {
      // fallthrough to web
    }
  }
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') return true
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission()
      return res === 'granted'
    }
  }
  return false
}
