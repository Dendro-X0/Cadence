/**
 * Compute total minutes for a template including repeat.
 */
export function totalMinutes(tpl) {
    const per = tpl.blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
    return Math.round(per * (tpl.repeat ?? 1));
}
/** Escape a string for HTML text nodes/attributes. */
export function escapeHtml(s) {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
/**
 * Determine the dominant block type in a template (by total minutes).
 */
export function dominantType(tpl) {
    const totals = { focus: 0, break: 0, meditation: 0, workout: 0, rest: 0, custom: 0 };
    tpl.blocks.forEach((b) => { totals[b.type] = (totals[b.type] ?? 0) + b.durationMinutes; });
    let best = 'focus';
    let bestVal = -1;
    for (const k in totals) {
        const key = k;
        const v = totals[key];
        if (v > bestVal) {
            bestVal = v;
            best = key;
        }
    }
    return best;
}
