declare module 'qrcode' {
  /** Minimal typing for the browser build of `qrcode`. */
  const _default: {
    /** Generates a data URL (PNG) for the given text/URL. */
    toDataURL: (text: string) => Promise<string>
  }
  export default _default
}
