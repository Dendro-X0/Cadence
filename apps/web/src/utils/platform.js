/**
 * Platform utilities shared across web and desktop.
 * One export per file: Platform with static helpers.
 */
export class Platform {
}
/**
 * True when running inside a Tauri desktop environment.
 */
Object.defineProperty(Platform, "isDesktop", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: Boolean(window.__TAURI__)
});
