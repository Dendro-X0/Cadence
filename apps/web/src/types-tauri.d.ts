declare module '@tauri-apps/api/event' {
  export type UnlistenFn = () => void
  export function emit(event: string, payload?: unknown): Promise<void>
  export function listen<T = unknown>(event: string, handler: (event: { event: string; payload: T }) => void): Promise<UnlistenFn>
}

declare module '@tauri-apps/api/webviewWindow' {
  export interface WebviewWindowOptions {
    url?: string
    width?: number
    height?: number
    decorations?: boolean
    resizable?: boolean
    alwaysOnTop?: boolean
  }
  export class WebviewWindow {
    constructor(label: string, options?: WebviewWindowOptions)
    static getByLabel(label: string): WebviewWindow | undefined
    close(): Promise<void>
  }
}

declare module '@tauri-apps/api/notification' {
  export function isPermissionGranted(): Promise<boolean>
  export function requestPermission(): Promise<'granted' | 'denied'>
  export function sendNotification(options: { title: string; body?: string }): void
}
