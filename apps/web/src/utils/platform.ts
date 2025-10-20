/**
 * Platform utilities shared across web and desktop.
 * One export per file: Platform with static helpers.
 */

export class Platform {
  /**
   * True when running inside a Tauri desktop environment.
   */
  public static readonly isDesktop: boolean = Boolean(
    (window as unknown as { __TAURI__?: unknown }).__TAURI__
  );
}
