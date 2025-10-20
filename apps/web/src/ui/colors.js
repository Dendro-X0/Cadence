/**
 * Map block type to accent color in hex.
 */
export function colorForType(type) {
    const map = {
        focus: '#38bdf8',
        break: '#22c55e',
        meditation: '#a855f7',
        workout: '#f59e0b',
        rest: '#14b8a6',
        custom: '#60a5fa'
    };
    return map[type] ?? '#38bdf8';
}
/**
 * Update CSS accent variable to match block type.
 */
export function setAccent(type) {
    document.documentElement.style.setProperty('--accent', colorForType(type));
}
