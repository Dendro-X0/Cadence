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
    static pad(n) {
        return n < 10 ? `0${n}` : `${n}`;
    }
    /**
     * Convert milliseconds to mm:ss.
     */
    static toTime(ms) {
        const total = Math.round(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${Time.pad(m)}:${Time.pad(s)}`;
    }
}
