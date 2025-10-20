export interface NotifyInput {
  readonly title: string
  readonly body?: string
}

/**
 * Try to show a native/system notification via Tauri or the Web Notifications API.
 * Returns true if a notification was shown, false otherwise.
 */
export async function notify({ title, body }: NotifyInput): Promise<boolean> {
  const isDesktop = Boolean((window as unknown as { __TAURI__?: unknown }).__TAURI__)
  if (isDesktop) {
    try {
      const api = await import('@tauri-apps/plugin-notification') as typeof import('@tauri-apps/plugin-notification')
      if (!(await api.isPermissionGranted())) {
        const res = await api.requestPermission()
        if (res !== 'granted') return false
      }
      api.sendNotification({ title, body })
      return true
    } catch {
      // fallthrough to web
    }
  }
  if (typeof Notification !== 'undefined') {
    try {
      const status: NotificationPermission = Notification.permission
      if (status === 'granted') {
        new Notification(title, { body })
        return true
      }
      if (status !== 'denied') {
        const perm: NotificationPermission = await Notification.requestPermission()
        if (perm === 'granted') {
          new Notification(title, { body })
          return true
        }
      }
    } catch {
      return false
    }
  }
  return false
}
