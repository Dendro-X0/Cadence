declare module '@tauri-apps/api/shell' {
  export function open(target: string): Promise<void>
}
