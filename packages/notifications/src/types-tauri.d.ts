declare module '@tauri-apps/api/notification' {
  export function isPermissionGranted(): Promise<boolean>
  export function requestPermission(): Promise<'granted' | 'denied'>
  export function sendNotification(options: { title: string; body?: string }): void
}
