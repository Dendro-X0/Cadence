/**
 * Utility functions for time formatting.
 * One export per file: class Time with static helpers.
 */

/**
 * Time utilities.
 */
export class Time {
  /**
   * Left-pad a number with a leading zero when < 10.
   */
  public static pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  /**
   * Convert milliseconds to mm:ss.
   */
  public static toTime(ms: number): string {
    const total: number = Math.round(ms / 1000);
    const m: number = Math.floor(total / 60);
    const s: number = total % 60;
    return `${Time.pad(m)}:${Time.pad(s)}`;
  }
}
